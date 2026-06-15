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

// `apify` is optional: the empty-* test images ship without it preinstalled.
let Actor;
try {
    ({ Actor } = require('apify'));
} catch {
    Actor = undefined;
}

const testFirefox = require('./firefox_test');

const run = async () => {
    // Camoufox (Firefox) headless
    await testFirefox({ headless: true });

    // Camoufox (Firefox) with XVFB (headful)
    await testFirefox({ headless: false });

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
