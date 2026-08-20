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

const { testChrome } = require('./chrome_test');

const run = async () => {
    // Full Chrome headless
    await testChrome({ headless: true });

    // Full Chrome with XVFB (headful)
    await testChrome({ headless: false });

    console.log('... test PASSED');
};

if (Actor) {
    Actor.main(run);
} else {
    run().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
