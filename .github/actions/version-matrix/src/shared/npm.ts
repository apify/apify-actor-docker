import { compare } from 'semver';

const npmPackageInfoRoute = (pkg: string) => `https://registry.npmjs.org/${pkg}`;

interface PackageVersionInfo {
	name: string;
	version: string;
	engines?: Record<string, string>;
}

interface PackageInfo {
	name: string;
	'dist-tags': Record<string, string>;
	versions: Record<string, PackageVersionInfo>;
}

export async function fetchPackageVersions(packageName: string) {
	const url = npmPackageInfoRoute(packageName);

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch package info for ${packageName}`, {
			cause: await response.text(),
		});
	}

	const json: PackageInfo = await response.json();

	// Avoid versions with suffixes for this
	const versions = Object.keys(json.versions).filter((version) => !/[a-z]/.test(version));

	return versions.sort((a, b) => compare(a, b));
}
