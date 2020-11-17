# Apify base Docker images

[![Release Status](https://travis-ci.com/apify/apify-actor-docker.svg?branch=master)](https://github.com/apify/apify-actor-docker/workflows/Release%20Images/badge.svg)

Public Docker images for Apify Actor serverless platform (https://docs.apify.com/actor)

The sources for the images are present in subdirectories that are named as the corresponding
Docker image. For example, the `node-basic` directory corresponds to the
[apify/actor-node-basic](https://hub.docker.com/r/apify/actor-node-basic/) Docker image.

The images are using the following tags:

Tag         | Description
----------- | -------------
`latest`    | Well-tested production version of the image.
`beta`      | Development version of the image.

## Maintenance

In order to build and publish a new version of the Docker images,
open the Actions tab and find the Release Images workflow.
You can then run the workflow by providing the following inputs:

- A tag, which will be used to tag the image in DockerHub. Typically beta or latest.
- A version of the `apify` package that should be pre-installed in the images.
- A version of the `puppeteer` package that should be pre-installed in the images that use Puppeteer.
