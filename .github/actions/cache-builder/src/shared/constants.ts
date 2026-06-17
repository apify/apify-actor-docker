import { fileURLToPath } from 'node:url';

// Packages whose recent versions we pre-cache, so Docker image builds (and the Actors
// built on top of them) can install these dependencies from a warm cache instead of
// hitting the network. These are the dependencies that show up most in Apify Actors.
// Each is warmed with its full dependency tree (see the per-pm scripts), not just the
// top-level package. typescript is intentionally excluded: Actors don't install it at
// runtime and it dominated the cache size.
export const packagesToPrecache = [
	'crawlee',
	'apify',
	'playwright',
	'puppeteer',
];

// How many of the most recent stable versions of each package to cache.
export const versionsToCache = 5;

// Every package manager supported by the cache builder. Each one has a matching
// script in `src/caches/<pm>.ts` and produces a `data/<pm>.zip` archive.
export const supportedPackageManagers = ['npm', 'yarn', 'pnpm'] as const;
export type PackageManager = (typeof supportedPackageManagers)[number];

// Directory that holds the populated caches, the zip archives, and the state files.
function dataUrl(path: string): URL {
	return new URL(`../../data/${path}`, import.meta.url);
}

// The cache/store directory we point the package manager at while warming it up.
export function getCacheDir(pm: PackageManager): string {
	return fileURLToPath(dataUrl(`${pm}/`));
}

// The zip archive produced from the populated cache directory.
export function getArchivePath(pm: PackageManager): string {
	return fileURLToPath(dataUrl(`${pm}.zip`));
}

// The JSON file recording which versions ended up in the cache.
export function getStatePath(pm: PackageManager): string {
	return fileURLToPath(dataUrl(`${pm}_state.json`));
}
