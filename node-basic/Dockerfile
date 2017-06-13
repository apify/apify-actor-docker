# Image is based on Node.js 7.X
FROM node:7-alpine

LABEL maintainer="support@apifier.com" Description="Image is used to run basic Apifier acts"

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy source code
COPY package.json main.js /usr/src/app/

# Install default dependencies, print versions of everything
RUN yarn install --production \
 && echo "Installed versions of dependencies:" \
 && node --version \
 && yarn --version \
 && yarn list

# Not using "npm start" to avoid unnecessary process, using CMD to enable simple overriding
CMD [ "node", "main.js" ]
