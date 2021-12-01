const { writeFile } = require('fs/promises');
const { fetchCompatibilityVersions, puppeteerVersion, areVersionsCompatible, downloadClosestChromeInstaller } = require('./puppeteer_utils');

const puppeteerMajor = Number(puppeteerVersion.split('.')[0]);

async function downloadLatestCompatibleChrome() {
    const compatibilities = await fetchCompatibilityVersions();

    const matchedCompatibilityVersions = compatibilities.filter((cv) => {
        const cvMajor = Number(cv.pptr.split('.')[0]);

        return areVersionsCompatible(cv.pptr, puppeteerVersion) || (puppeteerMajor >= cvMajor && puppeteerMajor - cvMajor <= 2);
    });

    // Get all supported Chrome version
    const compatibleChromeVersion = matchedCompatibilityVersions
        .map((v) => v.chrome)
        .sort((a, b) => b.localeCompare(a));

    console.warn(`Attempting to find a Chrome installer for versions: ${compatibleChromeVersion.join(', ')}`);

    const buffer = await downloadClosestChromeInstaller(compatibleChromeVersion);
    await writeFile('/tmp/chrome.deb', buffer);
}

(async () => {
    console.log(`Preparing to download the latest Chrome compatible with Puppeteer ${puppeteerVersion}`);

    try {
        await downloadLatestCompatibleChrome();
        console.log('Installer file was saved in /tmp/chrome.deb');
    } catch (err) {
        console.error('Failed to download the latest Chrome', err);
        process.exitCode = 1;
    }
})();
