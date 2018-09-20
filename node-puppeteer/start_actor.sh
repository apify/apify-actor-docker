#!/bin/sh

# Try to get start script from package.json.
PACKAGE_START=$(node -e "
    try {
        const packageJson = require('./package.json');
        const startScript = packageJson && packageJson.scripts && packageJson.scripts.start
            ? packageJson.scripts.start
            : null;

        console.log(startScript || '');
    } catch (err) {}
")

# If not found print warning and fallback to old "node main.js".
if [ -z "$PACKAGE_START" ]; then
    printf '\nWARNING: The npm start script not found in package.json. Using "node main.js" instead. Please update your package.json file. For more information see https://github.com/apifytech/apify-cli/blob/master/MIGRATIONS.md\n\n'
fi
START_SCRIPT=${PACKAGE_START:='node main.js'}

exec $START_SCRIPT
