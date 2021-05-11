module.exports = () => {
    const { CURRENT_NODE, LATEST_NODE, RELEASE_TAG, IMAGE_NAME, FRAMEWORK_VERSION } = process.env
    const tags = [];

    if (CURRENT_NODE === LATEST_NODE) {
        tags.push(`${IMAGE_NAME}:${RELEASE_TAG}`);
    }

    if (RELEASE_TAG === "latest") {
        // latest version

        if (FRAMEWORK_VERSION) {
            tags.push(`${IMAGE_NAME}:${CURRENT_NODE}-${FRAMEWORK_VERSION}`)
        }

        tags.push(`${IMAGE_NAME}:${CURRENT_NODE}`);

    } else {
        // beta and other tags
        if (FRAMEWORK_VERSION) {
            tags.push(`${IMAGE_NAME}:${CURRENT_NODE}-${FRAMEWORK_VERSION}-${RELEASE_TAG}`);
        }

        tags.push(`${IMAGE_NAME}:${CURRENT_NODE}-${RELEASE_TAG}`);

    }

    return { allTags: tags.join(","), firstImageName: tags[0] };

}