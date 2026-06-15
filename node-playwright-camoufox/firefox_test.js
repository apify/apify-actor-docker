const playwright = require('playwright');
const { launchOptions: camoufoxLaunchOptions } = require('camoufox-js');

const testPageLoading = async (browser) => {
    const page = await browser.newPage();
    await page.goto('http://www.example.com');
    const pageTitle = await page.title();
    if (pageTitle !== 'Example Domain') {
        throw new Error(`Playwright+Firefox test failed - returned title "${pageTitle}" !== "Example Domain"`);
    }
};

const testFirefox = async (launchOptions = {}) => {
    const options = await camoufoxLaunchOptions({ ...launchOptions });

    console.log('Testing Playwright with Camoufox', options);

    const browser = await playwright.firefox.launch(options);

    try {
        await testPageLoading(browser);
    } finally {
        await browser.close();
    }
};

module.exports = testFirefox;
