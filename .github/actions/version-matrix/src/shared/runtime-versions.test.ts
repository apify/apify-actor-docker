import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { valid } from 'semver';

import { fetchNodeRuntimeVersions, fetchPythonRuntimeVersions } from './runtime-versions.ts';

describe('fetchNodeRuntimeVersions', () => {
	it('returns valid semver versions for each requested major', async () => {
		const result = await fetchNodeRuntimeVersions(['20', '22']);

		assert.equal(result.length, 2);

		for (const version of result) {
			assert.notEqual(valid(version), null);
		}

		assert.match(result[0], /^20\.\d+\.\d+$/);
		assert.match(result[1], /^22\.\d+\.\d+$/);
	});

	it('preserves the input order', async () => {
		const [forward, reverse] = await Promise.all([
			fetchNodeRuntimeVersions(['20', '22']),
			fetchNodeRuntimeVersions(['22', '20']),
		]);

		assert.equal(forward[0], reverse[1]);
		assert.equal(forward[1], reverse[0]);
	});

	it('throws for a non-existent major version', async () => {
		await assert.rejects(fetchNodeRuntimeVersions(['99']), {
			message: 'No Node.js release found for major version 99',
		});
	});
});

describe('fetchPythonRuntimeVersions', () => {
	it('returns valid patch versions for each requested major.minor', async () => {
		const result = await fetchPythonRuntimeVersions(['3.12', '3.13']);

		assert.equal(result.length, 2);

		assert.match(result[0], /^3\.12\.\d+$/);
		assert.match(result[1], /^3\.13\.\d+$/);
	});

	it('preserves the input order', async () => {
		const [forward, reverse] = await Promise.all([
			fetchPythonRuntimeVersions(['3.12', '3.13']),
			fetchPythonRuntimeVersions(['3.13', '3.12']),
		]);

		assert.equal(forward[0], reverse[1]);
		assert.equal(forward[1], reverse[0]);
	});

	it('throws for a non-existent version cycle', async () => {
		await assert.rejects(fetchPythonRuntimeVersions(['3.99']), {
			message: 'No Python release found for version 3.99',
		});
	});
});
