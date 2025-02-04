import { shouldUseLastFive, supportedNodeVersions } from '../../shared/constants';
import { fetchPackageVersions } from '../../shared/npm';

const playwrightVersions = await fetchPackageVersions('playwright');
const apifyVersions = await fetchPackageVersions('apify');
const crawleeVersions = await fetchPackageVersions('crawlee');

if (!shouldUseLastFive) {
	console.warn('Testing with only the latest version of playwright to speed up CI');
}

const latestFivePlaywrightVersions = playwrightVersions.slice(shouldUseLastFive ? -5 : -1);
const latestPlaywrightVersion = latestFivePlaywrightVersions.at(-1)!;
const latestApifyVersion = apifyVersions.at(-1)!;
const latestCrawleeVersion = crawleeVersions.at(-1)!;

console.error('Latest five versions', latestFivePlaywrightVersions);
console.error('Latest apify version', latestApifyVersion);
console.error('Latest crawlee version', latestCrawleeVersion);

const imageNames = [
	'node-playwright',
	'node-playwright-chrome',
	'node-playwright-firefox',
	'node-playwright-webkit',
] as const;

const matrix = {
	include: [] as {
		'image-name': (typeof imageNames)[number];
		'node-version': string;
		'playwright-version': string;
		'apify-version': string;
		'crawlee-version': string;
		'is-latest': 'true' | 'false';
	}[],
};

for (const nodeVersion of supportedNodeVersions) {
	for (const playwrightVersion of latestFivePlaywrightVersions) {
		for (const imageName of imageNames) {
			matrix.include.push({
				'image-name': imageName,
				'node-version': nodeVersion,
				'playwright-version': playwrightVersion,
				'apify-version': `^${latestApifyVersion}`,
				'crawlee-version': `^${latestCrawleeVersion}`,
				'is-latest': playwrightVersion === latestPlaywrightVersion ? 'true' : 'false',
			});
		}
	}
}

console.log(JSON.stringify(matrix));
