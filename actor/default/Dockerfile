# Image is based on Node.js 7.X
FROM node:7-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install default dependencies
COPY package.json /usr/src/app/
RUN yarn install --production

# Not using "npm start" to avoid unnecessary process
ENTRYPOINT [ "node", "main.js" ]
