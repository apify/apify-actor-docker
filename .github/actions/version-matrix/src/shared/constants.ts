import { appendFile } from 'node:fs/promises';

export const supportedPythonVersions = ['3.10', '3.11', '3.12', '3.13', '3.14'];

export const supportedNodeVersions = ['20', '22', '24'];

export const shouldUseLastFive = process.env.SHOULD_USE_LAST_FIVE === 'true';

export const emptyMatrix = JSON.stringify({ include: [] });

/**
 * The version of Python to be considered as the "default" version for the built image tags.
 */
export const latestPythonVersion = '3.14';

/**
 * The version of Node to be considered as the "default" version for the built image tags.
 */
export const latestNodeVersion = '22';

export async function setParametersForTriggeringUpdateWorkflowOnActorTemplates(
	runtime: 'python' | 'node',
	moduleVersion?: string,
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

	if (!process.env.GITHUB_OUTPUT) {
		console.error('GITHUB_OUTPUT is not set');

		console.error(
			`Would have appended the following to the output:
latest-runtime-version=${latestRuntimeVersion}${moduleVersion ? `\nlatest-module-version=${moduleVersion}` : ''}\n`,
		);

		return;
	}

	await appendFile(
		process.env.GITHUB_OUTPUT!,
		`latest-runtime-version=${latestRuntimeVersion}${moduleVersion ? `\nlatest-module-version=${moduleVersion}` : ''}\n`,
	);
}
