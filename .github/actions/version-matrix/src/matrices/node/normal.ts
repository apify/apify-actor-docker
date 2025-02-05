import { needsToRunMatrixGeneration, updateCacheState, type CacheValues } from '../../shared/cache.ts';
import { emptyMatrix, latestNodeVersion, supportedNodeVersions } from '../../shared/constants.ts';
import { fetchPackageVersions } from '../../shared/npm.ts';

const apifyVersions = await fetchPackageVersions('apify');
const crawleeVersions = await fetchPackageVersions('crawlee');

const latestCrawleeVersion = crawleeVersions.at(-1)!;
const latestApifyVersion = apifyVersions.at(-1)!;

console.error('Latest crawlee version:', latestCrawleeVersion);
console.error('Latest apify version:', latestApifyVersion);

const cacheParams: CacheValues = {
	NODE_VERSION: supportedNodeVersions,
	APIFY_VERSION: [latestApifyVersion],
	CRAWLEE_VERSION: [latestCrawleeVersion],
};

if (!(await needsToRunMatrixGeneration('node:normal', cacheParams))) {
	console.error('Matrix generation is not needed, exiting.');

	console.log(emptyMatrix);

	process.exit(0);
}

const matrix = {
	include: [] as {
		'image-name': 'node';
		'node-version': string;
		'apify-version': string;
		'crawlee-version': string;
		'latest-node-version': string;
	}[],
};

for (const nodeVersion of supportedNodeVersions) {
	matrix.include.push({
		'image-name': 'node',
		'node-version': nodeVersion,
		// Node uses semver ranges for the versions
		'apify-version': `^${latestApifyVersion}`,
		'crawlee-version': `^${latestCrawleeVersion}`,
		'latest-node-version': latestNodeVersion,
	});
}

console.log(JSON.stringify(matrix));

await updateCacheState('node:normal', cacheParams);
