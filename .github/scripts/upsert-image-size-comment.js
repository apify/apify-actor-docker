// Upserts one workflow's section into the single shared "image size" PR comment.
//
// Every image workflow renders its own <details> block (format-image-size-report.ts) and
// calls this from actions/github-script. The comment is identified by MARKER; each section
// is delimited by per-workflow markers so a workflow only ever rewrites its own block.
// Concurrent writers are serialized by the size-report jobs sharing a repo-wide
// `concurrency` group, so the read-modify-write below cannot lose sections.

const MARKER = '<!-- image-size-report -->';
const PREAMBLE = `${MARKER}
### 📦 Image size report

Built images compared against the currently published rolling tag for the same runtime \
version (e.g. \`apify/actor-node:22\`; \`-slim\` variants against the \`-slim\` tag). Sizes \
are the **uncompressed** on-disk size reported by \`docker image inspect\`, so they will be \
larger than the compressed download size shown on Docker Hub. Only workflows triggered by \
this PR's changes report a section.
`;

module.exports = async ({ github, context }, sectionKey, sectionBody) => {
    if (!/^[a-z][a-z0-9-]*$/.test(sectionKey)) throw new Error(`Invalid section key: ${sectionKey}`);

    const { owner, repo } = context.repo;
    const issue_number = context.issue.number;
    const begin = `<!-- section:${sectionKey} -->`;
    const end = `<!-- /section:${sectionKey} -->`;
    const section = `${begin}\n${sectionBody.trim()}\n${end}`;

    const comments = await github.paginate(github.rest.issues.listComments, {
        owner,
        repo,
        issue_number,
        per_page: 100,
    });
    const existing = comments.find((comment) => comment.body?.includes(MARKER));

    if (!existing) {
        await github.rest.issues.createComment({ owner, repo, issue_number, body: `${PREAMBLE}\n${section}\n` });
        return;
    }

    const sectionPattern = new RegExp(`${begin}[\\s\\S]*?${end}`);
    const body = sectionPattern.test(existing.body)
        ? existing.body.replace(sectionPattern, section)
        : `${existing.body.trimEnd()}\n\n${section}\n`;

    await github.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body });
};
