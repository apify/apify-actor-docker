import { supportedPythonVersions } from '../../shared/constants';
import { fetchPackageVersions } from '../../shared/pypi';

const apifyVersions = await fetchPackageVersions('apify');

const latestApifyVersion = apifyVersions.at(-1)!;

console.error('Latest apify version:', latestApifyVersion);

const matrix = {
	include: [] as {
		'image-name': 'python';
		'python-version': string;
		'apify-version': string;
	}[],
};

for (const pythonVersion of supportedPythonVersions) {
	matrix.include.push({
		'image-name': 'python',
		'python-version': pythonVersion,
		'apify-version': apifyVersions[pythonVersion],
	});
}

console.log(JSON.stringify(matrix));
