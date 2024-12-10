import { semver } from 'bun';
import { fetchPackageVersions } from './src/pypy';

const supportedPythonVersions = ['3.9', '3.10', '3.11', '3.12', '3.13'];

/**
 * Certain playwright versions will not run on newer Python versions.
 * For example, playwright <1.48.0 will not run on python 3.13+
 * The key represents the playwright version from which this takes effect.
 * The value is the minimum Python version that is supported.
 */
const playwrightPythonVersionConstraints = [
	// Playwright, python
	['>=1.48.0', '>=3.13.x'],
];

const versions = await fetchPackageVersions('playwright');
const apifyVersions = await fetchPackageVersions('apify');

const lastFiveVersions = versions.slice(-5);

console.error('Last five versions', lastFiveVersions);

const matrix = {
	include: [] as {
		'image-name': 'python-playwright';
		'python-version': string;
		'playwright-version': string;
		'apify-version': string;
		'is-latest': 'true' | 'false';
	}[],
};

for (const playwrightVersion of lastFiveVersions) {
	const maybeFilter = playwrightPythonVersionConstraints.findLast(([constraint]) => {
		return semver.satisfies(playwrightVersion, constraint);
	});

	for (const pythonVersion of supportedPythonVersions) {
		if (maybeFilter) {
			const [, minPythonVersion] = maybeFilter;
			if (!semver.satisfies(`${pythonVersion}.0`, minPythonVersion)) {
				continue;
			}
		}

		matrix.include.push({
			'image-name': 'python-playwright',
			'python-version': pythonVersion,
			'playwright-version': playwrightVersion,
			'apify-version': apifyVersions.at(-1)!,
			'is-latest': playwrightVersion === lastFiveVersions.at(-1)! ? 'true' : 'false',
		});
	}
}

console.log(JSON.stringify(matrix));
