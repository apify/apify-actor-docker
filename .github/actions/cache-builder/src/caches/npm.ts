// Warms an npm cache with the most recent versions of the precache packages and zips it.
// Runs natively on Node.js >=24 (TypeScript type stripping, no build step).

import { type CacheState, createArchive, resetDir, run, writeState } from '../shared/archive.ts';
import { getCacheDir, packagesToPrecache, versionsToCache } from '../shared/constants.ts';
import { fetchLatestVersions } from '../shared/registry.ts';

const pm = 'npm';
const cacheDir = getCacheDir(pm);

console.log(`[${pm}] cache location: ${cacheDir}`);
await resetDir(cacheDir);

const state: CacheState = {};

for (const packageName of packagesToPrecache) {
	const versions = await fetchLatestVersions(packageName, versionsToCache);
	state[packageName] = versions;

	for (const version of versions) {
		const spec = `${packageName}@${version}`;
		console.log(`[${pm}] caching ${spec}`);

		try {
			await run('npm', ['cache', 'add', spec], {
				env: { ...process.env, npm_config_cache: cacheDir },
			});
		} catch (error) {
			console.error(`[${pm}] failed to cache ${spec}:`, error);
		}
	}
}

await writeState(pm, state);
await createArchive(pm, cacheDir);

console.log(`[${pm}] done — archived caches for ${Object.keys(state).length} packages`);
