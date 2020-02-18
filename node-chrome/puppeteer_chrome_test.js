const Apify = require('apify');
const { version: puppeteerVersion } = require('puppeteer/package.json');

const VERSION_REGEX = /([\d.?]+)/g;

/*
 * This file tests whether Puppeteer is compatible with installed Chrome,
 * by parsing the "Releases per Chromium Version" section from https://github.com/puppeteer/puppeteer/blob/master/docs/api.md:
 * Chromium 77.0.3803.0 - [Puppeteer v1.18.1](https://github.com/GoogleChrome/puppeteer/blob/v1.18.0/docs/api.md)
 * Chromium 76.0.3803.0 - [Puppeteer v1.17.0](https://github.com/GoogleChrome/puppeteer/blob/v1.17.0/docs/api.md)
 * Chromium 75.0.3765.0 - [Puppeteer v1.15.0](https://github.com/GoogleChrome/puppeteer/blob/v1.15.0/docs/api.md)
 * Chromium 74.0.3723.0 - [Puppeteer v1.13.0](https://github.com/GoogleChrome/puppeteer/blob/v1.13.0/docs/api.md)
 * Chromium 73.0.3679.0 - [Puppeteer v1.12.2](https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/docs/api.md)
 */

function parseCompatibilityVersions(text) {
    const versionsText = text.substring(
        text.indexOf('Releases per Chromium Version:'),
        text.indexOf('* [All releases]')
    );
    const versions = versionsText.split('\n')
        .filter(line => line.includes('* Chromium'))
        .map(line => {
            const vers = line.match(VERSION_REGEX);
            return { chrome: vers[0], pptr: vers[1] }
        });
    if (versions.length < 5){
        throw new Error('Cannot find and parse Puppeteer-Chromium versions from Markdown file.');
    }
    return versions;
}

function areMajorVersionsEqual(v1, v2) {
    const major1 = v1.split('.')[0];
    const major2 = v2.split('.')[0];
    return major1 === major2;
}

function trimPatchVersion(version) {
    return version.split('.').slice(0, 2).join('.');
}

const testCompatibility = async (browser) => {
    console.log('Puppeteer version: %s', puppeteerVersion);

    const chromeVersion = (await browser.version()).match(VERSION_REGEX)[0];
    console.log('Chrome version: %s', chromeVersion);

    const page = await browser.newPage();
    const apiResponse = await page.goto('https://raw.githubusercontent.com/GoogleChrome/puppeteer/master/docs/api.md');
    const compatibilityVersions = parseCompatibilityVersions(await apiResponse.text());
    console.log('Puppeteer compatibility versions are:');
    console.log(compatibilityVersions);

    const matchedCompatibilityVersion = compatibilityVersions.find(cv => {
        const cvMajorMinor = trimPatchVersion(cv.pptr);
        const pptrMajorMinor = trimPatchVersion(puppeteerVersion);
        return cvMajorMinor === pptrMajorMinor;
    });

    if (!matchedCompatibilityVersion) {
        throw new Error(`Puppeteer+Chrome test failed: puppeteer version "${puppeteerVersion}" not found`);
    }
    const compatibleChromeVersion = matchedCompatibilityVersion.chrome;
    if (!areMajorVersionsEqual(compatibleChromeVersion, chromeVersion)){
        throw new Error(`Puppeteer+Chrome test failed: puppeteer version "${puppeteerVersion}" is not compatible with Chrome version ${chromeVersion}, it's compatible with version ${compatibleChromeVersion}`);
    }

    console.log('Success, Puppeteer+Chrome are compatible!');
};

const testPageLoading = async browser => {
    const page = await browser.newPage();
    await page.goto('http://www.example.com');
    const pageTitle = await page.title();
    if (pageTitle !== 'Example Domain') {
        throw new Error(`Puppeteer+Chrome test failed - returned title "${pageTitle}"" !== "Example Domain"`);
    }
};

const testPuppeteerChrome = async () => {
    console.log('Testing Puppeteer with full Chrome');
    const browser = await Apify.launchPuppeteer({ headless: true, useChrome: true });
    await testCompatibility(browser);
    await testPageLoading(browser);
    await browser.close();
};

module.exports = testPuppeteerChrome;
