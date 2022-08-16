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
const { getMemoryInfo } = require('crawlee');
const testWebkit = require('./webkit_test');

Actor.main(async () => {
    // Sanity test browsers.

    // Try to use full Webkit headless
    await testWebkit({ headless: true });

    // Try to use full Webkit with XVFB
    await testWebkit({ headless: false });

    // Try to use playwright default
    await testWebkit({ executablePath: undefined });
    await testWebkit({ executablePath: process.env.APIFY_DEFAULT_BROWSER_PATH });

    // Test that "ps" command is available, sometimes it was missing in official Node builds
    await getMemoryInfo();
});
