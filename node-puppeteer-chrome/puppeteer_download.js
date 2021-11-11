const { writeFile } = require('fs/promises');
const { fetchCompatibilityVersions, puppeteerVersion, areVersionsCompatible, downloadClosestChromeInstaller } = require('./puppeteer_utils');

async function downloadLatestCompatibleChrome() {
    const compatibilities = await fetchCompatibilityVersions();
    let warnInCaseOfNoMajorVersionFound = false;

    let matchedCompatibilityVersions = compatibilities.filter(cv => {
        return areVersionsCompatible(cv.pptr, puppeteerVersion);
    });

    if (!matchedCompatibilityVersions.length) {
        warnInCaseOfNoMajorVersionFound = true;
        matchedCompatibilityVersions = compatibilities.slice(0, 1);
    }

    // Get the latest chrome version
    const compatibleChromeVersion = matchedCompatibilityVersions
        .map(v => v.chrome)
        .sort((a, b) => b.localeCompare(a))[0];

    if (warnInCaseOfNoMajorVersionFound) {
        console.warn(`!!! For Puppeteer ${puppeteerVersion} there was no defined version of Chrome supported. !!!`);
        console.warn(`This script will download the latest compatible Chrome version that was mentioned for Puppeteer ${matchedCompatibilityVersions[0].pptr} instead.`);
    }
    console.log(`Finding the closest Chrome version to "${compatibleChromeVersion}" for Puppeteer ${puppeteerVersion}`);

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
