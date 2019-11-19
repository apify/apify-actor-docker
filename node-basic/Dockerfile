# Image is based on Node.js 10.X
FROM node:10-alpine

LABEL maintainer="support@apify.com" Description="Base image for simple Apify actors"

# Remove yarn, it's not needed
RUN rm -rf /opt/yarn /usr/local/bin/yarn /usr/local/bin/yarnpkg

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy source code
COPY package.json main.js /usr/src/app/

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
 && npm install --only=prod --no-optional --no-package-lock \
 && echo "Installed NPM packages:" \
 && npm list || true \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory (actor has limit of 32GB)
ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD npm start
