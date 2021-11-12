
ARG NODE_VERSION=16
# Use buster to be consistent across node versions.
FROM node:${NODE_VERSION}-buster-slim

LABEL maintainer="support@apify.com" Description="Base image for Apify actors using headless Chrome"

# This image was inspired by https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker

# Disable chrome auto updates, based on https://support.google.com/chrome/a/answer/9052345
RUN mkdir -p /etc/default \
    && echo 'repo_add_once=false' > /etc/default/google-chrome \
    && mkdir -p /etc/opt/chrome/policies \
    && echo '{ "ComponentUpdatesEnabled": "false" }' > /etc/opt/chrome/policies/managed

# Install latest Chrome dev packages and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this also installs the necessary libs to make the bundled version of Chromium that Puppeteer installs work.
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y wget gnupg unzip ca-certificates --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | DEBIAN_FRONTEND=noninteractive apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && DEBIAN_FRONTEND=noninteractive apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get purge --auto-remove -y unzip \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    fonts-freefont-ttf \
    fonts-ipafont-gothic \
    fonts-kacst \
    fonts-liberation \
    fonts-thai-tlwg \
    fonts-wqy-zenhei \
    git \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxss1 \
    libxtst6 \
    libxtst6 \
    lsb-release \
    procps \
    xdg-utils \
    xvfb \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    && mkdir -p /tmp/.X11-unix \
    && chmod 1777 /tmp/.X11-unix

# Globally disable the update-notifier.
RUN npm config --global set update-notifier false

# Prepare to install the latest Chrome compatible
RUN mkdir -p /tmp/chrome-install
WORKDIR /tmp/chrome-install
COPY package.json puppeteer_*.js /tmp/chrome-install/

# Install default dependencies
RUN npm --quiet set progress=false \
    && npm install --only=prod --no-optional --no-package-lock --prefer-online

# Download the latest Chrome
RUN node ./puppeteer_download.js
# Install it
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/chrome.deb \
    && rm /tmp/chrome.deb \
    && rm -rf /tmp/chrome-install

# Add user so we don't need --no-sandbox.
RUN groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser

RUN mkdir -p /etc/opt/chrome/policies/managed && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Copy source code and xvfb script
COPY --chown=myuser:myuser package.json main.js puppeteer_*.js start_xvfb_and_run_cmd.sh /home/myuser/

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome'})
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Sets path to Chrome executable, this is used by Apify.launchPuppeteer()
ENV APIFY_CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory (actor has limit of 32GB)
# Increases default size of headers. The original limit was 80kb, but from node 10+ they decided to lower it to 8kb.
# However they did not think about all the sites there with large headers,
# so we put back the old limit of 80kb, which seems to work just fine.
ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
    && npm install --only=prod --no-optional --no-package-lock --prefer-online \
    && echo "Installed NPM packages:" \
    && (npm list --only=prod --no-optional || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && echo "Google Chrome version:" \
    && bash -c "$APIFY_CHROME_EXECUTABLE_PATH --version"

# Set up xvfb
ENV DISPLAY=:99
ENV XVFB_WHD=1280x720x16

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ./start_xvfb_and_run_cmd.sh && npm start --silent
