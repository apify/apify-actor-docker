// Warms an npm cache with the most recent versions of the precache packages — including
// their full dependency trees — and zips it. Runs natively on Node.js >=24 (type stripping).
//
// We use a real `npm install` (in a throwaway project) rather than `npm cache add`, because
// `npm cache add <pkg>` only caches that one package's tarball, not its dependencies — so an
// Actor's install would still download the whole transitive tree.

import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CacheState, createArchive, resetDir, run, writeState } from '../shared/archive.ts';
import { getCacheDir, packagesToPrecache, versionsToCache } from '../shared/constants.ts';
import { fetchLatestVersions } from '../shared/registry.ts';

const pm = 'npm';
const cacheDir = getCacheDir(pm);
// `npm install` needs a project to run in; we use a throwaway one and delete it afterwards.
const tmpDir = fileURLToPath(new URL('../../data/npm_tmp/', import.meta.url));

const npmEnv = {
	...process.env,
	npm_config_cache: cacheDir,
	// Belt-and-suspenders: never download browsers while warming the cache.
	PUPPETEER_SKIP_DOWNLOAD: 'true',
	PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
};

console.log(`[${pm}] cache location: ${cacheDir}`);
await resetDir(cacheDir);
await resetDir(tmpDir);
await writeFile(join(tmpDir, 'package.json'), `${JSON.stringify({ name: 'cache-builder-tmp', private: true }, null, '\t')}\n`);

// Collect the package specs to warm.
const state: CacheState = {};
const specs: string[] = [];
for (const packageName of packagesToPrecache) {
	const versions = await fetchLatestVersions(packageName, versionsToCache);
	state[packageName] = versions;
	for (const version of versions) specs.push(`${packageName}@${version}`);
}

for (const spec of specs) {
	console.log(`[${pm}] caching ${spec} (with dependencies)`);

	try {
		// `--ignore-scripts` skips postinstall (no browser downloads, no arbitrary code); we only
		// need the tarballs in the cache. node_modules in tmpDir is throwaway.
		await run('npm', ['install', '--no-save', '--no-package-lock', '--omit=optional', '--ignore-scripts', spec], {
			cwd: tmpDir,
			env: npmEnv,
		});
	} catch (error) {
		console.error(`[${pm}] failed to cache ${spec}:`, error);
	}
}

await writeState(pm, state);
await createArchive(pm, cacheDir);
await rm(tmpDir, { recursive: true, force: true });

console.log(`[${pm}] done — archived cache with dependency trees for ${Object.keys(state).length} packages`);
