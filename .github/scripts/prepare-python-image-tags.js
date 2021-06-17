module.exports = () => {
    const { CURRENT_PYTHON, LATEST_PYTHON, RELEASE_TAG, IMAGE_NAME } = process.env
    const tags = [];

    if (CURRENT_PYTHON === LATEST_PYTHON) {
        tags.push(`${IMAGE_NAME}:${RELEASE_TAG}`);
    }

    if (RELEASE_TAG === "latest") {
        tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}`);
    } else {
        tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}-${RELEASE_TAG}`);
    }

    return { allTags: tags.join(","), firstImageName: tags[0] };
}
