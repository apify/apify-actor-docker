// Renders the Markdown body for the "image size" PR comment.
//
// Usage: node format-image-size-report.ts <reports-dir>
// Runs natively on Node.js >=24 via built-in TypeScript type stripping (no build step).
//
// <reports-dir> contains one JSON file per built image (uploaded as artifacts by
// the build matrix). Each file has the shape described by SizeReport below;
// `currentBytes` is empty when there is no published baseline image to compare against.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface SizeReport {
    matrix?: Record<string, string>;
    baseImage?: string;
    currentBytes?: string;
    newBytes?: string;
}

// Matrix keys we never want to surface as a "variant" in the table.
const IGNORED_VERSION_KEYS = new Set<string>([
    'node-version',
    'python-version',
    'apify-version',
    'crawlee-version',
    'latest-node-version',
    'latest-python-version',
]);

const MiB = 1024 * 1024;

function readReports(reportsDir: string): SizeReport[] {
    let files: string[];
    try {
        files = readdirSync(reportsDir).filter((file) => file.endsWith('.json'));
    } catch {
        return [];
    }

    const reports: SizeReport[] = [];
    for (const file of files) {
        try {
            reports.push(JSON.parse(readFileSync(join(reportsDir, file), 'utf8')) as SizeReport);
        } catch {
            // Skip unreadable/corrupt report files rather than failing the whole comment.
        }
    }
    return reports;
}

function formatSize(bytes: string | undefined): string | null {
    const n = Number(bytes);
    if (!bytes || !Number.isFinite(n)) return null;
    return `${(n / MiB).toFixed(1)} MiB`;
}

function formatDelta(currentBytes: string | undefined, newBytes: string | undefined): string {
    const current = Number(currentBytes);
    const next = Number(newBytes);
    if (!currentBytes || !Number.isFinite(current) || !Number.isFinite(next)) {
        return '🆕 _new image_';
    }
    const diff = next - current;
    const pct = current === 0 ? 0 : (diff / current) * 100;
    const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
    const emoji = diff > 0 ? '🔺' : diff < 0 ? '🔻' : '➖';
    const absMiB = (Math.abs(diff) / MiB).toFixed(1);
    return `${emoji} ${sign}${absMiB} MiB (${sign}${Math.abs(pct).toFixed(1)}%)`;
}

function describeVariant(matrix: Record<string, string> = {}): string {
    const variants: string[] = [];
    for (const [key, value] of Object.entries(matrix)) {
        if (!value || IGNORED_VERSION_KEYS.has(key) || !key.endsWith('-version')) continue;
        variants.push(`${key.replace(/-version$/, '')} ${value}`);
    }
    return variants.join(', ');
}

function render(reports: SizeReport[]): string {
    const lines: string[] = [];
    lines.push('### 📦 Image size report');
    lines.push('');

    if (reports.length === 0) {
        lines.push('No image size data was collected (no images were built in this run).');
        lines.push('');
        return lines.join('\n');
    }

    lines.push(
        'Built images compared against the currently published rolling tag for the same runtime version '
            + '(e.g. `apify/actor-node:22`). Sizes are the **uncompressed** on-disk size reported by '
            + '`docker image inspect`, so they will be larger than the compressed download size shown on Docker Hub.',
    );
    lines.push('');
    lines.push('| Image | Variant | Current | New | Δ |');
    lines.push('| --- | --- | ---: | ---: | --- |');

    const rows = reports
        .map((report) => ({
            image: report.baseImage || '(unknown)',
            variant: describeVariant(report.matrix),
            current: formatSize(report.currentBytes) ?? '_n/a_',
            next: formatSize(report.newBytes) ?? '_n/a_',
            delta: formatDelta(report.currentBytes, report.newBytes),
        }))
        .sort((a, b) => a.image.localeCompare(b.image) || a.variant.localeCompare(b.variant));

    for (const row of rows) {
        lines.push(`| \`${row.image}\` | ${row.variant || '—'} | ${row.current} | ${row.next} | ${row.delta} |`);
    }

    lines.push('');
    return lines.join('\n');
}

process.stdout.write(render(readReports(process.argv[2] ?? '')));
