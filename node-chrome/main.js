// This file will be replaced by the content of the Act2.sourceCode field,
// we keep this one here just for testing and clarification.

console.log(
`If you're seeing this, it means the actor started the default "main.js" file instead
of your own source code file. You have two options how to fix this:
1) Rename your source code file to "main.js"
2) Define custom "package.json" and/or "Dockerfile" that will start your own source code file

For more information, see https://www.apify.com/docs/actor#custom-dockerfile
`);
console.log('Testing node-chrome image...');

const Apify = require('apify');

Apify.main(async () => {
    const browser = await Apify.launchPuppeteer({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://example.com');
    const pageTitle = await page.title();

    if (pageTitle !== 'Example Domain') {
        throw new Error(`Puppeteer test failed - returned title "${pageTitle}"" !== "Example Domain"`);
    }

    console.log('... test PASSED');
});
