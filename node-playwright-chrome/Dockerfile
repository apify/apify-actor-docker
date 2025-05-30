ARG NODE_VERSION=20
# Use bookworm to be consistent across node versions.
FROM --platform=linux/amd64 node:${NODE_VERSION}-bookworm-slim

LABEL maintainer="support@apify.com" description="Base image for Apify Actors using Chrome"
ENV DEBIAN_FRONTEND=noninteractive

# This image was inspired by https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker

# Install latest Chrome dev packages and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this also installs the necessary libs to make the bundled version of Chromium that Puppeteer installs, work.
RUN \
    # Disable chrome auto updates, based on https://support.google.com/chrome/a/answer/9052345
    mkdir -p /etc/default && echo 'repo_add_once=false' > /etc/default/google-chrome \
    && apt update \
    && apt install -y wget gnupg unzip ca-certificates xvfb xauth --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && sh -c 'echo "deb http://ftp.us.debian.org/debian bookworm main non-free" >> /etc/apt/sources.list.d/fonts.list' \
    && apt update \
    && apt purge --auto-remove -y wget unzip \
    && apt install -y \
    git \
    google-chrome-stable \
    # Found this in other images, not sure whether it's needed, it does not come from Playwright deps
    procps \
    # Extras
    fonts-freefont-ttf \
    fonts-kacst \
    fonts-thai-tlwg \
    fonts-wqy-zenhei \
    --no-install-recommends \
    \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    \
    && mkdir -p /etc/opt/chrome/policies/managed \
    && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json \
    && echo '{ "ComponentUpdatesEnabled": false }' > /etc/opt/chrome/policies/managed/component_update.json \
    \
    # Globally disable the update-notifier.
    && npm config --global set update-notifier false \
    # Install all required playwright dependencies for chrome/chromium
    && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm_config_ignore_scripts=1 npx playwright install-deps chrome \
    # Cleanup time
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    && apt clean -y && apt autoremove -y \
    && rm -rf /root/.npm \
    # This is needed to remove an annoying error message when running headful.
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

ENV PLAYWRIGHT_BROWSERS_PATH=/home/myuser/pw-browsers

# Copy source code and xvfb script
COPY --chown=myuser:myuser package.json main.js check-playwright-version.mjs chrome_test.js start_xvfb_and_run_cmd.sh new_xvfb_run_cmd.sh xvfb-entrypoint.sh /home/myuser/

# Sets path to Chrome executable, this is used by Apify.launchPuppeteer()
ENV APIFY_CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome

# Tell the crawlee cli that we already have browers installed, so it skips installing them
ENV CRAWLEE_SKIP_BROWSER_INSTALL=1

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory (Actor has limit of 32GB)
# Increases default size of headers. The original limit was 80kb, but from node 10+ they decided to lower it to 8kb.
# However they did not think about all the sites there with large headers,
# so we put back the old limit of 80kb, which seems to work just fine.
ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional --no-package-lock --prefer-online \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --omit=optional || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && echo "Google Chrome version:" \
    && bash -c "$APIFY_CHROME_EXECUTABLE_PATH --version" \
    # symlink the chromium binary to the root folder in order to bypass the versioning and resulting browser launch crashes.
    && ln -s ${PLAYWRIGHT_BROWSERS_PATH}/chromium-*/chrome-linux/chrome ${PLAYWRIGHT_BROWSERS_PATH}/ \
    # Playwright allows donwloading only one browser through separate package with same export. So we rename it to just playwright.
    && mv ./node_modules/playwright-chromium ./node_modules/playwright && rm -rf ./node_modules/playwright-chromium

ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/chrome

# Prevent installing of browsers by future `npm install`.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Set up xvfb
ENV XVFB_WHD=1920x1080x24+32

# The entrypoint script will be the one handling the CMD passed in, and will always wrap it into xvfb-run
ENTRYPOINT ["/home/myuser/xvfb-entrypoint.sh"]

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ["npm", "start", "--silent"]
