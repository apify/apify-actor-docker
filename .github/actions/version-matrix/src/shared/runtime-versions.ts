import { compare, prerelease, valid } from 'semver';

const nodeDistUrl = 'https://nodejs.org/dist/index.json';
const pythonEndOfLifeUrl = 'https://endoflife.date/api/python.json';

interface NodeDistEntry {
	version: string;
}

/**
 * Fetches the latest minor.patch version for each given Node.js major version.
 * This is used to detect when a new minor/patch release of Node.js is available,
 * which should trigger an image rebuild even though the major version hasn't changed.
 */
export async function fetchNodeRuntimeVersions(majorVersions: string[]): Promise<string[]> {
	const response = await fetch(nodeDistUrl);

	if (!response.ok) {
		throw new Error('Failed to fetch Node.js distribution index', {
			cause: await response.text(),
		});
	}

	const entries: NodeDistEntry[] = await response.json();

	const result: string[] = [];

	for (const major of majorVersions) {
		const prefix = `v${major}.`;
		const matching = entries
			.filter((e) => e.version.startsWith(prefix))
			.map((e) => e.version.slice(1)) // Remove 'v' prefix
			.filter((v) => valid(v) !== null && prerelease(v) === null)
			.sort((a, b) => compare(a, b));

		const latest = matching.at(-1);

		if (!latest) {
			throw new Error(`No Node.js release found for major version ${major}`);
		}

		result.push(latest);
	}

	return result;
}

interface PythonEndOfLifeEntry {
	cycle: string;
	latest: string;
}

/**
 * Fetches the latest patch version for each given Python major.minor version.
 * This is used to detect when a new patch release of Python is available,
 * which should trigger an image rebuild even though the major.minor version hasn't changed.
 */
export async function fetchPythonRuntimeVersions(majorMinorVersions: string[]): Promise<string[]> {
	const response = await fetch(pythonEndOfLifeUrl);

	if (!response.ok) {
		throw new Error('Failed to fetch Python version info from endoflife.date', {
			cause: await response.text(),
		});
	}

	const entries: PythonEndOfLifeEntry[] = await response.json();

	const versionMap = new Map(entries.map((e) => [e.cycle, e.latest]));

	const result: string[] = [];

	for (const majorMinor of majorMinorVersions) {
		const latest = versionMap.get(majorMinor);

		if (!latest) {
			throw new Error(`No Python release found for version ${majorMinor}`);
		}

		result.push(latest);
	}

	return result;
}
