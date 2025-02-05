import { needsToRunMatrixGeneration, updateCacheState, type CacheValues } from '../../shared/cache.ts';
import { emptyMatrix, latestPythonVersion, supportedPythonVersions } from '../../shared/constants.ts';
import { fetchPackageVersions } from '../../shared/pypi.ts';

const apifyVersions = await fetchPackageVersions('apify');

const latestApifyVersion = apifyVersions.at(-1)!;

console.error('Latest apify version:', latestApifyVersion);

const cacheParams: CacheValues = {
	PYTHON_VERSION: supportedPythonVersions,
	APIFY_VERSION: [latestApifyVersion],
};

if (!(await needsToRunMatrixGeneration('python:normal', cacheParams))) {
	console.error('Matrix is up to date, skipping new image building');

	console.log(emptyMatrix);

	process.exit(0);
}

const matrix = {
	include: [] as {
		'image-name': 'python';
		'python-version': string;
		'apify-version': string;
		'latest-python-version': string;
	}[],
};

for (const pythonVersion of supportedPythonVersions) {
	matrix.include.push({
		'image-name': 'python',
		'python-version': pythonVersion,
		'apify-version': latestApifyVersion,
		'latest-python-version': latestPythonVersion,
	});
}

console.log(JSON.stringify(matrix));

await updateCacheState('python:normal', cacheParams);
