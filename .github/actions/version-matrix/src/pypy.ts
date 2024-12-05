import { compare } from 'semver';

const pypyPackageInfoRoute = (pkg: string) => `https://pypi.org/pypi/${pkg}/json`;
const pypyPackageVersionInfoRoute = (pkg: string, version: string) => `https://pypi.org/pypi/${pkg}/${version}/json`;

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
	const url = pypyPackageInfoRoute(packageName);

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch package info for ${packageName}`, {
			cause: await response.text(),
		});
	}

	const json: PackageInfo = await response.json();

	return Object.keys(json.releases).sort(compare);
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
	const url = pypyPackageVersionInfoRoute(packageName, version);

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
