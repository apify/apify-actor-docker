import { supportedPythonVersions } from '../../shared/constants';
import { fetchPackageVersions } from '../../shared/pypi';

const versions = await fetchPackageVersions('selenium');
const apifyVersions = await fetchPackageVersions('apify');

const shouldUseLastFiveSelenium = process.env.GITHUB_EVENT_NAME
	? process.env.GITHUB_EVENT_NAME !== 'pull_request'
	: true;

if (!shouldUseLastFiveSelenium) {
	console.warn('Testing with only the latest version of selenium to speed up CI');
}

const lastFiveSeleniumVersions = versions.slice(shouldUseLastFiveSelenium ? -5 : -1);
const latestSeleniumVersion = lastFiveSeleniumVersions.at(-1)!;
const latestApifyVersion = apifyVersions.at(-1)!;

console.error('Last five versions:', lastFiveSeleniumVersions);
console.error('Latest selenium version:', latestSeleniumVersion);
console.error('Latest apify version:', latestApifyVersion);

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
