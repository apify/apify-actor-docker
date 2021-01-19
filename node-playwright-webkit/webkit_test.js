const Apify = require('apify');

const testPageLoading = async browser => {
    const page = await browser.newPage();
    await page.goto('http://www.example.com');
    const pageTitle = await page.title();
    if (pageTitle !== 'Example Domain') {
        throw new Error(`Playwright+Webkit test failed - returned title "${pageTitle}"" !== "Example Domain"`);
    }
};

const testWebkit = async (launchOptions) => {
    const launchContext = {
         launcher: require("playwright").webkit,
         launchOptions,
         }

    console.log(`Testing Playwright with Webkit`, launchOptions);

    const browser = await Apify.launchPlaywright(launchContext);

    await testPageLoading(browser);
    await browser.close();
};

module.exports = testWebkit;
