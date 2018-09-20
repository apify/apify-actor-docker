# Image is based on Node.js 8.X
FROM node:8-alpine

LABEL maintainer="support@apify.com" Description="Image is used to run basic Apify acts"

# Remove yarn, it's not needed
RUN rm -rf /opt/yarn /usr/local/bin/yarn /usr/local/bin/yarnpkg

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

# NOTE: This needs to be compatible with CLI.
# NOTE: Fallback to "node main.js" is there for backwards compatibility. We should remove in the future.
ENTRYPOINT npm run start \
    || (printf "\nWARNING: The npm start script not found in package.json. Using \"node main.js\" instead. \
Please update your package.json file. For more information see \
https://github.com/apifytech/apify-cli/blob/develop/MIGRATIONS.md\n\n"\
    && node main.js) \
