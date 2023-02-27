module.exports = () => {
    const { CURRENT_PYTHON, LATEST_PYTHON, FRAMEWORK_VERSION, RELEASE_TAG, IMAGE_NAME } = process.env
    const tags = [];

    if (CURRENT_PYTHON === LATEST_PYTHON) {
        tags.push(`${IMAGE_NAME}:${RELEASE_TAG}`);
    }

    if (RELEASE_TAG === "latest") {
        if (FRAMEWORK_VERSION) {
            tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}-${FRAMEWORK_VERSION}`)
        }
        tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}`);
    } else {
        if (FRAMEWORK_VERSION) {
            tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}-${FRAMEWORK_VERSION}-${RELEASE_TAG}`);
        }
        tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}-${RELEASE_TAG}`);
    }

    return { allTags: tags.join(","), firstImageName: tags[0] };
}
