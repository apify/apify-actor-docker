const puppeteer = require('puppeteer');

const testPageLoading = async (browser) => {
    const page = await browser.newPage();
    await page.goto('http://www.example.com');
    const pageTitle = await page.title();
    if (pageTitle !== 'Example Domain') {
        throw new Error(`Puppeteer+Chrome test failed - returned title "${pageTitle}" !== "Example Domain"`);
    }
};

const testPuppeteerChrome = async () => {
    console.log('Testing Puppeteer with full Chrome');
    // We need --no-sandbox, because even though the build runs on GitHub, the test runs in Docker.
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
        executablePath: process.env.APIFY_CHROME_EXECUTABLE_PATH,
    });

    try {
        await testPageLoading(browser);
    } finally {
        await browser.close();
    }
};

module.exports = testPuppeteerChrome;
