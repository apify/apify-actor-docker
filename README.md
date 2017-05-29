# apify-actor-docker

Public Docker images for the Apifier Actor runtime (https://www.apifier.com)

The sources for the images are present in subdirectories that are named as the corresponding
Docker image. For example, the `default` directory corresponds to the
[apify/actor-default](https://hub.docker.com/r/apify/actor-default/) Docker image.

The images are using the following tags:

Tag         | Description
----------- | -------------
`latest`    | Well-tested production version of the image.
`beta`      | Development version of the image.


## Maintenance

In order to build and publish a new version of the Docker images,
first ensure you're logged in to your Docker Hub account by running:

```bash
docker login
````

Then build the Docker image:

```bash
docker build --no-cache --tag apify/actor-nodejs-basic:beta --tag apify/actor-nodejs-basic:latest ./nodejs-basic/
```

and push it to the appropriate Apify repository under the `beta` tag:

```bash
docker push apify/actor-nodejs-basic:beta
```

After the Docker image is well tested, it can be pushed with the `latest` tag:

```bash
docker push apify/actor-nodejs-basic:latest
```

Then you can remove the images from your computer:
```bash
docker rmi apify/actor-nodejs-basic:beta apify/actor-nodejs-basic:latest
```

**TODO: Setup Circle CI to do this automatically on commit, development branch corresponds to beta, master to latest**
