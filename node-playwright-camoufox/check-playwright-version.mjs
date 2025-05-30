import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const packageJsonPath = join(import.meta.dirname, 'package.json');
const dockerfilePath = join(import.meta.dirname, 'Dockerfile');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const dependencyVersion = packageJson.dependencies?.playwright;

if (!dependencyVersion) {
    // no playwright dependency found in package.json
    process.exit(0);
}

if (dependencyVersion.match(/^[\^~]/)) {
    console.error(`playwright dependency in package.json is not pinned to a specific version. Please pin it to a specific version and use the same version in your Dockerfile base image tag, e.g. ${dependencyVersion.replace(/^[\^~]/, '')}.`);
    process.exit(1);
}

const dockerfileContent = readFileSync(dockerfilePath, 'utf8');
const matches = dockerfileContent.match(/FROM\s+.*playwright.*:\d+-(\d+\.\d+\.\d+)/ig);

for (const match of matches) {
    const dockerImageVersion = match.match(/FROM\s+.*playwright.*:\d+-(\d+\.\d+\.\d+)/i)?.[1];

    if (dockerImageVersion !== dependencyVersion) {
        console.error(`playwright version in Dockerfile (${dockerImageVersion}) does not match version in package.json (${dependencyVersion})`);
        process.exit(1);
    }
}
