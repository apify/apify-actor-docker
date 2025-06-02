module.exports = () => {
	const { CURRENT_PYTHON, LATEST_PYTHON, RELEASE_TAG, IMAGE_NAME, FRAMEWORK_VERSION, IS_LATEST_BROWSER_IMAGE } =
		process.env;
	const tags = [];

	if (CURRENT_PYTHON === LATEST_PYTHON && IS_LATEST_BROWSER_IMAGE === 'true') {
		// apify/actor-python-x:latest
		tags.push(`${IMAGE_NAME}:${RELEASE_TAG}`);
	}

	// latest version
	if (RELEASE_TAG === 'latest') {
		if (FRAMEWORK_VERSION) {
			// apify/actor-python-x:3.13-4.2.0
			tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}-${FRAMEWORK_VERSION}`);
		}

		// apify/actor-python-x:3.13
		// we want this only when browser image is also latest
		if (IS_LATEST_BROWSER_IMAGE === 'true') {
			tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}`);
		}
	} else {
		// beta and other tags
		if (FRAMEWORK_VERSION) {
			// apify/actor-python-x:3.13-4.2.0-beta
			tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}-${FRAMEWORK_VERSION}-${RELEASE_TAG}`);
		}

		// apify/actor-python-x:3.13-beta
		// we don't care if the browser image is latest or not, as its a beta image
		tags.push(`${IMAGE_NAME}:${CURRENT_PYTHON}-${RELEASE_TAG}`);
	}

	return { allTags: tags.join(','), firstImageName: tags[0] };
};
