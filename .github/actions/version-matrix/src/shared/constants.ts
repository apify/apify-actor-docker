import { appendFile } from 'node:fs/promises';

export const supportedPythonVersions = ['3.10', '3.11', '3.12', '3.13', '3.14'];

export const supportedNodeVersions = ['22', '24', '26'];

export const shouldUseLastFive = process.env.SHOULD_USE_LAST_FIVE === 'true';

export const emptyMatrix = JSON.stringify({ include: [] });

/**
 * The version of Python to be considered as the "default" version for the built image tags.
 */
export const latestPythonVersion = '3.14';

/**
 * The version of Node to be considered as the "default" version for the built image tags.
 */
export const latestNodeVersion = '24';

/**
 * Writes the parameters the release workflow sends to actor-templates as a `repository_dispatch`.
 *
 * `camoufoxModuleVersion` is separate from `moduleVersion` on purpose. Camoufox only supports a subset of the
 * Playwright releases, so its image is built with an older Playwright than the other images in the same matrix - see
 * `resolveCamoufoxPlaywrightVersions`. Sending one version for both would tell actor-templates to pin a camoufox image
 * tag that was never built. It is left unset when the camoufox image is not part of this matrix run, and the workflow
 * skips the camoufox dispatch in that case.
 */
export async function setParametersForTriggeringUpdateWorkflowOnActorTemplates(
	runtime: 'python' | 'node',
	moduleVersion?: string,
	camoufoxModuleVersion?: string,
) {
	let latestRuntimeVersion: string;

	switch (runtime) {
		case 'python':
			latestRuntimeVersion = latestPythonVersion;
			break;
		case 'node':
			latestRuntimeVersion = latestNodeVersion;
			break;
	}

	const output = [
		`latest-runtime-version=${latestRuntimeVersion}`,
		...(moduleVersion ? [`latest-module-version=${moduleVersion}`] : []),
		...(camoufoxModuleVersion ? [`latest-camoufox-module-version=${camoufoxModuleVersion}`] : []),
		'',
	].join('\n');

	if (!process.env.GITHUB_OUTPUT) {
		console.error('GITHUB_OUTPUT is not set');

		console.error(`Would have appended the following to the output:\n${output}`);

		return;
	}

	await appendFile(process.env.GITHUB_OUTPUT!, output);
}
