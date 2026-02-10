import {
	type CacheValues,
	getCertificatesUpdatedAt,
	needsToRunMatrixGeneration,
	updateCacheState,
} from '../../shared/cache.ts';
import {
	emptyMatrix,
	latestNodeVersion,
	setParametersForTriggeringUpdateWorkflowOnActorTemplates,
	shouldUseLastFive,
	supportedNodeVersions,
} from '../../shared/constants.ts';
import { fetchPackageVersions } from '../../shared/npm.ts';

const playwrightVersions = await fetchPackageVersions('playwright');
const apifyVersions = await fetchPackageVersions('apify');
const crawleeVersions = await fetchPackageVersions('crawlee');
const camoufoxVersions = await fetchPackageVersions('camoufox-js');

if (!shouldUseLastFive) {
	console.warn('Testing with only the latest version of playwright to speed up CI');
}

const latestFivePlaywrightVersions = playwrightVersions.slice(shouldUseLastFive ? -5 : -1);
const latestPlaywrightVersion = latestFivePlaywrightVersions.at(-1)!;
let latestApifyVersion = apifyVersions.at(-1)!;
let latestCrawleeVersion = crawleeVersions.at(-1)!;
let latestCamoufoxVersion = camoufoxVersions.at(-1)!;

const certificatesUpdatedAt = await getCertificatesUpdatedAt();

console.error('Latest five versions', latestFivePlaywrightVersions);
console.error('Latest apify version', latestApifyVersion);
console.error('Latest crawlee version', latestCrawleeVersion);
console.error('Latest camoufox version', latestCamoufoxVersion);
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
	PLAYWRIGHT_VERSION: latestFivePlaywrightVersions,
	APIFY_VERSION: [latestApifyVersion],
	CRAWLEE_VERSION: [latestCrawleeVersion],
	CAMOUFOX_VERSION: [latestCamoufoxVersion],
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
	}[],
};

for (const nodeVersion of supportedNodeVersions) {
	for (const playwrightVersion of latestFivePlaywrightVersions) {
		for (const imageName of imageNames) {
			matrix.include.push({
				'image-name': imageName,
				'node-version': nodeVersion,
				'playwright-version': playwrightVersion,
				'apify-version': `^${latestApifyVersion}`,
				'crawlee-version': `^${latestCrawleeVersion}`,
				'camoufox-version': `^${latestCamoufoxVersion}`,
				'is-latest': playwrightVersion === latestPlaywrightVersion ? 'true' : 'false',
				'latest-node-version': latestNodeVersion,
			});
		}
	}
}

console.log(JSON.stringify(matrix));

await updateCacheState('node:playwright', cacheParams);
