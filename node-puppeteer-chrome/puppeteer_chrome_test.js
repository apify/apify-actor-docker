const { launchPuppeteer } = require('crawlee');

const testPageLoading = async (browser) => {
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
    const launchContext = { useChrome: true, launchOptions };

    const browser = await launchPuppeteer(launchContext);
    try {
        await testPageLoading(browser);
    } finally {
        await browser.close();
    }
};

module.exports = testPuppeteerChrome;
