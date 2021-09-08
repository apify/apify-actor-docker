FROM ubuntu:focal
ARG NODE_VERSION=16

LABEL maintainer="support@apify.com" Description="Base image for Apify actors using Webkit"
ENV DEBIAN_FRONTEND=noninteractive

# Install WebKit dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libevdev \
    libwoff1 \
    libopus0 \
    libwebp6 \
    libwebpdemux2 \
    libenchant1c2a \
    libgudev-1.0-0 \
    libsecret-1-0 \
    libhyphen0 \
    libgdk-pixbuf2.0-0 \
    libegl1 \
    libnotify4 \
    libxslt1.1 \
    libevent-2.1-7 \
    libgles2 \
    libxcomposite1 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libepoxy0 \
    libgtk-3-0 \
    libharfbuzz-icu0 \
    procps \
    xvfb \
    git \
    && apt-get clean -y && apt-get autoremove -y \
    && mkdir -p /tmp/.X11-unix \
    && chmod 1777 /tmp/.X11-unix

# Install gstreamer and plugins to support video playback in WebKit.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgstreamer-gl1.0-0 \
    libgstreamer-plugins-bad1.0-0 \
    gstreamer1.0-plugins-good \
    gstreamer1.0-libav \
    && apt-get clean -y && apt-get autoremove -y

# Install node
RUN apt-get update && apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - && \
    apt-get install -y nodejs \
    && apt-get clean -y && apt-get autoremove -y

RUN groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

ENV PLAYWRIGHT_BROWSERS_PATH=/home/myuser/pw-browsers
RUN mkdir ${PLAYWRIGHT_BROWSERS_PATH}

# Copy source code and xvfb script
COPY --chown=myuser:myuser package.json main.js webkit_test.js start_xvfb_and_run_cmd.sh /home/myuser/

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
    && (npm list || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# symlink the webkit binary to the root folder in order to bypass the versioning and resulting browser launch crashes.
RUN ln -s ${PLAYWRIGHT_BROWSERS_PATH}/webkit-*/minibrowser-gtk/MiniBrowser ${PLAYWRIGHT_BROWSERS_PATH}/

ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/MiniBrowser

# Playwright allows donwloading only one browser through separate package with same export. So we rename it to just playwright.
RUN mv ./node_modules/playwright-webkit ./node_modules/playwright && rm -rf ./node_modules/playwright-webkit

# Prevent installing of browsers by future `npm install`.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

# We should you the autodisplay detection as suggested here: https://github.com/microsoft/playwright/issues/2728#issuecomment-678083619
ENV DISPLAY=:99
ENV XVFB_WHD=1280x720x16
# Uncoment this line if you want to run browser in headfull mode by defautl.
# ENV APIFY_XVFB=1

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ./start_xvfb_and_run_cmd.sh && npm start --silent
