FROM node:12.18-buster-slim

LABEL maintainer="support@apify.com" Description="Base image for Apify actors using Firefox"
# Install Firefox dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-color-emoji \
    libdbus-glib-1-2 \
    libxt6 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    procps \
    xvfb

# Install ffmpeg to bring in audio and video codecs necessary for playing videos in Firefox.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg

RUN groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Copy source code
COPY package.json main.js firefox_test.js /home/myuser/
# Copy source code
COPY --chown=myuser:myuser start_xvfb_and_run_cmd.sh /home/myuser/

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

# Playwright allows donwloading only one browser through separate package with same export. So we rename it to just playwright.
RUN mv ./node_modules/playwright-firefox ./node_modules/playwright && rm -rf ./node_modules/playwright-firefox

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
