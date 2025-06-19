import { fileURLToPath } from 'node:url';

export const packagesToPrecache = [
	//
	'crawlee',
	'apify',
	'playwright',
	'puppeteer',
	'typescript',
];

export function getCachePath(pm: string) {
	return fileURLToPath(new URL(`../../data/${pm}/`, import.meta.url));
}
