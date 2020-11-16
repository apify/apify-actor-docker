const fs = require('fs');

const PACKAGE_JSON_PATH = './package.json';

const DEPENDENCY_VERSIONS = {
    'apify': process.env.APIFY_VERSION,
    'puppeteer': process.env.PUPPETEER_VERSION,
}

const pkg = readPackageJson(PACKAGE_JSON_PATH);
updateDependencyVersions(pkg, DEPENDENCY_VERSIONS);
fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg));

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

function updateDependencyVersions(pkg, dependencyVersions) {
    Object.entries(dependencyVersions).forEach(([name, version]) => {
        if (!version) throw new Error(`Version not found for dependency: ${name}`)
        return updateDependencyVersion(pkg, name, version);
    })
}

function updateDependencyVersion(pkg, depName, depVersion) {
    const { dependencies } = pkg;
    if (dependencies) throw new Error('Invalid package.json: Has no dependencies.');
    // Only update existing deps, so we don't add Puppeteer where it does not belong.
    if (dependencies[depName]) dependencies[depName] = depVersion;
}
