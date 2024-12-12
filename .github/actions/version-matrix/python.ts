import { semver } from 'bun';
import { fetchPackageVersions } from './src/pypi';

const supportedPythonVersions = ['3.9', '3.10', '3.11', '3.12', '3.13'];

/**
 * Certain playwright versions will not run on newer Python versions.
 * For example, playwright <1.48.0 will not run on python 3.13+
 * The key represents the python version range where this starts taking effect.
 * The value is the playwright version range that is required for the python version.
 */
const playwrightPythonVersionConstraints = [
	// Python, playwright
	['>=3.13.x', '>=1.48.0'],
];

const versions = await fetchPackageVersions('playwright');
const apifyVersions = await fetchPackageVersions('apify');

const lastFivePlaywrightVersions = versions.slice(-5);
const latestPlaywrightVersion = lastFivePlaywrightVersions.at(-1)!;
const latestApifyVersion = apifyVersions.at(-1)!;

console.error('Last five versions:', lastFivePlaywrightVersions);
console.error('Latest playwright version:', latestPlaywrightVersion);
console.error('Latest apify version:', latestApifyVersion);

const matrix = {
	include: [] as {
		'image-name': 'python-playwright';
		'python-version': string;
		'playwright-version': string;
		'apify-version': string;
		'is-latest': 'true' | 'false';
	}[],
};

for (const pythonVersion of supportedPythonVersions) {
	const maybePlaywrightVersionConstraint = playwrightPythonVersionConstraints.findLast(([constraint]) => {
		return semver.satisfies(`${pythonVersion}.0`, constraint);
	})?.[1];

	for (const playwrightVersion of lastFivePlaywrightVersions) {
		if (maybePlaywrightVersionConstraint) {
			if (!semver.satisfies(playwrightVersion, maybePlaywrightVersionConstraint)) {
				continue;
			}
		}

		matrix.include.push({
			'image-name': 'python-playwright',
			'python-version': pythonVersion,
			'playwright-version': playwrightVersion,
			'apify-version': latestApifyVersion,
			'is-latest': playwrightVersion === latestPlaywrightVersion ? 'true' : 'false',
		});
	}
}

console.log(JSON.stringify(matrix));
