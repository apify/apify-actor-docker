// Warms a pnpm content-addressable store with the most recent versions of the precache
// packages and zips it. Runs natively on Node.js >=24 (TypeScript type stripping, no build step).

import { type CacheState, createArchive, resetDir, run, writeState } from '../shared/archive.ts';
import { getCacheDir, packagesToPrecache, versionsToCache } from '../shared/constants.ts';
import { fetchLatestVersions } from '../shared/registry.ts';

const pm = 'pnpm';
// For pnpm the "cache" is its content-addressable store.
const storeDir = getCacheDir(pm);

console.log(`[${pm}] store location: ${storeDir}`);
await resetDir(storeDir);

const state: CacheState = {};

for (const packageName of packagesToPrecache) {
	const versions = await fetchLatestVersions(packageName, versionsToCache);
	state[packageName] = versions;

	for (const version of versions) {
		const spec = `${packageName}@${version}`;
		console.log(`[${pm}] caching ${spec}`);

		try {
			// `pnpm store add` downloads packages straight into the store without a project.
			await run('pnpm', ['store', 'add', '--store-dir', storeDir, spec]);
		} catch (error) {
			console.error(`[${pm}] failed to cache ${spec}:`, error);
		}
	}
}

await writeState(pm, state);
await createArchive(pm, storeDir);

console.log(`[${pm}] done — archived store for ${Object.keys(state).length} packages`);
