import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { satisfies } from 'semver';

import { resolveCamoufoxPlaywrightVersions } from './camoufox.ts';
import { fetchPackageManifest } from './npm.ts';

const playwrightVersions = ['1.56.0', '1.59.0', '1.60.0', '1.61.0', '1.62.0'];

describe('resolveCamoufoxPlaywrightVersions', () => {
	it('reads the supported range from the camoufox package on PyPI', async () => {
		// camoufox 0.5.4 declares `playwright<1.61`
		const { range, versions } = await resolveCamoufoxPlaywrightVersions('python', '0.5.4', playwrightVersions);

		assert.equal(range, '<1.61');
		assert.deepEqual(versions, ['1.56.0', '1.59.0', '1.60.0']);
	});

	it('reads the supported range from the camoufox-js package on npm', async () => {
		const { range, versions } = await resolveCamoufoxPlaywrightVersions('node', '0.11.5', playwrightVersions);

		// camoufox-js declares the range as a `playwright-core` peer dependency. What it declares is up to camoufox and
		// is expected to change, so this asserts that we read a range and apply it - not what the range happens to be.
		assert.notEqual(range, undefined);
		assert.deepEqual(
			versions,
			playwrightVersions.filter((version) => satisfies(version, range!)),
		);
	});

	it('returns no versions when the range cannot be resolved', async () => {
		const { range, versions } = await resolveCamoufoxPlaywrightVersions(
			'python',
			'0.0.0-does-not-exist',
			playwrightVersions,
		);

		assert.equal(range, undefined);
		assert.deepEqual(versions, []);
	});
});

describe('fetchPackageManifest', () => {
	it('reads the declared dependency ranges of a published version', async () => {
		const manifest = await fetchPackageManifest('playwright', '1.60.0');

		assert.equal(manifest.version, '1.60.0');
		assert.equal(manifest.dependencies?.['playwright-core'], '1.60.0');
	});

	it('reads the declared peer dependency ranges of a published version', async () => {
		const manifest = await fetchPackageManifest('camoufox-js', '0.11.5');

		assert.equal(typeof manifest.peerDependencies?.['playwright-core'], 'string');
	});
});
