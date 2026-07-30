import { appendFile } from 'node:fs/promises';

export const supportedPythonVersions = ['3.10', '3.11', '3.12', '3.13', '3.14'];

export const supportedNodeVersions = ['22', '24', '26'];

export const shouldUseLastFive = process.env.SHOULD_USE_LAST_FIVE === 'true';

export const emptyMatrix = JSON.stringify({ include: [] });

/**
 * Camoufox ships its own Firefox build, and its Juggler protocol is not compatible with Playwright 1.61.0 and newer.
 *
 * - the Python `camoufox` package declares `playwright<1.61`, so the image build fails outright with
 *   `ResolutionImpossible` during `pip install`
 * - the `camoufox-js` package declares no such constraint, but the image breaks at runtime, as soon as a page is
 *   opened: `Protocol error (Browser.setDefaultViewport): Found property "<root>.viewport.isMobile" ... which is not
 *   described in this scheme`
 *
 * The Camoufox images are therefore built only with the Playwright versions matching this range. Bump it once Camoufox
 * catches up with the newer Playwright releases.
 */
export const camoufoxPlaywrightVersionRange = '<1.61.0';

/**
 * The version of Python to be considered as the "default" version for the built image tags.
 */
export const latestPythonVersion = '3.14';

/**
 * The version of Node to be considered as the "default" version for the built image tags.
 */
export const latestNodeVersion = '24';

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
