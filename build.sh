#!/usr/bin/env bash

if [ -z $1 ]; then
    echo "Builds a Docker image and publishes it with 'beta' tag"
    echo "Usage: ./build.sh <directory> [extra args for docker build]"
    exit
fi

# fail on any error
set -e

DIR="$1"
EXTRA_ARGS="$2"

docker build --tag apify/actor-${DIR}:beta --tag apify/actor-${DIR}:latest ${EXTRA_ARGS} ./${DIR}/

docker push apify/actor-${DIR}:beta

echo "Docker image was built and published as apify/actor-${DIR}:beta"
echo "Now test the image and then publish it with 'latest' tag by running:"
echo "  docker push apify/actor-${DIR}:latest"