FROM node:10

RUN echo "WARNING: The apify/actor-node-puppeteer Docker image is deprecated! Use apify/actor-node-chrome instead."

# This image was inspired by https://github.com/zenato/docker-puppeteer/blob/master/Dockerfile

LABEL maintainer="support@apify.com" Description="Image used to run Apify acts with Chromium + Puppeteer"

# NOTE: as a quick workaround, we added poppler-utils package, remove it after we have custom Docerkfile support!
RUN apt-get update --fix-missing \
 && DEBIAN_FRONTEND=noninteractive apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
    libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
    fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget poppler-utils git \
 && rm -rf /var/lib/apt/lists/*

# Go to app directory
RUN mkdir -p /home/node/ \
 && chown -R node:node /home/node/

WORKDIR /home/node/

# Chrome should run as a non-root user!
USER node:node

# Copy source code
COPY --chown=node:node package.json main.js start_actor.sh /home/node/

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

# Enable Node.js process to use a lot of memory
ENV NODE_OPTIONS="--max_old_space_size=16000"

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ./start_actor.sh
