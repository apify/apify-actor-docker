const { writeFile } = require('fs/promises');
const { fetchCompatibilityVersions, puppeteerVersion, areVersionsCompatible, downloadClosestChromeInstaller } = require('./puppeteer_utils');

async function downloadLatestCompatibleChrome() {
    const compatibilities = await fetchCompatibilityVersions();

    const matchedCompatibilityVersions = compatibilities.filter(cv => {
        return areVersionsCompatible(cv.pptr, puppeteerVersion);
    });

    if (!matchedCompatibilityVersions.length) {
        throw new Error(`Puppeteer Chrome download failed: puppeteer version "${puppeteerVersion}" not found`);
    }

    // Get the latest chrome version
    const compatibleChromeVersion = matchedCompatibilityVersions
        .map(v => v.chrome)
        .sort((a, b) => b.localeCompare(a))[0];

    console.log(`Found compatible Chrome version ${compatibleChromeVersion} for Puppeteer ${puppeteerVersion}`);

    const buffer = await downloadClosestChromeInstaller(compatibleChromeVersion);
    await writeFile('/tmp/chrome.deb', buffer);
}

(async () => {
    console.log('Preparing to download the latest Chrome compatible with the version of Puppeteer that is installed');

    try {
        await downloadLatestCompatibleChrome();
        console.log('Download completed! File was saved in /tmp/chrome');
    } catch (err) {
        console.error('Failed to download the latest Chrome', err);
        process.exitCode = 1;
    }
})();
