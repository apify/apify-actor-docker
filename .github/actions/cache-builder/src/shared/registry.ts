const registryUrl = (packageName: string) => `https://registry.npmjs.org/${packageName}`;

interface PackageInfo {
	name: string;
	versions: Record<string, unknown>;
}

// Compares two stable `major.minor.patch` versions numerically (ascending).
function compareVersions(a: string, b: string): number {
	const partsA = a.split('.').map(Number);
	const partsB = b.split('.').map(Number);
	for (let i = 0; i < 3; i++) {
		const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
		if (diff !== 0) return diff;
	}
	return 0;
}

// Returns all stable releases of a package, sorted oldest -> newest. Prereleases and
// other non-numeric versions (anything containing a letter, e.g. `1.2.3-beta.1`) are dropped.
export async function fetchStableVersions(packageName: string): Promise<string[]> {
	const response = await fetch(registryUrl(packageName));

	if (!response.ok) {
		throw new Error(
			`Failed to fetch package info for ${packageName}: ${response.status} ${response.statusText}`,
		);
	}

	const json = (await response.json()) as PackageInfo;

	return Object.keys(json.versions)
		.filter((version) => !/[a-z]/i.test(version))
		.sort(compareVersions);
}

// Returns the `count` most recent stable versions of a package.
export async function fetchLatestVersions(packageName: string, count: number): Promise<string[]> {
	return (await fetchStableVersions(packageName)).slice(-count);
}
