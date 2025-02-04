import { shouldUseLastFive, supportedNodeVersions } from '../../shared/constants';
import { fetchPackageVersions } from '../../shared/npm';

const puppeteerVersions = await fetchPackageVersions('puppeteer');
const apifyVersions = await fetchPackageVersions('apify');
const crawleeVersions = await fetchPackageVersions('crawlee');

if (!shouldUseLastFive) {
	console.warn('Testing with only the latest version of puppeteer to speed up CI');
}

const latestFivePuppeteerVersions = puppeteerVersions.slice(shouldUseLastFive ? -5 : -1);
const latestPuppeteerVersion = latestFivePuppeteerVersions.at(-1)!;
const latestApifyVersion = apifyVersions.at(-1)!;
const latestCrawleeVersion = crawleeVersions.at(-1)!;

console.error('Latest five versions', latestFivePuppeteerVersions);
console.error('Latest apify version', latestApifyVersion);
console.error('Latest crawlee version', latestCrawleeVersion);

const matrix = {
	include: [] as {
		'image-name': 'node-puppeteer-chrome';
		'node-version': string;
		'puppeteer-version': string;
		'apify-version': string;
		'crawlee-version': string;
		'is-latest': 'true' | 'false';
	}[],
};

for (const nodeVersion of supportedNodeVersions) {
	for (const puppeteerVersion of latestFivePuppeteerVersions) {
		matrix.include.push({
			'image-name': 'node-puppeteer-chrome',
			'node-version': nodeVersion,
			'puppeteer-version': puppeteerVersion,
			'apify-version': `^${latestApifyVersion}`,
			'crawlee-version': `^${latestCrawleeVersion}`,
			'is-latest': puppeteerVersion === latestPuppeteerVersion ? 'true' : 'false',
		});
	}
}

console.log(JSON.stringify(matrix));
