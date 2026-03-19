import { valid } from 'semver';
import { describe, expect, it } from 'vitest';

import { fetchNodeRuntimeVersions, fetchPythonRuntimeVersions } from './runtime-versions.ts';

describe('fetchNodeRuntimeVersions', () => {
	it('returns valid semver versions for each requested major', async () => {
		const result = await fetchNodeRuntimeVersions(['20', '22']);

		expect(result).toHaveLength(2);

		for (const version of result) {
			expect(valid(version)).not.toBeNull();
		}

		expect(result[0]).toMatch(/^20\.\d+\.\d+$/);
		expect(result[1]).toMatch(/^22\.\d+\.\d+$/);
	});

	it('preserves the input order', async () => {
		const [forward, reverse] = await Promise.all([
			fetchNodeRuntimeVersions(['20', '22']),
			fetchNodeRuntimeVersions(['22', '20']),
		]);

		expect(forward[0]).toBe(reverse[1]);
		expect(forward[1]).toBe(reverse[0]);
	});

	it('throws for a non-existent major version', async () => {
		await expect(fetchNodeRuntimeVersions(['99'])).rejects.toThrow('No Node.js release found for major version 99');
	});
});

describe('fetchPythonRuntimeVersions', () => {
	it('returns valid patch versions for each requested major.minor', async () => {
		const result = await fetchPythonRuntimeVersions(['3.12', '3.13']);

		expect(result).toHaveLength(2);

		expect(result[0]).toMatch(/^3\.12\.\d+$/);
		expect(result[1]).toMatch(/^3\.13\.\d+$/);
	});

	it('preserves the input order', async () => {
		const [forward, reverse] = await Promise.all([
			fetchPythonRuntimeVersions(['3.12', '3.13']),
			fetchPythonRuntimeVersions(['3.13', '3.12']),
		]);

		expect(forward[0]).toBe(reverse[1]);
		expect(forward[1]).toBe(reverse[0]);
	});

	it('throws for a non-existent version cycle', async () => {
		await expect(fetchPythonRuntimeVersions(['3.99'])).rejects.toThrow(
			'No Python release found for version 3.99',
		);
	});
});
