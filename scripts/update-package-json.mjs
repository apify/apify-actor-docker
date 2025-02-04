import { readFile, writeFile } from 'node:fs/promises';

if (process.argv.length !== 3) {
	console.error(`Usage: node ${process.argv[0]} ./path-to-folder-with-package-json`);
	process.exit(1);
}

const path = process.argv[2];

const packageJsonPath = new URL(`../${path}/package.json`, import.meta.url);

const replacers = ['APIFY_VERSION', 'CRAWLEE_VERSION', 'PLAYWRIGHT_VERSION', 'PUPPETEER_VERSION'];

try {
	const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

	console.log(`Updating package.json in ${path}`);

	for (const [depName, depVersion] of Object.entries(packageJson.dependencies)) {
		if (!replacers.includes(depVersion)) {
			continue;
		}

		if (!process.env[depVersion]) {
			console.error(`Environment variable ${depVersion} is not set, cannot update dependency ${depName}`);
			process.exit(1);
		}

		packageJson.dependencies[depName] = process.env[depVersion];
	}

	if (packageJson.overrides) {
		for (const [depName, depOverrides] of Object.entries(packageJson.overrides)) {
			if (typeof depOverrides !== 'object') {
				// Maybe string
				if (!replacers.includes(depOverrides)) {
					continue;
				}

				if (!process.env[depOverrides]) {
					console.error(
						`Environment variable ${depOverrides} is not set, cannot update dependency override for ${depName}`,
					);
					process.exit(1);
				}

				packageJson.overrides[depName] = process.env[depOverrides];

				continue;
			}

			for (const [depOverrideName, depVersionOverrides] of Object.entries(depOverrides)) {
				if (!replacers.includes(depVersionOverrides)) {
					continue;
				}

				if (!process.env[depVersionOverrides]) {
					console.error(
						`Environment variable ${depVersionOverrides} is not set, cannot update dependency override for ${depOverrideName}`,
					);
					process.exit(1);
				}

				packageJson.overrides[depName][depOverrideName] = process.env[depVersionOverrides];
			}
		}
	}

	await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 4));
} catch (err) {
	console.error(`Failed to read package.json from ${packageJsonPath}`);
	console.error(err);

	process.exit(1);
}
