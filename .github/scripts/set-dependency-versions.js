const fs = require('fs');

const PACKAGE_JSON_PATH = './package.json';

const DEPENDENCY_VERSIONS = {
	'apify': process.env.APIFY_VERSION,
	'crawlee': process.env.CRAWLEE_VERSION,
	'puppeteer': process.env.PUPPETEER_VERSION,
	'playwright': process.env.PLAYWRIGHT_VERSION,
	'playwright-chromium': process.env.PLAYWRIGHT_VERSION,
	'playwright-firefox': process.env.PLAYWRIGHT_VERSION,
	'playwright-webkit': process.env.PLAYWRIGHT_VERSION,
};

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
	});
}

function updateDependencyVersion(pkg, depName, depVersion) {
	if (!pkg.dependencies) throw new Error('Invalid package.json: Has no dependencies.');

	// Only update existing deps, so we don't add Puppeteer where it does not belong.
	if (pkg.dependencies[depName]) {
		if (!depVersion) {
			throw new Error(`Version not provided for dependency: ${depName}`);
		}

		if (!/^[\^~]/.test(depVersion)) {
			console.warn(`Dependency ${depName} is set to fixed version ${depVersion}.`);
		}

		console.log(`Setting dependency: ${depName} to version: ${depVersion}`);
		pkg.dependencies[depName] = depVersion;
	}

	if (depName === 'crawlee' && pkg.overrides?.apify) {
		Object.keys(pkg.overrides.apify).forEach((dep) => {
			console.log(`Setting overrides dependency: ${dep} to version: ${depVersion}`);
			pkg.overrides.apify[dep] = depVersion;
		});
	}
}
