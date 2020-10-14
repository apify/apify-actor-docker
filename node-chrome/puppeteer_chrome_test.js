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

function areVersionsCompatible(compatible, actual) {
    const [compMajor, compMinor] = compatible.split('.').map(n => Number(n));
    const [actualMajor, actualMinor] = actual.split('.').map(n => Number(n));
    return actualMajor === compMajor && actualMinor >= compMinor;
}

function trimPatchVersion(version) {
    return version.split('.').slice(0, 2).join('.');
}

const testCompatibility = async (browser) => {
    console.log('Puppeteer version: %s', puppeteerVersion);

    const chromeVersion = (await browser.version()).match(VERSION_REGEX)[0];
    console.log('Chrome version: %s', chromeVersion);

    const page = await browser.newPage();
    const apiResponse = await page.goto('https://raw.githubusercontent.com/GoogleChrome/puppeteer/main/docs/api.md');
    const compatibilityVersions = parseCompatibilityVersions(await apiResponse.text());
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
    // We need --no-sandbox, because even though the build is running on Travis, the test is running in Docker.
    const browser = await Apify.launchPuppeteer({ headless: true, useChrome: true, args: ['--no-sandbox'] });
    await testCompatibility(browser);
    await testPageLoading(browser);
    await browser.close();
};

module.exports = testPuppeteerChrome;

testPuppeteerChrome()
