// Warms a pnpm content-addressable store with the most recent versions of the precache
// packages and zips it. Runs natively on Node.js >=24 (TypeScript type stripping, no build step).
//
// pnpm's store is versioned (store/v10, store/v11, ...) and different pnpm majors use different
// store versions, so we warm a store for *each* major an Actor might use. The store is written
// to `<cache>/store` so that, once injected into the image, it lines up with the base image's
// PNPM_CONFIG_STORE_DIR=/pkg-cache/pnpm/store — i.e. installs actually find it.

import { join } from 'node:path';
import { type CacheState, createArchive, resetDir, run, writeState } from '../shared/archive.ts';
import { getCacheDir, packagesToPrecache, versionsToCache } from '../shared/constants.ts';
import { fetchLatestVersions, fetchStableVersions } from '../shared/registry.ts';

const pm = 'pnpm';

// pnpm majors to warm a store for. Each writes its own store/vNN subdirectory.
const PNPM_MAJORS = [10, 11];

const cacheDir = getCacheDir(pm); // .../data/pnpm        -> /pkg-cache/pnpm
const storeDir = join(cacheDir, 'store'); // .../data/pnpm/store -> /pkg-cache/pnpm/store

// Corepack runs the exact pnpm version we ask for; never prompt for the download.
const corepackEnv = { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' };

console.log(`[${pm}] store location: ${storeDir}`);
await resetDir(cacheDir);

// Resolve the latest released version of each requested pnpm major.
const allPnpmVersions = await fetchStableVersions('pnpm');
const pnpmVersions = PNPM_MAJORS.map((major) => {
	const latest = allPnpmVersions.filter((version) => version.startsWith(`${major}.`)).at(-1);
	if (!latest) console.error(`[${pm}] no released pnpm ${major}.x found, skipping`);
	return latest;
}).filter((version) => Boolean(version));

console.log(`[${pm}] warming store for pnpm versions: ${pnpmVersions.join(', ')}`);

// Collect the package specs to cache (identical set for every pnpm version).
const state: CacheState = {};
const specs: string[] = [];
for (const packageName of packagesToPrecache) {
	const versions = await fetchLatestVersions(packageName, versionsToCache);
	state[packageName] = versions;
	for (const version of versions) specs.push(`${packageName}@${version}`);
}

for (const pnpmVersion of pnpmVersions) {
	console.log(`[${pm}] caching ${specs.length} package versions with pnpm@${pnpmVersion}`);
	try {
		// `pnpm store add` downloads packages straight into the store without a project.
		await run('corepack', [`pnpm@${pnpmVersion}`, 'store', 'add', '--store-dir', storeDir, ...specs], {
			env: corepackEnv,
		});
	} catch (error) {
		console.error(`[${pm}] failed to warm store with pnpm@${pnpmVersion}:`, error);
	}
}

await writeState(pm, state);
await createArchive(pm, cacheDir);

console.log(`[${pm}] done — archived store (pnpm ${pnpmVersions.join(', ')}) for ${Object.keys(state).length} packages`);
