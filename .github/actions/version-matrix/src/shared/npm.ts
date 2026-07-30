import { compare } from 'semver';

const npmPackageInfoRoute = (pkg: string) => `https://registry.npmjs.org/${pkg}`;
const npmPackageVersionInfoRoute = (pkg: string, version: string) => `https://registry.npmjs.org/${pkg}/${version}`;

interface PackageVersionInfo {
	name: string;
	version: string;
	engines?: Record<string, string>;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
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

/**
 * Fetches the manifest (the `package.json`) of a single published version of a package.
 */
export async function fetchPackageManifest(packageName: string, version: string) {
	const url = npmPackageVersionInfoRoute(packageName, version);

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch package info for ${packageName}, version ${version}`, {
			cause: await response.text(),
		});
	}

	const json: PackageVersionInfo = await response.json();

	return json;
}
