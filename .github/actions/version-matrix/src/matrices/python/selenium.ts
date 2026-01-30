import { type CacheValues, needsToRunMatrixGeneration, updateCacheState } from '../../shared/cache.ts';
import {
	emptyMatrix,
	latestPythonVersion,
	setParametersForTriggeringUpdateWorkflowOnActorTemplates,
	shouldUseLastFive,
	supportedPythonVersions,
} from '../../shared/constants.ts';
import { fetchPackageVersions } from '../../shared/pypi.ts';

const versions = await fetchPackageVersions('selenium');

if (!shouldUseLastFive) {
	console.warn('Testing with only the latest version of selenium to speed up CI');
}

const lastFiveSeleniumVersions = versions.slice(shouldUseLastFive ? -5 : -1);
const latestSeleniumVersion = lastFiveSeleniumVersions.at(-1)!;

console.error('Last five versions:', lastFiveSeleniumVersions);
console.error('Latest selenium version:', latestSeleniumVersion);

const cacheParams: CacheValues = {
	PYTHON_VERSION: supportedPythonVersions,
	SELENIUM_VERSION: lastFiveSeleniumVersions,
};

await setParametersForTriggeringUpdateWorkflowOnActorTemplates('python');

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
		'is-latest': 'true' | 'false';
		'latest-python-version': string;
	}[],
};

for (const pythonVersion of supportedPythonVersions) {
	for (const seleniumVersion of lastFiveSeleniumVersions) {
		matrix.include.push({
			'image-name': 'python-selenium',
			'python-version': pythonVersion,
			'selenium-version': seleniumVersion,
			'is-latest': seleniumVersion === latestSeleniumVersion ? 'true' : 'false',
			'latest-python-version': latestPythonVersion,
		});
	}
}

console.log(JSON.stringify(matrix));

await updateCacheState('python:selenium', cacheParams);
