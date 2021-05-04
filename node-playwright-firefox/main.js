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

const Apify = require('apify');
const testFirefox = require('./firefox_test');

Apify.main(async () => {
    // Sanity test browsers.

    // Try to use full Firefox headless
    await testFirefox({ headless: true })

    // Try to use full Firefox with XVFB
    await testFirefox({ headless: false })

    // Try to use playwright default
    await testFirefox({ executablePath: undefined })
    await testFirefox({ executablePath: process.env.APIFY_DEFAULT_BROWSER_PATH })

    // Test that "ps" command is available, sometimes it was missing in official Node builds
    await Apify.getMemoryInfo();
});
