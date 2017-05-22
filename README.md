# apify-docker-images

Contains public Docker images for Apifier platform (https://www.apifier.com)

The sources for the images are present in subdirectories that are named as the corresponding
Docker image. For example, the `actor-default` directory corresponds to Docker image
[apify/actor-default](https://hub.docker.com/r/apify/actor-default/).

The images are using the following tags:

Tag         | Description
----------- | -------------
`latest`    | Well-tested production version of the image.
`dev`       | Development version of the image.


## Maintenance

In order to build and publish a new version of the Docker images,
first ensure you're logged in to your Docker Hub account by running:

```bash
docker login
````

Then build the Docker image:

```bash
docker build --no-cache --tag apify/actor-default:dev --tag apify/actor-default:latest ./actor-default/.
```

and push it to the appropriate Apify repository under the `dev` tag:

```bash
docker push apify/actor-default:dev
```

After the Docker image is well tested, it can be pushed with the `latest` tag:

```bash
docker push apify/actor-default:latest
```
