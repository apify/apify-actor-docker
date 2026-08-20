const playwright = require('playwright');

const testPageLoading = async (browser) => {
    const page = await browser.newPage();
    await page.goto('http://www.example.com');
    const pageTitle = await page.title();
    if (pageTitle !== 'Example Domain') {
        throw new Error(`Playwright+Chrome test failed - returned title "${pageTitle}" !== "Example Domain"`);
    }
};

const testChromium = async (launchOptions = {}) => {
    console.log('Testing Playwright with bundled Chromium', launchOptions);

    const browser = await playwright.chromium.launch(launchOptions);

    try {
        await testPageLoading(browser);
    } finally {
        await browser.close();
    }
};

const testChrome = async (launchOptions = {}) => {
    console.log('Testing Playwright with Chrome', launchOptions);

    const browser = await playwright.chromium.launch({ channel: 'chrome', ...launchOptions });

    try {
        await testPageLoading(browser);
    } finally {
        await browser.close();
    }
};

module.exports = {
    testChrome,
    testChromium,
    testPageLoading,
};
