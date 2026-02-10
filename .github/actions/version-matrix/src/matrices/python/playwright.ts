import { satisfies } from 'semver';
import {
	type CacheValues,
	getCertificatesUpdatedAt,
	needsToRunMatrixGeneration,
	updateCacheState,
} from '../../shared/cache.ts';
import {
	emptyMatrix,
	latestPythonVersion,
	setParametersForTriggeringUpdateWorkflowOnActorTemplates,
	shouldUseLastFive,
	supportedPythonVersions,
} from '../../shared/constants.ts';
import { fetchPackageVersions } from '../../shared/pypi.ts';

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

if (!shouldUseLastFive) {
	console.warn('Testing with only the latest version of playwright to speed up CI');
}

const latestFivePlaywrightVersions = playwrightVersions.slice(shouldUseLastFive ? -5 : -1);
const latestPlaywrightVersion = latestFivePlaywrightVersions.at(-1)!;
const latestCamoufoxVersion = camoufoxVersions.at(-1)!;

const certificatesUpdatedAt = await getCertificatesUpdatedAt();

console.error('Last five versions:', latestFivePlaywrightVersions);
console.error('Latest playwright version:', latestPlaywrightVersion);
console.error('Latest camoufox version:', latestCamoufoxVersion);
console.error('Certificates updated at:', certificatesUpdatedAt || '(not available)');

const cacheParams: CacheValues = {
	PYTHON_VERSION: supportedPythonVersions,
	PLAYWRIGHT_VERSION: latestFivePlaywrightVersions,
	CAMOUFOX_VERSION: [latestCamoufoxVersion],
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

const matrix = {
	include: [] as {
		'image-name': (typeof imageNames)[number];
		'python-version': string;
		'playwright-version': string;
		'camoufox-version': string;
		'is-latest': 'true' | 'false';
		'latest-python-version': string;
	}[],
};

for (const pythonVersion of supportedPythonVersions) {
	const maybePlaywrightVersionConstraint = playwrightPythonVersionConstraints.findLast(([constraint]) => {
		return satisfies(`${pythonVersion}.0`, constraint);
	})?.[1];

	for (const playwrightVersion of latestFivePlaywrightVersions) {
		if (maybePlaywrightVersionConstraint) {
			if (!satisfies(playwrightVersion, maybePlaywrightVersionConstraint)) {
				continue;
			}
		}

		for (const imageName of imageNames) {
			matrix.include.push({
				'image-name': imageName,
				'python-version': pythonVersion,
				'playwright-version': playwrightVersion,
				'camoufox-version': latestCamoufoxVersion,
				'is-latest': playwrightVersion === latestPlaywrightVersion ? 'true' : 'false',
				'latest-python-version': latestPythonVersion,
			});
		}
	}
}

console.log(JSON.stringify(matrix));

await updateCacheState('python:playwright', cacheParams);
