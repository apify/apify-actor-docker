// This file will be replaced by the content of the Act2.sourceCode field,
// we keep this one here just for testing and clarification.

console.log(
    `If you're seeing this text, it means the actor started the default "main.js" file instead
of your own source code file. You have two options how to fix this:
1) Rename your source code file to "main.js"
2) Define custom "package.json" and/or "Dockerfile" that will run your code your way

For more information, see https://www.apify.com/docs/actor#custom-dockerfile
`);
console.log('Testing Docker image...');

const Apify = require('apify');
const testChrome = require('./chrome_test');

const isV1 = typeof Apify.launchPlaywright === 'function';

Apify.main(async () => {
    // Sanity test browsers.
    // We need --no-sandbox, because even though the build is running on GitHub, the test is running in Docker.
    const launchOptions = { headless: true, args: ['--no-sandbox'] }
    const launchContext = isV1 ? { launchOptions } : launchOptions

    const libraryNames = ['Puppeteer'];
    if (isV1) libraryNames.push('Playwright');
    const promises = libraryNames.map(async (name) => {
        console.log(`Testing ${name} with Chromium`);
        const launchFunctionName = `launch${name}`;
        const launchFunction = Apify[launchFunctionName];

        const browser = await launchFunction(launchContext);
        const page = await browser.newPage();
        await page.goto('https://www.example.com');
        const pageTitle = await page.title();
        if (pageTitle !== 'Example Domain') {
            throw new Error(`${name}+Chromium test failed - returned title "${pageTitle}"" !== "Example Domain"`);
        }
        await browser.close();
    })

    await Promise.all(promises);

    // Second, try to use full Chrome
    await testChrome();

    // Test that "ps" command is available, sometimes it was missing in official Node builds
    await Apify.getMemoryInfo();

    console.log('... test PASSED');
});
