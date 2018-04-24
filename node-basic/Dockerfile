# Image is based on Node.js 8.X
FROM node:8-alpine

LABEL maintainer="support@apify.com" Description="Image is used to run basic Apify acts"

# Remove yarn, it's not needed
RUN rm -rf /opt/yarn /usr/local/bin/yarn /usr/local/bin/yarnpkg

# Install git as it may be required to install some NPM dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache git openssh

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy source code
COPY package.json main.js /usr/src/app/

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
 && npm install --only=prod --no-optional \
 && echo "Installed NPM packages:" \
 && npm list \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory
ENV NODE_OPTIONS="--max_old_space_size=16000"

# Not using "npm start" to avoid unnecessary process, using CMD to enable simple overriding
CMD [ "node", "main.js" ]
