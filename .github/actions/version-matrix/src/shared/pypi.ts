import { compare } from 'semver';

const pypiPackageInfoRoute = (pkg: string) => `https://pypi.org/pypi/${pkg}/json`;
const pypiPackageVersionInfoRoute = (pkg: string, version: string) => `https://pypi.org/pypi/${pkg}/${version}/json`;

// Only documents what we need
interface PackageInfo {
	info: {
		requires_dist: string[];
		requires_python: string;
		version: string;
		yanked: boolean;
	};
	releases: Record<
		string,
		{
			python_version: string;
			requires_python: string;
			yanked: boolean;
		}[]
	>;
}

export async function fetchPackageVersions(packageName: string) {
	const url = pypiPackageInfoRoute(packageName);

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch package info for ${packageName}`, {
			cause: await response.text(),
		});
	}

	const json: PackageInfo = await response.json();

	const rawVersions = Object.keys(json.releases);

	// For some reason tagged versions follow a structure like `0.0.0a0` (where `a` is a "tag")
	const filtered = rawVersions.filter((version) => !/[a-z]/.test(version));

	return filtered.sort((a, b) => compare(a, b));
}

interface PackageVersionInfo {
	info: {
		requires_dist: string[];
		requires_python: string;
		version: string;
		yanked: boolean;
	};
	requires_dist: string[];
	requires_python: string;
	yanked: boolean;
}

export async function fetchPackageVersion(packageName: string, version: string) {
	const url = pypiPackageVersionInfoRoute(packageName, version);

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch package info for ${packageName}, version ${version}`, {
			cause: await response.text(),
		});
	}

	const json: PackageVersionInfo = await response.json();

	return json;
}

/**
 * Matches a single entry of a `requires_dist` list, e.g. `playwright<1.61` or `geoip2; extra == "geoip"`.
 */
const pythonRequirementRegex =
	/^(?<name>[A-Za-z0-9._-]+)\s*(?:\[(?<extras>[^\]]*)\])?\s*(?<specifierSet>[^;]*?)\s*(?:;(?<marker>.*))?$/;

/**
 * Matches a single PEP 440 version specifier, e.g. `<1.61` or `~=1.5.2`.
 */
const pythonSpecifierRegex = /^(?<operator>===|==|~=|!=|<=|>=|<|>)\s*(?<version>[0-9][0-9.]*(?:\.\*)?)$/;

/**
 * Finds the requirement for a given package in a `requires_dist` list, and returns its PEP 440 specifier set
 * (e.g. `<1.61`). Requirements that only apply to an extra are ignored, as is the rest of the environment marker -
 * we only care about the version bounds.
 *
 * Returns `undefined` when the package is not required at all, and an empty string when it is required without any
 * version bounds.
 */
export function findRequirementSpecifierSet(requiresDist: string[], packageName: string) {
	for (const requirement of requiresDist) {
		const groups = pythonRequirementRegex.exec(requirement.trim())?.groups;

		if (!groups || groups.name.toLowerCase() !== packageName.toLowerCase()) {
			continue;
		}

		if (groups.marker?.includes('extra ==')) {
			continue;
		}

		return groups.specifierSet;
	}

	return undefined;
}

/**
 * Converts a PEP 440 specifier set (e.g. `>=1.50,<1.61`) into an equivalent semver range (`>=1.50 <1.61`).
 *
 * Throws for specifiers that have no semver equivalent (such as `!=`), so that the caller can decide what to do
 * instead of silently widening the range.
 */
export function pythonSpecifierSetToSemverRange(specifierSet: string) {
	const specifiers = specifierSet
		.split(',')
		.map((specifier) => specifier.trim())
		.filter(Boolean);

	if (specifiers.length === 0) {
		return '*';
	}

	// Space-separated semver comparators are ANDed together, same as the comma-separated PEP 440 specifiers
	return specifiers.map(pythonSpecifierToSemverComparator).join(' ');
}

function pythonSpecifierToSemverComparator(specifier: string) {
	const groups = pythonSpecifierRegex.exec(specifier)?.groups;

	if (!groups) {
		throw new Error(`Cannot convert Python version specifier to a semver range: ${specifier}`);
	}

	const { operator, version } = groups;

	switch (operator) {
		case '<':
		case '<=':
		case '>':
		case '>=':
			return `${operator}${version}`;
		case '==':
		case '===':
			// `==1.5.*` -> `1.5.x`
			return version.endsWith('.*') ? version.replace(/\.\*$/, '.x') : `=${version}`;
		case '~=':
			// `~=1.5.2` means `>=1.5.2, ==1.5.*`, while `~=1.5` means `>=1.5, ==1.*`
			return version.split('.').length >= 3 ? `~${version}` : `^${version}`;
		default:
			// Notably `!=`, which cannot be expressed as a semver comparator
			throw new Error(`Cannot convert Python version specifier to a semver range: ${specifier}`);
	}
}
