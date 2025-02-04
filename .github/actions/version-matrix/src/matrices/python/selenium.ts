import { needsToRunMatrixGeneration, updateCacheState, type CacheValues } from '../../shared/cache.ts';
import { emptyMatrix, shouldUseLastFive, supportedPythonVersions } from '../../shared/constants.ts';
import { fetchPackageVersions } from '../../shared/pypi.ts';

const versions = await fetchPackageVersions('selenium');
const apifyVersions = await fetchPackageVersions('apify');

if (!shouldUseLastFive) {
	console.warn('Testing with only the latest version of selenium to speed up CI');
}

const lastFiveSeleniumVersions = versions.slice(shouldUseLastFive ? -5 : -1);
const latestSeleniumVersion = lastFiveSeleniumVersions.at(-1)!;
const latestApifyVersion = apifyVersions.at(-1)!;

console.error('Last five versions:', lastFiveSeleniumVersions);
console.error('Latest selenium version:', latestSeleniumVersion);
console.error('Latest apify version:', latestApifyVersion);

const cacheParams: CacheValues = {
	PYTHON_VERSION: supportedPythonVersions,
	APIFY_VERSION: [latestApifyVersion],
	SELENIUM_VERSION: lastFiveSeleniumVersions,
};

if (!(await needsToRunMatrixGeneration('python:selenium', cacheParams))) {
	console.error('Matrix generation is not needed, exiting.');

	console.log(emptyMatrix);

	process.exit(0);
}

const matrix = {
	include: [] as {
		'image-name': 'python-selenium';
		'python-version': string;
		'selenium-version': string;
		'apify-version': string;
		'is-latest': 'true' | 'false';
	}[],
};

for (const pythonVersion of supportedPythonVersions) {
	for (const seleniumVersion of lastFiveSeleniumVersions) {
		matrix.include.push({
			'image-name': 'python-selenium',
			'python-version': pythonVersion,
			'selenium-version': seleniumVersion,
			'apify-version': latestApifyVersion,
			'is-latest': seleniumVersion === latestSeleniumVersion ? 'true' : 'false',
		});
	}
}

console.log(JSON.stringify(matrix));

await updateCacheState('python:selenium', cacheParams);
