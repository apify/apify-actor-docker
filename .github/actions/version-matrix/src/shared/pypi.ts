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

export const pythonRequirementRegex = /(?<name>[a-zA-Z0-9\-]+)(?<operator>[<>=]+)(?<version>[0-9\.]+)/;
