import { fetchPackageVersions } from '../../shared/pypi.ts';
import {
	emptyMatrix,
	latestPythonVersion,
	shouldUseLastFive,
	supportedPythonVersions,
} from '../../shared/constants.ts';
import { needsToRunMatrixGeneration, updateCacheState, type CacheValues } from '../../shared/cache.ts';
import { satisfies } from 'semver';

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

const versions = await fetchPackageVersions('playwright');
const apifyVersions = await fetchPackageVersions('apify');

if (!shouldUseLastFive) {
	console.warn('Testing with only the latest version of playwright to speed up CI');
}

const lastFivePlaywrightVersions = versions.slice(shouldUseLastFive ? -5 : -1);
const latestPlaywrightVersion = lastFivePlaywrightVersions.at(-1)!;
let latestApifyVersion = apifyVersions.at(-1)!;

console.error('Last five versions:', lastFivePlaywrightVersions);
console.error('Latest playwright version:', latestPlaywrightVersion);
console.error('Latest apify version:', latestApifyVersion);

if (process.env.APIFY_VERSION) {
	console.error('Using custom apify version:', process.env.APIFY_VERSION);
	latestApifyVersion = process.env.APIFY_VERSION;
}

const cacheParams: CacheValues = {
	PYTHON_VERSION: supportedPythonVersions,
	APIFY_VERSION: [latestApifyVersion],
	PLAYWRIGHT_VERSION: lastFivePlaywrightVersions,
};

if (!(await needsToRunMatrixGeneration('python:playwright', cacheParams))) {
	console.error('Matrix is up to date, skipping new image building');

	console.log(emptyMatrix);

	process.exit(0);
}

const matrix = {
	include: [] as {
		'image-name': 'python-playwright';
		'python-version': string;
		'playwright-version': string;
		'apify-version': string;
		'is-latest': 'true' | 'false';
		'latest-python-version': string;
	}[],
};

for (const pythonVersion of supportedPythonVersions) {
	const maybePlaywrightVersionConstraint = playwrightPythonVersionConstraints.findLast(([constraint]) => {
		return satisfies(`${pythonVersion}.0`, constraint);
	})?.[1];

	for (const playwrightVersion of lastFivePlaywrightVersions) {
		if (maybePlaywrightVersionConstraint) {
			if (!satisfies(playwrightVersion, maybePlaywrightVersionConstraint)) {
				continue;
			}
		}

		matrix.include.push({
			'image-name': 'python-playwright',
			'python-version': pythonVersion,
			'playwright-version': playwrightVersion,
			'apify-version': latestApifyVersion,
			'is-latest': playwrightVersion === latestPlaywrightVersion ? 'true' : 'false',
			'latest-python-version': latestPythonVersion,
		});
	}
}

console.log(JSON.stringify(matrix));

await updateCacheState('python:playwright', cacheParams);
