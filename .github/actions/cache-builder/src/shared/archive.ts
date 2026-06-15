import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { type PackageManager, getArchivePath, getStatePath } from './constants.ts';

// Promisified execFile — used by the cache scripts to drive npm/yarn/pnpm and zip.
export const run = promisify(execFile);

// Maps each cached package name to the list of versions that were warmed up.
export type CacheState = Record<string, string[]>;

// Removes and recreates a directory so each run starts from a clean slate.
export async function resetDir(dir: string): Promise<void> {
	await rm(dir, { recursive: true, force: true });
	await mkdir(dir, { recursive: true });
}

// Writes the `<pm>_state.json` file describing which versions were cached.
export async function writeState(pm: PackageManager, state: CacheState): Promise<void> {
	await writeFile(getStatePath(pm), `${JSON.stringify(state, null, '\t')}\n`);
}

// Zips the contents of `cacheDir` into `data/<pm>.zip`. Paths inside the archive are
// relative to `cacheDir`, so it can be unpacked straight into a package manager's cache.
export async function createArchive(pm: PackageManager, cacheDir: string): Promise<void> {
	const archivePath = getArchivePath(pm);
	await rm(archivePath, { force: true });
	// -r recurse, -q quiet, -X drop extra file attributes for more reproducible archives.
	await run('zip', ['-r', '-q', '-X', archivePath, '.'], { cwd: cacheDir });
}
