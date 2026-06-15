const playwright = require('playwright');

const testPageLoading = async (browser) => {
    const page = await browser.newPage();
    await page.goto('http://www.example.com');
    const pageTitle = await page.title();
    if (pageTitle !== 'Example Domain') {
        throw new Error(`Playwright+Webkit test failed - returned title "${pageTitle}" !== "Example Domain"`);
    }
};

const testWebkit = async (launchOptions = {}) => {
    console.log('Testing Playwright with Webkit', launchOptions);

    const browser = await playwright.webkit.launch(launchOptions);

    try {
        await testPageLoading(browser);
    } finally {
        await browser.close();
    }
};

module.exports = testWebkit;
