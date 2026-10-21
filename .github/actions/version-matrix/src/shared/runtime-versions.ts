import { compare, prerelease, valid } from 'semver';

const nodeDistUrl = 'https://nodejs.org/dist/index.json';
const dockerHubNodeTagUrl = 'https://hub.docker.com/v2/repositories/library/node/tags';
const nodeSourcePackagesUrl = (major: string) =>
	`https://deb.nodesource.com/node_${major}.x/dists/nodistro/main/binary-amd64/Packages`;
const pythonEndOfLifeUrl = 'https://endoflife.date/api/python.json';

/**
 * Docker Hub `node` image variants our Dockerfiles build from (`node/Dockerfile` uses alpine, the browser images use
 * trixie-slim).
 */
const dockerHubNodeVariants = ['alpine', 'trixie-slim'];

interface NodeDistEntry {
	version: string;
}

async function dockerHubNodeTagExists(tag: string): Promise<boolean> {
	const response = await fetch(`${dockerHubNodeTagUrl}/${tag}`);

	if (response.status === 404) {
		return false;
	}

	if (!response.ok) {
		throw new Error(`Failed to check Docker Hub tag node:${tag}`, {
			cause: await response.text(),
		});
	}

	return true;
}

/**
 * Returns the Node.js versions NodeSource publishes for the given major (used by the `node-playwright` image).
 */
async function fetchNodeSourceVersions(major: string): Promise<Set<string>> {
	const response = await fetch(nodeSourcePackagesUrl(major));

	if (!response.ok) {
		throw new Error(`Failed to fetch NodeSource package index for Node.js ${major}`, {
			cause: await response.text(),
		});
	}

	const text = await response.text();

	return new Set([...text.matchAll(/^Version: (\d+\.\d+\.\d+)-/gm)].map((m) => m[1]));
}

/**
 * Fetches the latest minor.patch version for each given Node.js major version that our base images already ship.
 * This is used to detect when a new minor/patch release of Node.js is available,
 * which should trigger an image rebuild even though the major version hasn't changed.
 *
 * Docker Hub and NodeSource publish a release hours after nodejs.org. Recording a version in the cache before the
 * base images have it would mark the images as up to date while they still contain the previous (possibly
 * vulnerable) release, so a version only counts once every base image source has it.
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
			.sort((a, b) => compare(b, a));

		if (!matching.length) {
			throw new Error(`No Node.js release found for major version ${major}`);
		}

		const nodeSourceVersions = await fetchNodeSourceVersions(major);
		let latest: string | undefined;

		for (const version of matching) {
			if (!nodeSourceVersions.has(version)) {
				continue;
			}

			const tagsExist = await Promise.all(
				dockerHubNodeVariants.map((variant) => dockerHubNodeTagExists(`${version}-${variant}`)),
			);

			if (tagsExist.every(Boolean)) {
				latest = version;
				break;
			}
		}

		if (!latest) {
			throw new Error(`No Node.js release available in base images for major version ${major}`);
		}

		if (latest !== matching[0]) {
			console.error(
				`Node.js ${matching[0]} is released but not yet in all base images, using ${latest} for major ${major}`,
			);
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
