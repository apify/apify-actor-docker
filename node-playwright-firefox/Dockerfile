ARG NODE_VERSION=20
# Use bookworm to be consistent across node versions.
FROM --platform=linux/amd64 node:${NODE_VERSION}-bookworm-slim

LABEL maintainer="support@apify.com" description="Base image for Apify Actors using Firefox"
ENV DEBIAN_FRONTEND=noninteractive

COPY ./register_intermediate_certs.sh ./register_intermediate_certs.sh

# Install Firefox dependencies + tools
RUN sh -c 'echo "deb http://ftp.us.debian.org/debian bookworm main non-free" >> /etc/apt/sources.list.d/fonts.list' \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    # Found this in other images, not sure whether it's needed, it does not come from Playwright deps
    procps \
    # The following packages are needed for the intermediate certificates to work in Firefox.
    ca-certificates \
    jq \
    wget \
    p11-kit \
    xauth \
    \
    # Register cerificates
    && chmod +x ./register_intermediate_certs.sh \
    && ./register_intermediate_certs.sh \
    \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    \
    # Globally disable the update-notifier.
    && npm config --global set update-notifier false \
    \
    # Install all required playwright dependencies for firefox
    && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm_config_ignore_scripts=1 npx playwright install-deps firefox \
    \
    # Cleanup time
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    && apt-get clean -y && apt-get autoremove -y \
    && rm -rf /root/.npm \
    # This is needed to remove an annoying error message when running headful.
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

ENV PLAYWRIGHT_BROWSERS_PATH=/home/myuser/pw-browsers

# Tell the crawlee cli that we already have browers installed, so it skips installing them
ENV CRAWLEE_SKIP_BROWSER_INSTALL=1

# Copy source code and xvfb script
COPY --chown=myuser:myuser package.json main.js firefox_test.js start_xvfb_and_run_cmd.sh new_xvfb_run_cmd.sh /home/myuser/

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
    \
    # symlink the firefox binary to the root folder in order to bypass the versioning and resulting browser launch crashes.
    && ln -s ${PLAYWRIGHT_BROWSERS_PATH}/firefox-*/firefox/firefox ${PLAYWRIGHT_BROWSERS_PATH}/ \
    \
    # Playwright allows donwloading only one browser through separate package with same export. So we rename it to just playwright.
    && mv ./node_modules/playwright-firefox ./node_modules/playwright && rm -rf ./node_modules/playwright-firefox \
    \
    # Overrides the dynamic library used by Firefox to determine trusted root certificates with p11-kit-trust.so, which loads the system certificates.
    && rm $PLAYWRIGHT_BROWSERS_PATH/firefox-*/firefox/libnssckbi.so \
    && ln -s /usr/lib/x86_64-linux-gnu/pkcs11/p11-kit-trust.so $(ls -d $PLAYWRIGHT_BROWSERS_PATH/firefox-*)/firefox/libnssckbi.so

ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/firefox

# Prevent installing of browsers by future `npm install`.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

# We should you the autodisplay detection as suggested here: https://github.com/microsoft/playwright/issues/2728#issuecomment-678083619
ENV DISPLAY=:99
ENV XVFB_WHD=1920x1080x24+32
# Uncomment this line if you want to run browser in headful mode by default.
# ENV APIFY_XVFB=1

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
# CMD ./start_xvfb_and_run_cmd.sh && npm start --silent
CMD ./new_xvfb_run_cmd.sh npm start --silent
