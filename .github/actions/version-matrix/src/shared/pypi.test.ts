import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { satisfies } from 'semver';

import { findRequirementSpecifierSet, pythonSpecifierSetToSemverRange } from './pypi.ts';

describe('findRequirementSpecifierSet', () => {
	// Trimmed down `requires_dist` of camoufox 0.5.4
	const requiresDist = [
		'browserforge<2.0.0,>=1.2.4',
		'playwright<1.61',
		'PySide6; extra == "gui"',
		'geoip2; extra == "geoip"',
		'typing_extensions',
	];

	it('returns the specifier set of a requirement', () => {
		assert.equal(findRequirementSpecifierSet(requiresDist, 'playwright'), '<1.61');
		assert.equal(findRequirementSpecifierSet(requiresDist, 'browserforge'), '<2.0.0,>=1.2.4');
	});

	it('returns an empty string for a requirement without version bounds', () => {
		assert.equal(findRequirementSpecifierSet(requiresDist, 'typing_extensions'), '');
	});

	it('returns undefined for a requirement that is not declared', () => {
		assert.equal(findRequirementSpecifierSet(requiresDist, 'pytest'), undefined);
	});

	it('ignores requirements that only apply to an extra', () => {
		assert.equal(findRequirementSpecifierSet(requiresDist, 'geoip2'), undefined);
	});

	it('matches the package name case-insensitively and ignores extras', () => {
		assert.equal(findRequirementSpecifierSet(['Playwright[foo]>=1.50'], 'playwright'), '>=1.50');
	});
});

describe('pythonSpecifierSetToSemverRange', () => {
	it('converts comparison specifiers as-is', () => {
		assert.equal(pythonSpecifierSetToSemverRange('<1.61'), '<1.61');
		assert.equal(pythonSpecifierSetToSemverRange('>=1.50'), '>=1.50');
	});

	it('ANDs a comma-separated specifier set together', () => {
		assert.equal(pythonSpecifierSetToSemverRange('<2.0.0,>=1.2.4'), '<2.0.0 >=1.2.4');
	});

	it('converts equality specifiers', () => {
		assert.equal(pythonSpecifierSetToSemverRange('==1.5.0'), '=1.5.0');
		assert.equal(pythonSpecifierSetToSemverRange('==1.5.*'), '1.5.x');
	});

	it('converts compatible-release specifiers', () => {
		assert.equal(pythonSpecifierSetToSemverRange('~=1.5.2'), '~1.5.2');
		assert.equal(pythonSpecifierSetToSemverRange('~=1.5'), '^1.5');
	});

	it('treats an empty specifier set as unbounded', () => {
		assert.equal(pythonSpecifierSetToSemverRange(''), '*');
	});

	it('throws for specifiers that have no semver equivalent', () => {
		assert.throws(() => pythonSpecifierSetToSemverRange('!=1.4.0'), /Cannot convert/);
		assert.throws(() => pythonSpecifierSetToSemverRange('<= not a version'), /Cannot convert/);
	});

	it('produces a range that excludes the Playwright versions camoufox does not support', () => {
		const range = pythonSpecifierSetToSemverRange('<1.61');

		assert.equal(satisfies('1.60.0', range), true);
		assert.equal(satisfies('1.61.0', range), false);
		assert.equal(satisfies('1.62.0', range), false);
	});
});
