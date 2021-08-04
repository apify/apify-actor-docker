ARG NODE_VERSION=16
FROM node:${NODE_VERSION}-alpine

LABEL maintainer="support@apify.com" Description="Base image for simple Apify actors"

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy source code
COPY package.json main.js /usr/src/app/

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
 && npm install --only=prod --no-optional --no-package-lock --prefer-online \
 && echo "Installed NPM packages:" \
 && (npm list || true) \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory (actor has limit of 32GB)
# Increases default size of headers. The original limit was 80kb, but from node 10+ they decided to lower it to 8kb.
# However they did not think about all the sites there with large headers,
# so we put back the old limit of 80kb, which seems to work just fine.
ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD npm start --silent
