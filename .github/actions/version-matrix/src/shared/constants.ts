export const supportedPythonVersions = ['3.9', '3.10', '3.11', '3.12', '3.13'];

export const supportedNodeVersions = ['18', '20', '22'];

export const shouldUseLastFive = process.env.SHOULD_USE_LAST_FIVE === 'true';

export const emptyMatrix = JSON.stringify({ include: [] });
