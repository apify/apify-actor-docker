const Apify = require('apify');
const { puppeteerVersion, VERSION_REGEX, areVersionsCompatible, fetchCompatibilityVersions } = require('./puppeteer_utils');

const isV1 = typeof Apify.launchPlaywright === 'function';

/*
 * This file tests whether Puppeteer is compatible with installed Chrome,
 * by parsing the "Releases per Chromium Version" section from https://github.com/puppeteer/puppeteer/blob/master/docs/api.md
 * Examples:
 * Chromium 77.0.3803.0 - [Puppeteer v1.18.1](https://github.com/GoogleChrome/puppeteer/blob/v1.18.0/docs/api.md)
 * Chromium 76.0.3803.0 - [Puppeteer v1.17.0](https://github.com/GoogleChrome/puppeteer/blob/v1.17.0/docs/api.md)
 * Chromium 75.0.3765.0 - [Puppeteer v1.15.0](https://github.com/GoogleChrome/puppeteer/blob/v1.15.0/docs/api.md)
 * Chromium 74.0.3723.0 - [Puppeteer v1.13.0](https://github.com/GoogleChrome/puppeteer/blob/v1.13.0/docs/api.md)
 * Chromium 73.0.3679.0 - [Puppeteer v1.12.2](https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/docs/api.md)
 */

const testCompatibility = async (browser) => {
    console.log('Puppeteer version: %s', puppeteerVersion);

    const chromeVersion = (await browser.version()).match(VERSION_REGEX)[0];
    console.log('Chrome version: %s', chromeVersion);

    const compatibilityVersions = await fetchCompatibilityVersions(browser);
    console.log('Puppeteer compatibility versions are:');
    console.log(compatibilityVersions);

    // The list is only updated on Chrome releases, not Puppeteer releases, so e.g.
    // when support for Chrome 83 comes with Puppeteer 3.1.0, 3.2.0 will not be listed.
    // We must therefore check if we have Puppeteer >= the latest entry and if that's
    // the case, then it supports the latest entry of Chrome.
    const matchedCompatibilityVersions = compatibilityVersions.filter(cv => {
        return areVersionsCompatible(cv.pptr, puppeteerVersion);
    });

    if (!matchedCompatibilityVersions.length) {
        throw new Error(`Puppeteer+Chrome test failed: puppeteer version "${puppeteerVersion}" not found`);
    }
    const chromeVersionsCompatibleWithPuppeteer = matchedCompatibilityVersions.map(v => v.chrome);
    const isCompatible = chromeVersionsCompatibleWithPuppeteer.some(chromeVersionCompatibleWithPuppeteer => {
        return areVersionsCompatible(chromeVersionCompatibleWithPuppeteer, chromeVersion)
    })

    if (!isCompatible) {
        throw new Error(`Puppeteer+Chrome test failed: puppeteer version "${puppeteerVersion}" is not compatible with Chrome version ${chromeVersion}, it's compatible with versions ${chromeVersionsCompatibleWithPuppeteer}`);
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
    // We need --no-sandbox, because even though the build is running on GitHub, the test is running in Docker.
    const launchOptions = { headless: true, args: ['--no-sandbox'] };
    const launchContext = isV1
        ? { useChrome: true, launchOptions }
        : { useChrome: true, ...launchOptions };
    const browser = await Apify.launchPuppeteer(launchContext);
    try {
        await testCompatibility(browser);
        await testPageLoading(browser);
    } finally {
        await browser.close();
    }
};

module.exports = testPuppeteerChrome;
