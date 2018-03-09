// This file will be replaced by the content of the Act2.sourceCode field,
// we keep this one here just for testing and clarification.

console.log('Testing node-chrome-xvfb image...');

const Apify = require('apify');

Apify.main(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const browser = await Apify.launchPuppeteer({
        headless: false,
    });
    const page = await browser.newPage();
    await page.goto('http://example.com');
    const pageTitle = await page.title();

    if (pageTitle !== 'Example Domain') {
        throw new Error(`Puppeteer test failed - returned title "${pageTitle}"" !== "Example Domain"`);
    }

    console.log('... test PASSED');
});
