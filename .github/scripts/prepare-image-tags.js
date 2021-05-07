module.exports = () => {
    const { CURRENT_NODE, LATEST_NODE, RELEASE_TAG, IMAGE_NAME, FRAMEWORK_VERSION } = process.env
    const tags = [];

    if (CURRENT_NODE === LATEST_NODE) {
        tags.push(`${IMAGE_NAME}:${RELEASE_TAG}`);
    }

    if (RELEASE_TAG === "latest") {
        // latest version
        const latestTagName = FRAMEWORK_VERSION
            ? `${IMAGE_NAME}:${CURRENT_NODE}-${FRAMEWORK_VERSION}`
            : `${IMAGE_NAME}:${CURRENT_NODE}`

        tags.push(latestTagName);

    } else {
        // beta and other tags
        const otherTagName = FRAMEWORK_VERSION
            ? `${IMAGE_NAME}:${CURRENT_NODE}-${FRAMEWORK_VERSION}-${RELEASE_TAG}`
            : `${IMAGE_NAME}:${CURRENT_NODE}-${RELEASE_TAG}`

        tags.push(otherTagName);

        return { allTags: tags.join(","), firstTag: tags[0] };
    }
}