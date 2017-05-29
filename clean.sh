

echo "Removing old Docker images"

docker rmi \
  apify/actor-nodejs-basic:beta \
  apify/actor-nodejs-basic:latest \
  apify/actor-nodejs-chrome:latest \
  apify/actor-nodejs-chrome:latest
