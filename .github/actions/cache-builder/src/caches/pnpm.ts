// Warms a pnpm store with the most recent versions of the precache packages — including their
// full dependency trees — and zips it. Runs natively on Node.js >=24 (type stripping).
//
// We use a real `pnpm add` (in a throwaway project) rather than `pnpm store add`, because
// `pnpm store add <pkg>` only adds that one package to the store, not its dependencies — so an
// Actor's install would still download the whole transitive tree.
//
// pnpm's store is versioned (store/v10, store/v11, ...) and different pnpm majors use different
// store versions, so we warm a store for each major in PNPM_MAJORS. The store is written to
// `<cache>/store` so that, once injected, it matches the base image's
// PNPM_CONFIG_STORE_DIR=/pkg-cache/pnpm/store and installs actually find it.

import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CacheState, createArchive, resetDir, run, writeState } from '../shared/archive.ts';
import { getCacheDir, packagesToPrecache, versionsToCache } from '../shared/constants.ts';
import { fetchLatestVersions, fetchStableVersions } from '../shared/registry.ts';

const pm = 'pnpm';

// pnpm majors to warm a store for. Each writes its own store/vNN subdirectory.
const PNPM_MAJORS = [10, 11];

const cacheDir = getCacheDir(pm); // .../data/pnpm        -> /pkg-cache/pnpm
const storeDir = join(cacheDir, 'store'); // .../data/pnpm/store -> /pkg-cache/pnpm/store
const tmpDir = fileURLToPath(new URL('../../data/pnpm_tmp/', import.meta.url));

const baseEnv = {
	...process.env,
	COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
	// Belt-and-suspenders: never download browsers while warming the store.
	PUPPETEER_SKIP_DOWNLOAD: 'true',
	PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
};

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

// Collect the package specs to warm (identical set for every pnpm version).
const state: CacheState = {};
const specs: string[] = [];
for (const packageName of packagesToPrecache) {
	const versions = await fetchLatestVersions(packageName, versionsToCache);
	state[packageName] = versions;
	for (const version of versions) specs.push(`${packageName}@${version}`);
}

for (const pnpmVersion of pnpmVersions) {
	// Fresh throwaway project per pnpm version; the store accumulates every version we add.
	await resetDir(tmpDir);
	await writeFile(join(tmpDir, 'package.json'), `${JSON.stringify({ name: 'cache-builder-tmp', private: true }, null, '\t')}\n`);

	for (const spec of specs) {
		console.log(`[${pm}] caching ${spec} (with dependencies) using pnpm@${pnpmVersion}`);

		try {
			// `--ignore-scripts` skips postinstall (no browser downloads); we only need the store
			// populated. node_modules in tmpDir is throwaway.
			await run('corepack', [`pnpm@${pnpmVersion}`, 'add', '--ignore-scripts', '--store-dir', storeDir, spec], {
				cwd: tmpDir,
				env: baseEnv,
			});
		} catch (error) {
			console.error(`[${pm}] failed to cache ${spec} with pnpm@${pnpmVersion}:`, error);
		}
	}
}

await writeState(pm, state);
await createArchive(pm, cacheDir);
await rm(tmpDir, { recursive: true, force: true });

console.log(`[${pm}] done — archived store (pnpm ${pnpmVersions.join(', ')}) with dependency trees for ${Object.keys(state).length} packages`);
