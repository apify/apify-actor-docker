import spawn from 'nano-spawn';
import { fetchPackageVersions, getCachePathData } from '../shared/npm.ts';
import { writeFile } from 'node:fs/promises';
import { packagesToPrecache } from '../shared/constants.ts';

const cachePath = getCachePathData();

console.log(`Cache location: ${cachePath.path}`);

const cacheState: Record<string, string[]> = {};

for (const packageName of packagesToPrecache) {
	const lastFiveVersions = (await fetchPackageVersions(packageName)).slice(-5);
	cacheState[packageName] = lastFiveVersions;

	for (const version of lastFiveVersions) {
		console.log(`Fetching ${packageName}@${version}`);

		try {
			await spawn('npm', ['cache', 'add', `${packageName}@${version}`], {
				env: {
					[cachePath.environmentVariable]: cachePath.path,
				},
			});
		} catch (error) {
			console.error(`Failed to fetch ${packageName}@${version}:`, error);
		} finally {
			console.log(`Done fetching ${packageName}@${version}`);
		}
	}
}

await writeFile(new URL('../../data/npm_state.json', import.meta.url), JSON.stringify(cacheState, null, '\t'));
