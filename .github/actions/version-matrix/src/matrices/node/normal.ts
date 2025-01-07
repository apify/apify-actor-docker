import { supportedNodeVersions } from '../../shared/constants';
import { fetchPackageVersions } from '../../shared/npm';

const apifyVersions = await fetchPackageVersions('apify');
const crawleeVersions = await fetchPackageVersions('crawlee');

const latestCrawleeVersion = crawleeVersions.at(-1)!;
const latestApifyVersion = apifyVersions.at(-1)!;

console.error('Latest crawlee version:', latestCrawleeVersion);
console.error('Latest apify version:', latestApifyVersion);

const matrix = {
	include: [] as {
		'image-name': 'node';
		'node-version': string;
		'apify-version': string;
		'crawlee-version': string;
	}[],
};

for (const nodeVersion of supportedNodeVersions) {
	matrix.include.push({
		'image-name': 'node',
		'node-version': nodeVersion,
		// Node uses semver ranges for the versions
		'apify-version': `^${latestApifyVersion}`,
		'crawlee-version': `^${latestCrawleeVersion}`,
	});
}

console.log(JSON.stringify(matrix));
