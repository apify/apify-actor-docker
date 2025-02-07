FROM --platform=linux/amd64 ubuntu:noble
ARG NODE_VERSION=20

LABEL maintainer="support@apify.com" description="Base image for Apify Actors using Webkit"
ENV DEBIAN_FRONTEND=noninteractive

# Install WebKit dependencies
RUN apt update \
    && apt install -y --no-install-recommends \
    git \
    procps \
    xvfb \
    xauth \
    # Install node
    && apt update && apt install -y curl \
    && curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt install -y nodejs \
    # Feature-parity with Node.js base images.
    # From: https://github.com/microsoft/playwright/blob/master/utils/docker/Dockerfile.focal
    && apt update && apt install -y --no-install-recommends git ssh \
    && npm install -g yarn \
    \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    # Globally disable the update-notifier.
    && npm config --global set update-notifier false \
    \
    # Install all required playwright dependencies for webkit
    && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm_config_ignore_scripts=1 npx playwright install-deps webkit \
    && apt install -y libgtk-3-0 \
    \
    # Cleanup time
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    && apt clean -y && apt autoremove -y \
    && rm -rf /root/.npm \
    \
    # This is needed to remove an annoying error message when running headful.
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

ENV PLAYWRIGHT_BROWSERS_PATH=/home/myuser/pw-browsers

# Tell the crawlee cli that we already have browers installed, so it skips installing them
ENV CRAWLEE_SKIP_BROWSER_INSTALL=1

# Copy source code and xvfb script
COPY --chown=myuser:myuser package.json main.js webkit_test.js start_xvfb_and_run_cmd.sh new_xvfb_run_cmd.sh /home/myuser/

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
    # symlink the webkit binary to the root folder in order to bypass the versioning and resulting browser launch crashes.
    && ln -s ${PLAYWRIGHT_BROWSERS_PATH}/webkit-*/minibrowser-gtk/MiniBrowser ${PLAYWRIGHT_BROWSERS_PATH}/ \
    # Playwright allows donwloading only one browser through separate package with same export. So we rename it to just playwright.
    && mv ./node_modules/playwright-webkit ./node_modules/playwright && rm -rf ./node_modules/playwright-webkit

ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/MiniBrowser

# Prevent installing of browsers by future `npm install`.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

# We should you the autodisplay detection as suggested here: https://github.com/microsoft/playwright/issues/2728#issuecomment-678083619
ENV DISPLAY=:99
ENV XVFB_WHD=1920x1080x24+32
# Uncoment this line if you want to run browser in headfull mode by defautl.
# ENV APIFY_XVFB=1

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
# CMD ./start_xvfb_and_run_cmd.sh && npm start --silent
CMD ./new_xvfb_run_cmd.sh npm start --silent
