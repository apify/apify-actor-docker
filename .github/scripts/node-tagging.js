
module.exports = () => {
    const { CURRENT_NODE, LATEST_NODE, RELEASE_TAG, IMAGE_NAME } = process.env
    const tags = [];

    if (CURRENT_NODE === LATEST_NODE) {
        tags.push(`${IMAGE_NAME}:${RELEASE_TAG}`);
    }

    if (RELEASE_TAG === "latest") {
        // latest version
        tags.push(`${IMAGE_NAME}:${CURRENT_NODE}`);

        return tags.join(",");
    }

    // beta and other tags
    tags.push(`${IMAGE_NAME}:${CURRENT_NODE}-${RELEASE_TAG}`);

    return tags.join(",");
}
