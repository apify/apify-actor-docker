const { default: axios} = require('axios')
const { version: puppeteerVersion } = require('puppeteer/package.json');

const VERSION_REGEX = /([\d.?]+)/g;
const chromeVersionDownloadUrl = version => `https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${version}_amd64.deb`;

/**
 * @param {string} text
 * @returns {{ chrome: string; pptr: string; }[]}
 */
function parseCompatibilityVersions(text) {
    const versionsText = text.substring(
        text.indexOf('Releases per Chromium Version:'),
        text.indexOf('* [All releases]')
    );
    const versions = versionsText.split('\n')
        .filter(line => line.includes('* Chromium'))
        .map(line => {
            const vers = line.match(VERSION_REGEX);
            return { chrome: vers[0], pptr: vers[1] }
        });
    if (versions.length < 5){
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
    const [compMajor, compMinor] = compatible.split('.').map(n => Number(n));
    const [actualMajor, actualMinor] = actual.split('.').map(n => Number(n));
    return actualMajor === compMajor && actualMinor >= compMinor;
}

async function fetchCompatibilityVersions() {
    const apiResponse = await axios.get('https://raw.githubusercontent.com/GoogleChrome/puppeteer/main/docs/api.md', { responseType: 'text' });
    const compatibilityVersions = parseCompatibilityVersions(apiResponse.data);

    return compatibilityVersions;
}

/**
 * Downloads the closest version of Chrome available
 * @param {string} versionToCheck
 */
async function downloadClosestChromeInstaller(versionToCheck) {
    // Get the first 3 parts of the version
    const relevantPart = versionToCheck.split('.').slice(0, 3).join('.');

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

        // If this page doesn't include the relevant part, move on
        if (!rawText.includes(relevantPart)) {
            pageNumber++;
            continue;
        }

        // We found the page, extract the final version and save it
        const rawMatches = rawText.match(VERSION_REGEX);
        const validVersion = rawMatches.filter(item => item.startsWith(relevantPart)).sort()[0];
        const downloadUrl = chromeVersionDownloadUrl(`${validVersion}-1`);

        const res = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        debBuffer = res.data;
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
}
