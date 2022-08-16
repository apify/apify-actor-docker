const { default: axios } = require('axios');
const { version: puppeteerVersion } = require('puppeteer/package.json');

const VERSION_REGEX = /([\d.?]+)/g;
const chromeVersionDownloadUrl = (version) => `https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${version}_amd64.deb`;

/**
 * @param {string} text
 * @returns {{ chrome: string; pptr: string; }[]}
 */
function parseCompatibilityVersions(text) {
    const versionsText = text.substring(
        text.indexOf('<!-- version-start -->'),
        text.indexOf('<!-- version-end -->'),
    );
    const versions = versionsText.split('\n')
        .filter((line) => line.includes('- Chromium'))
        .map((line) => {
            const vers = line.match(VERSION_REGEX);
            return { chrome: vers[0], pptr: vers[1] };
        });
    if (versions.length < 5) {
        throw new Error('Cannot find and parse Puppeteer-Chromium versions from Markdown file.');
    }
    return versions;
}

/**
 * @param {string} compatible
 * @param {string} actual
 * @returns {boolean}
 */
function areVersionsCompatible(compatible, actual) {
    const [compMajor, , compMinor] = compatible.split('.').map((n) => Number(n));
    const [actualMajor, , actualMinor] = actual.split('.').map((n) => Number(n));
    return actualMajor === compMajor && actualMinor >= compMinor;
}

async function fetchCompatibilityVersions() {
    const apiResponse = await axios.get('https://raw.githubusercontent.com/puppeteer/puppeteer/main/docs/chromium-support.md', { responseType: 'text' });
    const compatibilityVersions = parseCompatibilityVersions(apiResponse.data);

    return compatibilityVersions;
}

/**
 * Downloads the closest version of Chrome available
 * @param {string[]} versionToCheck
 */
async function downloadClosestChromeInstaller(versionToCheck) {
    function* checkBodyForVersion(body) {
        for (const supportedVersion of versionToCheck) {
            // If the body includes the exact version, we can return it and try to download it
            if (body.includes(supportedVersion)) {
                yield supportedVersion;
            }

            const [supportedMajor, , supportedBuild] = supportedVersion.split('.').map((n) => Number(n));

            // We extract all the versions on the page, and check if major matches the version we want, and if the build number is >= to the one we need
            const versions = body.match(VERSION_REGEX);

            if (versions) {
                for (const entry of versions) {
                    // Skip any entry that doesn't have a dot
                    if (!entry.includes('.')) {
                        continue;
                    }

                    const versionSplit = entry.split('.').map((n) => Number(n));

                    // Chromium version have 4 parts to the version
                    if (versionSplit.length < 4) {
                        continue;
                    }

                    const [major, , build] = versionSplit;

                    if (major === supportedMajor && build >= supportedBuild) {
                        yield entry;
                    }
                }
            }
        }
    }

    /** @type {Buffer} */
    let debBuffer;
    let pageNumber = 1;

    do {
        const response = await axios.get(`https://www.ubuntuupdates.org/package/google_chrome/stable/main/base/google-chrome-stable?id=202706&page=${pageNumber}`, { responseType: 'text' });
        const rawText = response.data;

        // If this page doesn't include any versions, we went too far
        if (!rawText.includes('Version:')) {
            throw new Error('Could not find any valid version.');
        }

        for (const versionToTry of checkBodyForVersion(rawText)) {
            console.log(`Attempting to download Chrome installer for version ${versionToTry}`);

            const downloadUrl = chromeVersionDownloadUrl(`${versionToTry}-1`);

            try {
                const res = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
                console.log(`Downloaded version ${versionToTry} that is compatible with Puppeteer ${puppeteerVersion}`);
                debBuffer = res.data;
                break;
            } catch {
                // Ignore errors
                console.warn(`Couldn't find or download Chrome stable with version ${versionToTry}`);
            }
        }

        // Increment the page number at the end
        pageNumber++;
    } while (!debBuffer);

    return debBuffer;
}

module.exports = {
    areVersionsCompatible,
    downloadClosestChromeInstaller,
    fetchCompatibilityVersions,
    parseCompatibilityVersions,
    puppeteerVersion,
    VERSION_REGEX,
};
