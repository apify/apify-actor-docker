import { satisfies } from 'semver';
import {
	type CacheValues,
	getCertificatesUpdatedAt,
	needsToRunMatrixGeneration,
	updateCacheState,
} from '../../shared/cache.ts';
import { resolveCamoufoxPlaywrightVersions } from '../../shared/camoufox.ts';
import {
	emptyMatrix,
	latestPythonVersion,
	setParametersForTriggeringUpdateWorkflowOnActorTemplates,
	shouldUseLastFive,
	supportedPythonVersions,
} from '../../shared/constants.ts';
import { fetchPackageVersions } from '../../shared/pypi.ts';
import { fetchPythonRuntimeVersions } from '../../shared/runtime-versions.ts';

/**
 * Certain playwright versions will not run on newer Python versions.
 * For example, playwright <1.48.0 will not run on python 3.13+
 * The key represents the python version range where this starts taking effect.
 * The value is the playwright version range that is required for the python version.
 */
const playwrightPythonVersionConstraints = [
	// Python, playwright
	['>=3.13.x', '>=1.48.0'],
];

const playwrightVersions = await fetchPackageVersions('playwright');
const camoufoxVersions = await fetchPackageVersions('camoufox');
const pythonRuntimeVersions = await fetchPythonRuntimeVersions(supportedPythonVersions);

if (!shouldUseLastFive) {
	console.warn('Testing with only the latest version of playwright to speed up CI');
}

const latestFivePlaywrightVersions = playwrightVersions.slice(shouldUseLastFive ? -5 : -1);
const latestPlaywrightVersion = latestFivePlaywrightVersions.at(-1)!;
const latestCamoufoxVersion = camoufoxVersions.at(-1)!;

// Camoufox does not support every Playwright release, so its images are built with the newest Playwright versions it
// declares support for, picked from all releases instead of just the last five - otherwise the camoufox image would
// drop out of the matrix entirely once the last five releases are all unsupported.
const { range: camoufoxPlaywrightRange, versions: supportedCamoufoxPlaywrightVersions } =
	await resolveCamoufoxPlaywrightVersions('python', latestCamoufoxVersion, playwrightVersions);
const camoufoxPlaywrightVersions = supportedCamoufoxPlaywrightVersions.slice(shouldUseLastFive ? -5 : -1);
const latestCamoufoxPlaywrightVersion = camoufoxPlaywrightVersions.at(-1);

const certificatesUpdatedAt = await getCertificatesUpdatedAt();

console.error('Last five versions:', latestFivePlaywrightVersions);
console.error('Latest playwright version:', latestPlaywrightVersion);
console.error('Latest camoufox version:', latestCamoufoxVersion);
console.error(
	`Playwright versions for camoufox (camoufox==${latestCamoufoxVersion} supports ${camoufoxPlaywrightRange ?? 'nothing we could resolve'}):`,
	camoufoxPlaywrightVersions.length ? camoufoxPlaywrightVersions : '(none, camoufox images will be skipped)',
);
console.error('Python runtime versions:', pythonRuntimeVersions);
console.error('Certificates updated at:', certificatesUpdatedAt || '(not available)');

const cacheParams: CacheValues = {
	PYTHON_VERSION: supportedPythonVersions,
	PYTHON_RUNTIME_VERSION: pythonRuntimeVersions,
	PLAYWRIGHT_VERSION: latestFivePlaywrightVersions,
	CAMOUFOX_VERSION: [latestCamoufoxVersion],
	CAMOUFOX_PLAYWRIGHT_VERSION: camoufoxPlaywrightVersions,
	CERTIFICATES_UPDATED_AT: certificatesUpdatedAt ? [certificatesUpdatedAt] : [],
};

await setParametersForTriggeringUpdateWorkflowOnActorTemplates('python', latestPlaywrightVersion);

if (!(await needsToRunMatrixGeneration('python:playwright', cacheParams))) {
	console.error('Matrix is up to date, skipping new image building');

	console.log(emptyMatrix);

	process.exit(0);
}

const imageNames = [
	'python-playwright',
	'python-playwright-chrome',
	'python-playwright-firefox',
	'python-playwright-webkit',
	'python-playwright-camoufox',
] as const;

// Images that require Chrome/Chromium cannot be built for arm64 on Linux
const arm64UnsupportedImages: ReadonlySet<string> = new Set(['python-playwright', 'python-playwright-chrome']);

const matrix = {
	include: [] as {
		'image-name': (typeof imageNames)[number];
		'python-version': string;
		'playwright-version': string;
		'camoufox-version': string;
		'is-latest': 'true' | 'false';
		'latest-python-version': string;
		'supports-arm64': 'true' | 'false';
	}[],
};

for (const pythonVersion of supportedPythonVersions) {
	const maybePlaywrightVersionConstraint = playwrightPythonVersionConstraints.findLast(([constraint]) => {
		return satisfies(`${pythonVersion}.0`, constraint);
	})?.[1];

	for (const imageName of imageNames) {
		const isCamoufoxImage = imageName === 'python-playwright-camoufox';

		// The camoufox image only supports a subset of the Playwright versions, so it gets its own version list, along
		// with its own "latest" version - otherwise it would never receive the moving tags (e.g. `:3.14`, `:latest`).
		const imagePlaywrightVersions = isCamoufoxImage ? camoufoxPlaywrightVersions : latestFivePlaywrightVersions;
		const latestImagePlaywrightVersion = isCamoufoxImage
			? latestCamoufoxPlaywrightVersion
			: latestPlaywrightVersion;

		for (const playwrightVersion of imagePlaywrightVersions) {
			if (maybePlaywrightVersionConstraint) {
				if (!satisfies(playwrightVersion, maybePlaywrightVersionConstraint)) {
					continue;
				}
			}

			matrix.include.push({
				'image-name': imageName,
				'python-version': pythonVersion,
				'playwright-version': playwrightVersion,
				'camoufox-version': latestCamoufoxVersion,
				'is-latest': playwrightVersion === latestImagePlaywrightVersion ? 'true' : 'false',
				'latest-python-version': latestPythonVersion,
				'supports-arm64': arm64UnsupportedImages.has(imageName) ? 'false' : 'true',
			});
		}
	}
}

console.log(JSON.stringify(matrix));

await updateCacheState('python:playwright', cacheParams);
