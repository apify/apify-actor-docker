// This code is used to test that both Node and PhantomJS work.

const { exec } = require('child_process');

/* global process */

console.log('Testing PhantomJS...');

exec('phantomjs --version', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        process.exit(1);
    }

    console.log('Version:', stdout);

    if (stdout.trim() !== '2.1.1s-apifier') {
        throw new Error(`Unsupported version of PhantomJS: ${stdout}`);
    }
    if (stderr.trim()) {
        throw new Error(`Unknown error occurred: ${stderr}`);
    }

    console.log('... test PASSED');
});
