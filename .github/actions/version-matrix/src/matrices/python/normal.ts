import { type CacheValues, needsToRunMatrixGeneration, updateCacheState } from '../../shared/cache.ts';
import {
	emptyMatrix,
	latestPythonVersion,
	setParametersForTriggeringUpdateWorkflowOnActorTemplates,
	supportedPythonVersions,
} from '../../shared/constants.ts';

const cacheParams: CacheValues = {
	PYTHON_VERSION: supportedPythonVersions,
};

await setParametersForTriggeringUpdateWorkflowOnActorTemplates('python');

if (!(await needsToRunMatrixGeneration('python:normal', cacheParams))) {
	console.error('Matrix is up to date, skipping new image building');

	console.log(emptyMatrix);

	process.exit(0);
}

const matrix = {
	include: [] as {
		'image-name': 'python';
		'python-version': string;
		'latest-python-version': string;
	}[],
};

for (const pythonVersion of supportedPythonVersions) {
	matrix.include.push({
		'image-name': 'python',
		'python-version': pythonVersion,
		'latest-python-version': latestPythonVersion,
	});
}

console.log(JSON.stringify(matrix));

await updateCacheState('python:normal', cacheParams);
