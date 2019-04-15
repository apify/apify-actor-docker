FROM node:10-slim

LABEL maintainer="support@apify.com" Description="Base image for Apify actors using headless Chrome"

# This image is based on https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker

# See https://crbug.com/795759
#RUN apt-get update \
# && apt-get install -yq libgconf-2-4

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer installs, work.
# Also installs Chrome (latest) and ChromeDriver for Selenium (see https://sites.google.com/a/chromium.org/chromedriver/)
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y wget --no-install-recommends \
 && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
 && DEBIAN_FRONTEND=noninteractive apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y procps unzip git google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
    --no-install-recommends \
 && curl -sS http://chromedriver.storage.googleapis.com/2.46/chromedriver_linux64.zip > /tmp.zip \
 && unzip tmp.zip \
 && rm tmp.zip \
 && mv /chromedriver /bin \
 && rm -rf /var/lib/apt/lists/* \
 && rm -rf /src/*.deb \
 && DEBIAN_FRONTEND=noninteractive apt-get purge --auto-remove -y curl unzip \
 && rm -rf /opt/yarn /usr/local/bin/yarn /usr/local/bin/yarnpkg

# Add user so we don't need --no-sandbox.
RUN groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Copy source code
COPY --chown=myuser:myuser package.json main.js start_actor.sh /home/myuser/

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome'})
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Sets path to Chrome executable, this is used by Apify.launchPuppeteer()
ENV APIFY_CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory
ENV NODE_OPTIONS="--max_old_space_size=16000"

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
 && npm install --only=prod --no-optional --no-package-lock \
 && echo "Installed NPM packages:" \
 && npm list || true \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version \
 && echo "Google Chrome version:" \
 && bash -c "$APIFY_CHROME_EXECUTABLE_PATH --version" \
 && echo "ChromeDriver version:" \
 && chromedriver --version

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ./start_actor.sh
