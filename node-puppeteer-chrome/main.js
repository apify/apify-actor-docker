// This file will be replaced by the content of the Act2.sourceCode field,
// we keep this one here just for testing and clarification.

console.log(
    `If you're seeing this text, it means the actor started the default "main.js" file instead
of your own source code file. You have two options how to fix this:
1) Rename your source code file to "main.js"
2) Define custom "package.json" and/or "Dockerfile" that will run your code your way

For more information, see https://docs.apify.com/actors/development/source-code#custom-dockerfile
`);
console.log('Testing Docker image...');

const { Actor } = require('apify');
const { launchPuppeteer, getMemoryInfo } = require('crawlee');
const testPuppeteerChrome = require('./puppeteer_chrome_test');

Actor.main(async () => {
    // First, try to open Chromium to see all dependencies are correctly installed
    console.log('Testing Puppeteer with Chromium');
    // We need --no-sandbox, because even though the build is running on GitHub, the test is running in Docker.
    const launchOptions = { headless: true, args: ['--no-sandbox'] };
    const browser1 = await launchPuppeteer({ launchOptions });
    const page1 = await browser1.newPage();
    await page1.goto('http://www.example.com');
    const pageTitle1 = await page1.title();
    if (pageTitle1 !== 'Example Domain') {
        throw new Error(`Puppeteer+Chromium test failed - returned title "${pageTitle1}"" !== "Example Domain"`);
    }
    await browser1.close();

    // Second, try to use full Chrome
    await testPuppeteerChrome();

    // Test that "ps" command is available, sometimes it was missing in official Node builds
    await getMemoryInfo();

    console.log('... test PASSED');
});
