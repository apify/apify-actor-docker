import { mkdir, rm, writeFile } from 'node:fs/promises';
import { getCachePath, packagesToPrecache } from '../shared/constants.ts';
import { fetchPackageVersions } from '../shared/npm.ts';
import spawn from 'nano-spawn';

const environmentVariable = 'YARN_CACHE_FOLDER';
const globalEnvironmentVariable = 'YARN_GLOBAL_FOLDER';
const cachePath = getCachePath('yarn');

console.log(`Cache location: ${cachePath}`);

const cacheState: Record<string, string[]> = {};

const tmpDir = new URL('../../data/yarn_tmp/', import.meta.url);

{
	// Warm up the temp directory
	await mkdir(tmpDir, { recursive: true });

	await writeFile(new URL('package.json', tmpDir), JSON.stringify({ private: true }));
	await writeFile(new URL('yarn.lock', tmpDir), '');

	await spawn('yarn', 'config set enableGlobalCache true'.split(' '), {
		cwd: tmpDir,
	});

	await spawn('yarn', 'config set nodeLinker node-modules'.split(' '), {
		cwd: tmpDir,
	});

	await spawn('yarn', 'set version stable --yarn-path'.split(' '), {
		cwd: tmpDir,
	});
}

for (const packageName of packagesToPrecache) {
	const lastFiveVersions = (await fetchPackageVersions(packageName)).slice(-5);
	cacheState[packageName] = lastFiveVersions;

	for (const version of lastFiveVersions) {
		console.log(`Fetching ${packageName}@${version}`);

		try {
			await spawn('yarn', ['add', `${packageName}@${version}`], {
				env: {
					[environmentVariable]: cachePath,
					[globalEnvironmentVariable]: cachePath,
					YARN_ENABLE_GLOBAL_CACHE: 'true',
				},
				cwd: tmpDir,
			});
		} catch (error) {
			console.error(`Failed to fetch ${packageName}@${version}:`, error);
		} finally {
			console.log(`Done fetching ${packageName}@${version}`);
		}
	}
}

await writeFile(new URL('../../data/yarn_state.json', import.meta.url), JSON.stringify(cacheState, null, '\t'));

await rm(tmpDir, { recursive: true });
