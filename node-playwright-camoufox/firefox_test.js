const { launchPlaywright } = require('crawlee');
const { launchOptions: camoufoxLaunchOptions } = require('camoufox-js');

const testPageLoading = async (browser) => {
    const page = await browser.newPage();
    await page.goto('http://www.example.com');
    const pageTitle = await page.title();
    if (pageTitle !== 'Example Domain') {
        throw new Error(`Playwright+Firefox test failed - returned title "${pageTitle}"" !== "Example Domain"`);
    }
};

const testFirefox = async (launchOptions) => {
    const launchContext = {
        launcher: require('playwright').firefox,
        launchOptions: await camoufoxLaunchOptions({
            ...launchOptions,
        }),
    };

    console.log(`Testing Playwright with Firefox`, launchContext.launchOptions);

    const browser = await launchPlaywright(launchContext);

    await testPageLoading(browser);
    await browser.close();
};

module.exports = testFirefox;
