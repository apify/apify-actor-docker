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

const { execSync } = require('node:child_process');

// `apify` is optional: the -slim images ship without it preinstalled. Anything other than
// apify itself being absent means a broken install and must fail the test.
let Actor;
try {
    ({ Actor } = require('apify'));
} catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND' || !error.message.includes("'apify'")) throw error;
}

if (Actor) {
    // The regular images preinstall crawlee next to apify; make sure it loads too.
    require('crawlee');
}

const puppeteer = require('puppeteer');
const testPuppeteerChrome = require('./puppeteer_chrome_test');

const run = async () => {
    // Check that `ps` is available - some Node builds have shipped without it,
    // and crawlee needs it at runtime to measure memory.
    execSync('ps');

    // First, open the Chromium bundled with Puppeteer to verify dependencies are installed.
    console.log('Testing Puppeteer with Chromium');
    // We need --no-sandbox, because even though the build runs on GitHub, the test runs in Docker.
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.goto('http://www.example.com');
        const pageTitle = await page.title();
        if (pageTitle !== 'Example Domain') {
            throw new Error(`Puppeteer+Chromium test failed - returned title "${pageTitle}" !== "Example Domain"`);
        }
    } finally {
        await browser.close();
    }

    // Second, use full Chrome.
    await testPuppeteerChrome();

    console.log('... test PASSED');
};

if (Actor) {
    Actor.main(run);
} else {
    run().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
