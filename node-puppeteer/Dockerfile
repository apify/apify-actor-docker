FROM node:8

# This image was inspired by https://github.com/zenato/docker-puppeteer/blob/master/Dockerfile

LABEL maintainer="support@apifier.com" Description="Image used to run Apifier acts with Chromium + Puppeteer"

# NOTE: as a quick workaround, we added poppler-utils package, remove it after we have custom Docerkfile support!
RUN apt-get update --fix-missing \
 && DEBIAN_FRONTEND=noninteractive apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
    libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
    fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget poppler-utils \
 && rm -r /var/lib/apt/lists/*

# Run Chrome under non-root user
USER node

# Change to app directory
RUN mkdir -p /home/node/
WORKDIR /home/node/

# Copy source code
COPY package.json main.js /home/node/

# Install default dependencies, print versions of everything
RUN yarn install --production \
 && echo "Installed NPM packages:" \
 && yarn list \
 && echo "Node.js version:" \
 && node --version \
 && echo "Yarn version:" \
 && yarn --version

# Not using "npm start" to avoid unnecessary process, using CMD to enable simple overriding
CMD [ "node", "main.js" ]
