# Docker images release process

This short readme covers the apify docker images release process.

## Node images
The latest version of `apify/actor-node` is released with the `latest` tag (with the latest node) and corresponding node version tag, such as `14`. This means that the images tagged with the newest node version and the `latest` tag are the same. Suppose the release is triggered with any other tag such as `beta`. The resulting images are tagged with a tag consisting of node version and the release tag. for example, `16-beta`, `14-beta` etc.

## Node images with browser automation libraries
Images with browser automation libraries such as `apify/actor-node-puppeteer-*` and `apify/actor-node-playwright-*` follow the same principle as node image but add the browser automation version tag. The latest version is released with the tag `latest`, based on the newest node.  The other tags for node versions consist of node version and browser automation library. For example, 14-1.7.0 or 15-1.7.0. Other than the latest releases, such as beta, the images are tagged with node version, browser automation library version, and the release tag, in this case, beta. The tags look like this 14-1.7.0-beta or 15-1.7.0-beta etc.