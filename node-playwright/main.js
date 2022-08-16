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
const playwright = require('playwright');
const { testChrome, testPageLoading } = require('./chrome_test');

Actor.main(async () => {
    const browsers = ['webkit', 'firefox', 'chromium'];
    const promisesHeadless = browsers.map(async (browserName) => {
        const browser = await launchPlaywright({ launcher: playwright[browserName] });
        return testPageLoading(browser);
    });

    const promisesHeadful = browsers.map(async (browserName) => {
        const browser = await launchPlaywright({ launcher: playwright[browserName], launchOptions: { headless: false } });
        return testPageLoading(browser);
    });

    await Promise.all(promisesHeadless);
    await Promise.all(promisesHeadful);

    // Try to use full Chrome headless
    await testChrome({ headless: true });

    // Try to use full Chrome with XVFB
    await testChrome({ headless: false, args: ['--disable-gpu'] });

    // Test that "ps" command is available, sometimes it was missing in official Node builds
    await getMemoryInfo();

    console.log('All tests passed!');
});
