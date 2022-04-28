ARG NODE_VERSION=16
# Use buster to be consistent across node versions.
FROM node:${NODE_VERSION}-buster-slim

LABEL maintainer="support@apify.com" Description="Base image for Apify actors using Firefox"
# Install Firefox dependencies + tools
RUN sh -c 'echo "deb http://ftp.us.debian.org/debian buster main non-free" >> /etc/apt/sources.list.d/fonts.list' \
    && DEBIAN_FRONTEND=noninteractive apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    # Found this in other images, not sure whether it's needed, it does not come from Playwright deps
    procps

RUN groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser

# Globally disable the update-notifier.
RUN npm config --global set update-notifier false

# Install all required playwright dependencies for firefox
# Keep updated from https://github.com/microsoft/playwright/blob/a06b06b82bb6b2d550f12e8b18af298f23a08828/packages/playwright-core/src/server/registry/nativeDeps.ts#L229
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    xvfb \
    fonts-noto-color-emoji \
    ttf-unifont \
    libfontconfig \
    libfreetype6 \
    xfonts-cyrillic \
    xfonts-scalable \
    fonts-liberation \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-tlwg-loma-otf \
    ttf-ubuntu-font-family \
    ffmpeg \
    libatk1.0-0 \
    libcairo-gobject2 \
    libcairo2 \
    libdbus-1-3 \
    libdbus-glib-1-2 \
    libfontconfig1 \
    libfreetype6 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb-shm0 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxt6 \
    libxtst6

# Cleanup time
RUN rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    # This is needed to remove an annoying error message when running headful.
    && mkdir -p /tmp/.X11-unix \
    && chmod 1777 /tmp/.X11-unix

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

ENV PLAYWRIGHT_BROWSERS_PATH=/home/myuser/pw-browsers
RUN mkdir ${PLAYWRIGHT_BROWSERS_PATH}

# Copy source code and xvfb script
COPY --chown=myuser:myuser package.json main.js firefox_test.js start_xvfb_and_run_cmd.sh /home/myuser/

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
    && npm --version

# symlink the firefox binary to the root folder in order to bypass the versioning and resulting browser launch crashes.
RUN ln -s ${PLAYWRIGHT_BROWSERS_PATH}/firefox-*/firefox/firefox ${PLAYWRIGHT_BROWSERS_PATH}/

ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/firefox

# Playwright allows donwloading only one browser through separate package with same export. So we rename it to just playwright.
RUN mv ./node_modules/playwright-firefox ./node_modules/playwright && rm -rf ./node_modules/playwright-firefox

# Prevent installing of browsers by future `npm install`.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

# We should you the autodisplay detection as suggested here: https://github.com/microsoft/playwright/issues/2728#issuecomment-678083619
ENV DISPLAY=:99
ENV XVFB_WHD=1280x720x16
# Uncomment this line if you want to run browser in headful mode by default.
# ENV APIFY_XVFB=1

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ./start_xvfb_and_run_cmd.sh && npm start --silent
