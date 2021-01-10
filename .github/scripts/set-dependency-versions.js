const fs = require('fs');

const PACKAGE_JSON_PATH = './package.json';

const DEPENDENCY_VERSIONS = {
    'apify': process.env.APIFY_VERSION,
    'puppeteer': process.env.PUPPETEER_VERSION,
    'playwright': process.env.PLAYWRIGHT_VERSION || '1.7.1',
}

const pkg = readPackageJson(PACKAGE_JSON_PATH);
updateDependencyVersions(pkg, DEPENDENCY_VERSIONS);
fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 4));


function readPackageJson(path) {
    try {
        const pkgJson = fs.readFileSync(path, 'utf-8');
        return JSON.parse(pkgJson);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`No package.json to update in ${process.cwd()}`);
            process.exit(0);
        }
    }
}

/**
 * Updates versions of dependencies that are listed in the package.json
 * @param {object} pkg
 * @param {object} dependencyVersions
 */
function updateDependencyVersions(pkg, dependencyVersions) {
    Object.entries(dependencyVersions).forEach(([name, version]) => {
        return updateDependencyVersion(pkg, name, version);
    })
}

function updateDependencyVersion(pkg, depName, depVersion) {
    const { dependencies } = pkg;
    if (!dependencies) throw new Error('Invalid package.json: Has no dependencies.');
    // Only update existing deps, so we don't add Puppeteer where it does not belong.
    if (dependencies[depName]) {
        // Enforce version only for dependencies that will be updated.
        if (!depVersion) throw new Error(`Version not provided for dependency: ${depName}`)
        console.log(`Setting dependency: ${depName} to version: ${depVersion}`);
        dependencies[depName] = depVersion;
    }
}
