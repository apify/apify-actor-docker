module.exports = () => {
    const { CURRENT_NODE, LATEST_NODE, RELEASE_TAG, IMAGE_NAME, FRAMEWORK_VERSION, IS_LATEST_BROWSER_IMAGE } = process.env
    const tags = [];

    if (CURRENT_NODE === LATEST_NODE && IS_LATEST_BROWSER_IMAGE === 'true') {
        // apify/actor-node-x:latest
        tags.push(`${IMAGE_NAME}:${RELEASE_TAG}`);
    }

    // latest version
    if (RELEASE_TAG === 'latest') {
        if (FRAMEWORK_VERSION) {
            // apify/actor-node-x:20-4.2.0
            tags.push(`${IMAGE_NAME}:${CURRENT_NODE}-${FRAMEWORK_VERSION}`)
        }

        // apify/actor-node-x:20
        // we want this only when the browser image is also latest
        if (IS_LATEST_BROWSER_IMAGE === 'true') {
            tags.push(`${IMAGE_NAME}:${CURRENT_NODE}`);
        }
    } else {
        // beta and other tags
        if (FRAMEWORK_VERSION) {
            // apify/actor-node-x:20-4.2.0-beta
            tags.push(`${IMAGE_NAME}:${CURRENT_NODE}-${FRAMEWORK_VERSION}-${RELEASE_TAG}`);
        }

        // apify/actor-node-x:20-beta
        // we don't care if the browser image is latest or not, as its a beta image
        tags.push(`${IMAGE_NAME}:${CURRENT_NODE}-${RELEASE_TAG}`);
    }

    return { allTags: tags.join(','), firstImageName: tags[0] };
}
