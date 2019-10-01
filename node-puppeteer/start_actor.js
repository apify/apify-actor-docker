const { execSync } = require('child_process');
const path = require('path');

/**
 * This is the start function for Apify Actor. It runs node script from packageJson.scripts.start.
 * If there is no start script it will use "node main.js" as a fallback. It is for backward compatibility with older actors.
 * If there is start script, but it is not a node command it executes the command in a child process.
 */
const startActor = () => {
    let packageJson;
    try {
        packageJson = require('./package.json');
    } catch (err) {
        // There is no package.json
    }

    let startScript;
    if (packageJson && packageJson.scripts && packageJson.scripts.start) {
        startScript = packageJson.scripts.start;
    } else {
        // If we don't find start script, use fallback to old "node main.js"
        console.log('\nWARNING: The npm start script not found in package.json. Using "node main.js" instead. Please update your package.json file. For more information see https://github.com/apifytech/apify-cli/blob/master/MIGRATIONS.md\n\n');
        startScript = 'node main.js'
    }

    // Check if start script includes node command with javascript file
    const match = startScript.match(/node\s+(.*\.js)/);
    if (match) {
        const [ fullMatch, startScriptFilePath ] = match;
        const startScriptFullPath = path.join(__dirname, startScriptFilePath);
        try {
            // Require file from start script, it runs the actor code. In most cases, it is main.js file.
            require(startScriptFullPath);
            return;
        } catch(err) {
            // There is no start script
        }
    }

    // This is fallback for a case, where node command is missing in the start script
    return execSync(startScript, { stdio: 'inherit' });
};

startActor();


