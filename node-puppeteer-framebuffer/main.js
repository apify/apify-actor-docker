// This file will be replaced by the content of the Act2.sourceCode field,
// we keep this one here just for testing and clarification.

console.log("Hello world from base Docker container for Apify Actor (with Puppeteer and Framebuffer)");

const Apify = require('apify');

Apify.main(async () => {
    const browser = await Apify.launchPuppeteer({
        headless: false
    });

    const page = await browser.newPage();

    await page.goto('http://example.com');

    console.log(await page.title());
});
