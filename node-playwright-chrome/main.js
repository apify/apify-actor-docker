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

Apify.main(async () => {
    // Sanity test browsers.
    // We need --no-sandbox, because even though the build is running on GitHub, the test is running in Docker.
    const launchOptions = { headless: true, args: ['--no-sandbox'] }
    const launchContext = { launchOptions }

    const browser = await Apify.launchPlaywright(launchContext)
    await browser.close();

    // Try to use full Chrome headless
    await testChrome({ headless: true })
    
    // Try to use full Chrome with XVFB
    await testChrome({ headless: false })

    // Try to use playwright default
    await testChrome({ executablePath: undefined })
    await testChrome({ executablePath: process.env.APIFY_DEUFAULT_CHROME_PATH })

    // Test that "ps" command is available, sometimes it was missing in official Node builds
    await Apify.getMemoryInfo();

});
