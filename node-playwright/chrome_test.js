const { launchPlaywright } = require('crawlee');

const testPageLoading = async (browser) => {
    const page = await browser.newPage();
    await page.goto('http://www.example.com');
    const pageTitle = await page.title();
    if (pageTitle !== 'Example Domain') {
        throw new Error(`Playwright+Chrome test failed - returned title "${pageTitle}"" !== "Example Domain"`);
    }
};

const testChrome = async (launchOptions) => {
    const launchContext = { useChrome: true, launchOptions };

    console.log(`Testing Playwright with Chrome`, launchContext);

    const browser = await launchPlaywright(launchContext);

    await testPageLoading(browser);
    await browser.close();
};

module.exports = {
    testChrome,
    testPageLoading,
};
