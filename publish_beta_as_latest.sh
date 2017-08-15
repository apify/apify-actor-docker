#!/usr/bin/env bash

if [ -z $1 ]; then
    echo "Takes image published in Docker Hub with 'beta' tag and publishes it as 'latest'."
    echo "Usage: ./publish_beta_as_latest.sh <directory>"
    exit
fi

# fail on any error
set -e

DIR="$1"

docker image rm apify/actor-${DIR}:beta apify/actor-${DIR}:latest
docker pull apify/actor-${DIR}:beta
docker image tag apify/actor-${DIR}:beta apify/actor-${DIR}:latest
docker push apify/actor-${DIR}:latest

echo "Docker image was published as apify/actor-${DIR}:latest"