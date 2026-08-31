// Renders one workflow's <details> section of the shared "image size" PR comment.
// The section is upserted into a single sticky comment by upsert-image-size-comment.js,
// so each image workflow only ever touches its own foldable block.
//
// Usage: node format-image-size-report.ts <reports-dir> <section-title> [head-sha]
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
    // Extra variant label not derivable from the matrix (e.g. "slim").
    variant?: string;
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

function render(reports: SizeReport[], title: string, headSha: string): string {
    const lines: string[] = [];
    const measuredAt = headSha ? ` <sub>(at ${headSha.slice(0, 7)})</sub>` : '';

    if (reports.length === 0) {
        lines.push('<details>');
        lines.push(`<summary><b>${title}</b> — no image size data collected${measuredAt}</summary>`);
        lines.push('');
        lines.push('No images were built in this run.');
        lines.push('</details>');
        lines.push('');
        return lines.join('\n');
    }

    lines.push('<details>');
    lines.push(`<summary><b>${title}</b> — ${reports.length} image${reports.length === 1 ? '' : 's'}${measuredAt}</summary>`);
    lines.push('');
    lines.push('| Image | Variant | Current | New | Δ |');
    lines.push('| --- | --- | ---: | ---: | --- |');

    const rows = reports
        .map((report) => ({
            image: report.baseImage || '(unknown)',
            variant: [describeVariant(report.matrix), report.variant].filter(Boolean).join(', '),
            current: formatSize(report.currentBytes) ?? '_n/a_',
            next: formatSize(report.newBytes) ?? '_n/a_',
            delta: formatDelta(report.currentBytes, report.newBytes),
        }))
        .sort((a, b) => a.image.localeCompare(b.image) || a.variant.localeCompare(b.variant));

    for (const row of rows) {
        lines.push(`| \`${row.image}\` | ${row.variant || '—'} | ${row.current} | ${row.next} | ${row.delta} |`);
    }

    lines.push('</details>');
    lines.push('');
    return lines.join('\n');
}

process.stdout.write(render(readReports(process.argv[2] ?? ''), process.argv[3] ?? 'Image sizes', process.argv[4] ?? ''));
