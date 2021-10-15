const Apify = require('apify');
const { writeFile } = require('fs/promises');
const { fetchCompatibilityVersions, puppeteerVersion, areVersionsCompatible, downloadClosestChromeInstaller } = require('./puppeteer_utils');

const isV1 = typeof Apify.launchPlaywright === 'function';

/**
 * @param {import('puppeteer').Browser} browser
 */
async function downloadLatestCompatibleChrome(browser) {
    const compatibilities = await fetchCompatibilityVersions(browser);

    const matchedCompatibilityVersions = compatibilities.filter(cv => {
        return areVersionsCompatible(cv.pptr, puppeteerVersion);
    });

    if (!matchedCompatibilityVersions.length) {
        throw new Error(`Puppeteer Chrome download failed: puppeteer version "${puppeteerVersion}" not found`);
    }

    // Get the latest chrome version
    const compatibleChromeVersion = matchedCompatibilityVersions
        .map(v => v.chrome)
        .sort((a, b) => b.localeCompare(a))[0];

    const buffer = await downloadClosestChromeInstaller(browser, compatibleChromeVersion);
    await writeFile('/tmp/chrome.deb', buffer);
}

(async () => {
	console.log('Downloading the latest Chrome compatible with the version of Puppeteer that is installed');
	// We need --no-sandbox, because even though the build is running on GitHub, the test is running in Docker.
    const launchOptions = { headless: true, args: ['--no-sandbox'] };
    const launchContext = isV1
        ? { launchOptions }
        : { ...launchOptions };

    /** @type {import('puppeteer').Browser} */
    const browser = await Apify.launchPuppeteer(launchContext);

    try {
        await downloadLatestCompatibleChrome(browser);
    } finally {
        await browser.close();
    }
})();
