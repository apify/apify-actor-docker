import { readFile, writeFile } from 'node:fs/promises';

export const PYTHON_VERSION_MARKER = 'PYTHON_VERSION';
export const NODE_VERSION_MARKER = 'NODE_VERSION';
export const APIFY_VERSION_MARKER = 'APIFY_VERSION';
export const PUPPETEER_VERSION_MARKER = 'PUPPETEER_VERSION';
export const SELENIUM_VERSION_MARKER = 'SELENIUM_VERSION';
export const PLAYWRIGHT_VERSION_MARKER = 'PLAYWRIGHT_VERSION';
export const CRAWLEE_VERSION_MARKER = 'CRAWLEE_VERSION';
export const CAMOUFOX_VERSION_MARKER = 'CAMOUFOX_VERSION';
export const CERTIFICATES_UPDATED_AT_MARKER = 'CERTIFICATES_UPDATED_AT';

const cacheStateFile = new URL(`../../data/cache-states-${process.env.RELEASE_TAG || 'latest'}.json`, import.meta.url);

type CacheState = Record<string, { hash: string; hashEntries: string }>;

export async function getCacheState(): Promise<CacheState> {
	try {
		const cacheState = JSON.parse(await readFile(cacheStateFile, 'utf8'));

		return cacheState;
	} catch (err) {
		console.error('Failed to read cache state file', err);
		return {};
	}
}

export type CacheValues = Partial<
	Record<
		| typeof PYTHON_VERSION_MARKER
		| typeof NODE_VERSION_MARKER
		| typeof APIFY_VERSION_MARKER
		| typeof PUPPETEER_VERSION_MARKER
		| typeof SELENIUM_VERSION_MARKER
		| typeof PLAYWRIGHT_VERSION_MARKER
		| typeof CRAWLEE_VERSION_MARKER
		| typeof CAMOUFOX_VERSION_MARKER
		| typeof CERTIFICATES_UPDATED_AT_MARKER,
		string[]
	>
>;

const certificatesTimestampFile = new URL('../../../../../certificates/.last-updated-at', import.meta.url);

export async function getCertificatesUpdatedAt(): Promise<string> {
	try {
		const timestamp = (await readFile(certificatesTimestampFile, 'utf8')).trim();
		return timestamp;
	} catch {
		// If file doesn't exist, return empty string (will trigger download fallback in Docker)
		return '';
	}
}

export async function needsToRunMatrixGeneration(name: string, values: CacheValues) {
	// For pull requests, we always want to run the matrix generation.
	if (process.env.SKIP_CACHE_CHECK === 'true') {
		return true;
	}

	const cacheState = await getCacheState();

	// Never cached -> run matrix generation

	if (!cacheState[name]) {
		return true;
	}

	const [, hash] = await generateCacheHashForMatrix(name, values);

	// Some of the parameters for the cache changed -> run matrix generation

	if (hash !== cacheState[name].hash) {
		return true;
	}

	// All parameters are the same -> don't run matrix generation

	return false;
}

export async function generateCacheHashForMatrix(name: string, values: CacheValues) {
	let hashEntriesString = '';

	// Sort the key, so object order does not affect the cache
	const keys = Object.keys(values).sort((a, b) => a.localeCompare(b)) as (keyof CacheValues)[];

	for (const [i, key] of keys.entries()) {
		if (values[key]!.length === 0) {
			continue;
		}

		hashEntriesString += `${key}=${values[key]!.join(',')}`;

		if (i < keys.length - 1) {
			hashEntriesString += ';';
		}
	}

	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(name + hashEntriesString));

	return [hashEntriesString, Buffer.from(hash).toString('hex')] as const;
}

export async function updateCacheState(name: string, values: CacheValues) {
	// Skip updating the cache if the SKIP_CACHE_CHECK environment variable is set to true
	if (process.env.SKIP_CACHE_CHECK === 'true') {
		return true;
	}

	const cacheState = await getCacheState();

	const [hashEntries, hash] = await generateCacheHashForMatrix(name, values);

	cacheState[name] = {
		hash,
		hashEntries,
	};

	await writeFile(cacheStateFile, JSON.stringify(cacheState, null, '\t') + '\n');
}
