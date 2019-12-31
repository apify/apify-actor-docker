const Apify = require('apify');
const { version: puppeteerVersion } = require('puppeteer/package.json');
const VERSION_REGEX = /([\d.?]+)/g;

function parseCompatibilityVersions(text) {
    const versionsText = text.substring(
        text.indexOf('Releases per Chromium Version:'),
        text.indexOf('* [All releases]')
    );
    return versionsText.split('\n')
        .filter(line => line.includes('* Chromium'))
        .map(line => {
            const vers = line.match(VERSION_REGEX);
            return { chrome: vers[0], pptr: vers[1] }
        })
}

function isChromeVersionsMajorEqual(v1, v2) {
    const major1 = v1.split('.')[0];
    const major2 = v2.split('.')[0];
    return major1 === major2;
}

const testCompatibility = async (browser) => {
    console.log('Puppeteer version: %s', puppeteerVersion);

    const chromeVersion = (await browser.version()).match(VERSION_REGEX)[0];
    console.log('Chrome version: %s', chromeVersion);

    const page = await browser.newPage();
    const apiResponse = await page.goto('https://raw.githubusercontent.com/GoogleChrome/puppeteer/master/docs/api.md');
    const compatibilityVersions = parseCompatibilityVersions(await apiResponse.text());
    console.log('Puppeteer compatibility versions are:');
    console.log(compatibilityVersions)

    const matchedCompatibilityVersion = compatibilityVersions.find(cv => cv.pptr === puppeteerVersion);

    if (!matchedCompatibilityVersion) {
        throw new Error(`Puppeteer+Chrome test failed: puppeteer version "${puppeteerVersion}" not found`);
    }
    const compatibleChromeVersion = matchedCompatibilityVersion.chrome;
    if (!isChromeVersionsMajorEqual(compatibleChromeVersion, chromeVersion)){
        throw new Error(`Puppeteer+Chrome test failed: puppeteer version "${puppeteerVersion}" is not compatible with Chrome version ${chromeVersion}, it's compatible with version ${compatibleChromeVersion}`);
    }

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
