import { satisfies } from 'semver';
import {
	type CacheValues,
	getCertificatesUpdatedAt,
	needsToRunMatrixGeneration,
	updateCacheState,
} from '../../shared/cache.ts';
import {
	camoufoxPlaywrightVersionRange,
	emptyMatrix,
	latestNodeVersion,
	setParametersForTriggeringUpdateWorkflowOnActorTemplates,
	shouldUseLastFive,
	supportedNodeVersions,
} from '../../shared/constants.ts';
import { fetchPackageVersions } from '../../shared/npm.ts';
import { fetchNodeRuntimeVersions } from '../../shared/runtime-versions.ts';

const playwrightVersions = await fetchPackageVersions('playwright');
const apifyVersions = await fetchPackageVersions('apify');
const crawleeVersions = await fetchPackageVersions('crawlee');
const camoufoxVersions = await fetchPackageVersions('camoufox-js');
const nodeRuntimeVersions = await fetchNodeRuntimeVersions(supportedNodeVersions);

if (!shouldUseLastFive) {
	console.warn('Testing with only the latest version of playwright to speed up CI');
}

const latestFivePlaywrightVersions = playwrightVersions.slice(shouldUseLastFive ? -5 : -1);
const latestPlaywrightVersion = latestFivePlaywrightVersions.at(-1)!;
let latestApifyVersion = apifyVersions.at(-1)!;
let latestCrawleeVersion = crawleeVersions.at(-1)!;
let latestCamoufoxVersion = camoufoxVersions.at(-1)!;

// Camoufox is incompatible with the newest Playwright releases, so its images are built with the newest Playwright
// versions Camoufox still supports, picked from all releases instead of just the last five.
const camoufoxPlaywrightVersions = playwrightVersions
	.filter((version) => satisfies(version, camoufoxPlaywrightVersionRange))
	.slice(shouldUseLastFive ? -5 : -1);
const latestCamoufoxPlaywrightVersion = camoufoxPlaywrightVersions.at(-1);

const certificatesUpdatedAt = await getCertificatesUpdatedAt();

console.error('Latest five versions', latestFivePlaywrightVersions);
console.error('Latest apify version', latestApifyVersion);
console.error('Latest crawlee version', latestCrawleeVersion);
console.error('Latest camoufox version', latestCamoufoxVersion);
console.error(
	`Playwright versions for camoufox (${camoufoxPlaywrightVersionRange})`,
	camoufoxPlaywrightVersions.length ? camoufoxPlaywrightVersions : '(none, camoufox images will be skipped)',
);
console.error('Node runtime versions', nodeRuntimeVersions);
console.error('Certificates updated at', certificatesUpdatedAt || '(not available)');

if (process.env.CRAWLEE_VERSION) {
	console.error('Using custom crawlee version:', process.env.CRAWLEE_VERSION);
	latestCrawleeVersion = process.env.CRAWLEE_VERSION;
}

if (process.env.APIFY_VERSION) {
	console.error('Using custom apify version:', process.env.APIFY_VERSION);
	latestApifyVersion = process.env.APIFY_VERSION;
}

const cacheParams: CacheValues = {
	NODE_VERSION: supportedNodeVersions,
	NODE_RUNTIME_VERSION: nodeRuntimeVersions,
	PLAYWRIGHT_VERSION: latestFivePlaywrightVersions,
	APIFY_VERSION: [latestApifyVersion],
	CRAWLEE_VERSION: [latestCrawleeVersion],
	CAMOUFOX_VERSION: [latestCamoufoxVersion],
	CAMOUFOX_PLAYWRIGHT_VERSION: camoufoxPlaywrightVersions,
	CERTIFICATES_UPDATED_AT: certificatesUpdatedAt ? [certificatesUpdatedAt] : [],
};

await setParametersForTriggeringUpdateWorkflowOnActorTemplates('node', latestPlaywrightVersion);

if (!(await needsToRunMatrixGeneration('node:playwright', cacheParams))) {
	console.error('Matrix generation is not needed, exiting.');

	console.log(emptyMatrix);

	process.exit(0);
}

const imageNames = [
	'node-playwright',
	'node-playwright-chrome',
	'node-playwright-firefox',
	'node-playwright-webkit',
	'node-playwright-camoufox',
] as const;

// Images that require Chrome/Chromium cannot be built for arm64 on Linux
const arm64UnsupportedImages: ReadonlySet<string> = new Set(['node-playwright', 'node-playwright-chrome']);

const matrix = {
	include: [] as {
		'image-name': (typeof imageNames)[number];
		'node-version': string;
		'playwright-version': string;
		'apify-version': string;
		'crawlee-version': string;
		'camoufox-version': string;
		'is-latest': 'true' | 'false';
		'latest-node-version': string;
		'supports-arm64': 'true' | 'false';
	}[],
};

for (const nodeVersion of supportedNodeVersions) {
	for (const imageName of imageNames) {
		const isCamoufoxImage = imageName === 'node-playwright-camoufox';

		// The camoufox image only supports a subset of the Playwright versions, so it gets its own version list, along
		// with its own "latest" version - otherwise it would never receive the moving tags (e.g. `:24`, `:latest`).
		const imagePlaywrightVersions = isCamoufoxImage ? camoufoxPlaywrightVersions : latestFivePlaywrightVersions;
		const latestImagePlaywrightVersion = isCamoufoxImage
			? latestCamoufoxPlaywrightVersion
			: latestPlaywrightVersion;

		for (const playwrightVersion of imagePlaywrightVersions) {
			matrix.include.push({
				'image-name': imageName,
				'node-version': nodeVersion,
				'playwright-version': playwrightVersion,
				'apify-version': `^${latestApifyVersion}`,
				'crawlee-version': `^${latestCrawleeVersion}`,
				'camoufox-version': `^${latestCamoufoxVersion}`,
				'is-latest': playwrightVersion === latestImagePlaywrightVersion ? 'true' : 'false',
				'latest-node-version': latestNodeVersion,
				'supports-arm64': arm64UnsupportedImages.has(imageName) ? 'false' : 'true',
			});
		}
	}
}

console.log(JSON.stringify(matrix));

await updateCacheState('node:playwright', cacheParams);
