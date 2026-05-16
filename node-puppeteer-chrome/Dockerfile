ARG NODE_VERSION=22
# Use trixie to be consistent across node versions.
FROM --platform=linux/amd64 node:${NODE_VERSION}-trixie-slim

# Must match the puppeteer version in package.json so the installed Chrome revisions line up with what runtime puppeteer expects.
ARG PUPPETEER_VERSION

LABEL maintainer="support@apify.com" description="Base image for Apify Actors using headless Chrome"
ENV DEBIAN_FRONTEND=noninteractive

# Set the shell to use /bin/bash with specific options (see Hadolint DL4006)
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Set up XVFB
ENV XVFB_WHD=1920x1080x24+32

# Tells puppeteer where to install and where to find browsers
ENV PUPPETEER_CACHE_DIR=/puppeteer-browsers

# Tell the crawlee cli that we already have browsers installed, so it skips installing them
ENV CRAWLEE_SKIP_BROWSER_INSTALL=1

# Sets path to Chrome executable, this is used by Apify.launchPuppeteer()
ENV APIFY_CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome

# Skip browser download during `npm install`. CHROMIUM_DOWNLOAD is the old name (puppeteer <22), kept for back-compat.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# This image was inspired by https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker

# Install latest Chrome dev packages and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this also installs the necessary libs to make the bundled version of Chromium that Puppeteer installs work.
RUN apt update \
    && apt install -y wget gnupg unzip ca-certificates --no-install-recommends \
    # Add Google Linux signing key
    && wget -qO- https://dl-ssl.google.com/linux/linux_signing_key.pub \
        | gpg --dearmor \
        | tee /usr/share/keyrings/google-linux-signing.gpg > /dev/null \
    # Add Google Chrome APT repo
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list' \
    && sh -c 'echo "deb http://ftp.us.debian.org/debian trixie main non-free" >> /etc/apt/sources.list.d/fonts.list' \
    && apt update \
    && apt install -y \
    fonts-freefont-ttf \
    fonts-ipafont-gothic \
    fonts-kacst-one \
    fonts-liberation \
    fonts-thai-tlwg \
    fonts-wqy-zenhei \
    git \
    libxss1 \
    lsb-release \
    procps \
    xdg-utils \
    xvfb \
    xauth \
    --no-install-recommends \
    # Disable chrome auto updates, based on https://support.google.com/chrome/a/answer/9052345
    && mkdir -p /etc/default && echo 'repo_add_once=false' > /etc/default/google-chrome \
    \
    # Install chrome
    && wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -nv \
    && apt install --fix-missing -yq ./google-chrome-stable_current_amd64.deb && rm ./google-chrome-stable_current_amd64.deb \
    \
    # Pre-install browsers into PUPPETEER_CACHE_DIR using the latest @puppeteer/browsers CLI —
    # puppeteer 24.x bundles 2.13.0, which silently fails to extract Chrome on node 26.
    # The pinned Chrome revisions come from puppeteer-core's PUPPETEER_REVISIONS export.
    && cd /tmp \
    && npm init -y --silent > /dev/null \
    && npm install --no-save --no-package-lock --omit=optional puppeteer-core@${PUPPETEER_VERSION} \
    && read -r CHROME_VERSION CHS_VERSION < <(node --input-type=module -e "import {PUPPETEER_REVISIONS as r} from 'puppeteer-core'; console.log(r.chrome, r['chrome-headless-shell'])") \
    && rm -rf /tmp/node_modules /tmp/package*.json \
    && cd / \
    && npx --yes @puppeteer/browsers install chrome@${CHROME_VERSION} --path ${PUPPETEER_CACHE_DIR} \
    && npx --yes @puppeteer/browsers install chrome-headless-shell@${CHS_VERSION} --path ${PUPPETEER_CACHE_DIR} \
    && chmod -R a+rX ${PUPPETEER_CACHE_DIR} \
    \
    # unzip is only needed during browser extraction above; drop it now.
    && apt purge --auto-remove -y unzip \
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
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    && apt clean -y && apt autoremove -y \
    && rm -rf /root/.npm \
    # This is needed to remove an annoying error message when running headful.
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Copy source code and xvfb script
COPY --chown=myuser:myuser package.json main.js check-puppeteer-version.mjs puppeteer_*.js start_xvfb_and_run_cmd.sh new_xvfb_run_cmd.sh xvfb-entrypoint.sh /home/myuser/

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
    && bash -c "$APIFY_CHROME_EXECUTABLE_PATH --version"

# The entrypoint script will be the one handling the CMD passed in, and will always wrap it into xvfb-run
ENTRYPOINT ["/home/myuser/xvfb-entrypoint.sh"]

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ["npm", "start", "--silent"]
