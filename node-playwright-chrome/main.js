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
const { launchPlaywright, getMemoryInfo } = require('crawlee');
const { testChrome } = require('./chrome_test');

Actor.main(async () => {
    // Sanity test browsers.
    // We need --no-sandbox, because even though the build is running on GitHub, the test is running in Docker.
    const launchOptions = { headless: true, args: ['--no-sandbox'] };
    const launchContext = { launchOptions };

    const browser = await launchPlaywright(launchContext);
    await browser.close();

    // Try to use full Chrome headless
    await testChrome({ headless: true });

    // Try to use full Chrome with XVFB
    await testChrome({ headless: false });

    // Try to use playwright default
    await testChrome({ executablePath: undefined });
    await testChrome({ executablePath: process.env.APIFY_DEFAULT_BROWSER_PATH });

    // Test that "ps" command is available, sometimes it was missing in official Node builds
    await getMemoryInfo();
});
