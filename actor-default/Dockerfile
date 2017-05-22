# Image is based on Node.js 7.X
FROM node:7-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json main.js /usr/src/app/

# Install default dependencies
RUN yarn install --production

# Bundle app source
COPY . /usr/src/app

# Not using "npm start" to avoid unnecessary process
ENTRYPOINT [ "node", "main.js" ]
