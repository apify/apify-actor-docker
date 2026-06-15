// Warms a Yarn (Berry) global cache with the most recent versions of the precache packages
// and zips it. Runs natively on Node.js >=24 (TypeScript type stripping, no build step).

import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CacheState, createArchive, resetDir, run, writeState } from '../shared/archive.ts';
import { getCacheDir, packagesToPrecache, versionsToCache } from '../shared/constants.ts';
import { fetchLatestVersions } from '../shared/registry.ts';

const pm = 'yarn';
const cacheDir = getCacheDir(pm);
// Yarn needs a project to run `yarn add` in; we use a throwaway one and delete it afterwards.
const tmpDir = fileURLToPath(new URL('../../data/yarn_tmp/', import.meta.url));

console.log(`[${pm}] cache location: ${cacheDir}`);
await resetDir(cacheDir);
await resetDir(tmpDir);

// Minimal throwaway project, pinned to a modern Yarn (Berry) release.
await writeFile(
	join(tmpDir, 'package.json'),
	`${JSON.stringify({ name: 'cache-builder-tmp', private: true }, null, '\t')}\n`,
);
await writeFile(join(tmpDir, 'yarn.lock'), '');

// Switch the throwaway project to the latest stable Yarn (Berry) so the global-cache
// settings below are honored (Yarn Classic does not support them).
await run('yarn', ['set', 'version', 'stable'], { cwd: tmpDir });

const yarnEnv = {
	...process.env,
	// Send every download into our cache directory instead of $HOME.
	YARN_CACHE_FOLDER: cacheDir,
	YARN_GLOBAL_FOLDER: cacheDir,
	YARN_ENABLE_GLOBAL_CACHE: 'true',
	// Keep the throwaway install simple and non-strict.
	YARN_NODE_LINKER: 'node-modules',
	YARN_ENABLE_IMMUTABLE_INSTALLS: 'false',
};

const state: CacheState = {};

for (const packageName of packagesToPrecache) {
	const versions = await fetchLatestVersions(packageName, versionsToCache);
	state[packageName] = versions;

	for (const version of versions) {
		const spec = `${packageName}@${version}`;
		console.log(`[${pm}] caching ${spec}`);

		try {
			await run('yarn', ['add', spec], { cwd: tmpDir, env: yarnEnv });
		} catch (error) {
			console.error(`[${pm}] failed to cache ${spec}:`, error);
		}
	}
}

await writeState(pm, state);
await createArchive(pm, cacheDir);
await rm(tmpDir, { recursive: true, force: true });

console.log(`[${pm}] done — archived caches for ${Object.keys(state).length} packages`);
