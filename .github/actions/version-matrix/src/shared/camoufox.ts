import { satisfies } from 'semver';
import { fetchPackageManifest } from './npm.ts';
import { fetchPackageVersion, findRequirementSpecifierSet, pythonSpecifierSetToSemverRange } from './pypi.ts';

/**
 * Camoufox ships its own Firefox build, and its Juggler protocol only speaks to a limited range of Playwright
 * versions - for example, camoufox 0.5.4 does not work with Playwright 1.61.0 and newer.
 *
 * That range is not pinned here. It is read from the camoufox package metadata instead, so that the images follow
 * whatever camoufox currently supports:
 *
 * - `camoufox-js` declares it as a `playwright-core` peer dependency
 * - `camoufox` (PyPI) declares it as a `playwright` requirement
 *
 * Note that the images install camoufox with a caret / compatible-release range, so the version actually installed
 * may be newer than the one we read the metadata from. It is the newest version at the time the matrix is generated,
 * which is as close as we can get without resolving the range twice.
 */
const camoufoxPackages = {
	node: {
		packageName: 'camoufox-js',
		// `playwright` and `playwright-core` are released in lockstep under the same version numbers, so the range
		// declared for `playwright-core` applies as-is to the `playwright` version installed in the image
		dependencyName: 'playwright-core',
	},
	python: {
		packageName: 'camoufox',
		dependencyName: 'playwright',
	},
} as const;

async function fetchNodeCamoufoxPlaywrightRange(camoufoxVersion: string) {
	const { dependencyName } = camoufoxPackages.node;
	const manifest = await fetchPackageManifest(camoufoxPackages.node.packageName, camoufoxVersion);

	return manifest.peerDependencies?.[dependencyName] ?? manifest.dependencies?.[dependencyName];
}

async function fetchPythonCamoufoxPlaywrightRange(camoufoxVersion: string) {
	const { dependencyName } = camoufoxPackages.python;
	const { info } = await fetchPackageVersion(camoufoxPackages.python.packageName, camoufoxVersion);

	const specifierSet = findRequirementSpecifierSet(info.requires_dist ?? [], dependencyName);

	if (specifierSet === undefined) {
		return undefined;
	}

	return pythonSpecifierSetToSemverRange(specifierSet);
}

/**
 * A range that matches everything (`*`, or no range at all) is not a statement of support - it is the default you get
 * when a package does not say anything. We cannot tell which Playwright versions work from it, so it is treated the
 * same as not being able to read the range at all.
 */
export function isUnboundedRange(range: string) {
	return ['', '*', 'x', 'X'].includes(range.trim());
}

/**
 * Resolves which of the given Playwright versions can be used to build the camoufox image, based on the range the
 * camoufox package declares for its Playwright dependency.
 *
 * If the range cannot be determined - the dependency is not declared, it says nothing (`*`), it cannot be expressed as
 * a semver range, or the registry request fails - this returns no versions at all, which leaves the camoufox image out
 * of the matrix. Publishing an image we have no reason to believe works is worse than not publishing one, and the
 * other images are unaffected either way.
 */
export async function resolveCamoufoxPlaywrightVersions(
	runtime: 'node' | 'python',
	camoufoxVersion: string,
	playwrightVersions: string[],
) {
	const { packageName } = camoufoxPackages[runtime];

	let range: string | undefined;

	try {
		range =
			runtime === 'node'
				? await fetchNodeCamoufoxPlaywrightRange(camoufoxVersion)
				: await fetchPythonCamoufoxPlaywrightRange(camoufoxVersion);
	} catch (error) {
		console.error(
			`Failed to read the supported Playwright range from ${packageName}@${camoufoxVersion}, the camoufox image will be skipped`,
			error,
		);

		return { range: undefined, versions: [] };
	}

	if (range === undefined) {
		console.error(
			`${packageName}@${camoufoxVersion} does not declare a Playwright dependency, the camoufox image will be skipped`,
		);

		return { range: undefined, versions: [] };
	}

	if (isUnboundedRange(range)) {
		console.error(
			`${packageName}@${camoufoxVersion} declares its Playwright dependency as "${range}", which says nothing about what it supports - the camoufox image will be skipped`,
		);

		return { range, versions: [] };
	}

	return { range, versions: playwrightVersions.filter((version) => satisfies(version, range)) };
}
