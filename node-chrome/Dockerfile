FROM debian:jessie

# This image was inspired by https://github.com/ebidel/lighthouse-ci/blob/master/builder/Dockerfile

LABEL maintainer="support@apify.com" Description="Image used to run Apify acts with Google Chrome"

# Install utilities
RUN apt-get update --fix-missing \
 && DEBIAN_FRONTEND=noninteractive apt-get -y upgrade \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends apt-utils sudo curl unzip ca-certificates

# Install Squid
RUN sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends squid3 \
 && sudo squid3 -k shutdown \
 && sudo ln -s /usr/sbin/squid3 /usr/sbin/squid

# Install Node 7 and latest NPM
RUN curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash - \
 && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends nodejs build-essential \
 && sudo npm install npm@latest -g

# Install Chrome Beta
RUN curl -sS https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - \
 && sudo sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
 && sudo DEBIAN_FRONTEND=noninteractive apt-get update \
 && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

# Install ChromeDriver for Selenium (see https://sites.google.com/a/chromium.org/chromedriver/)
RUN curl -sS http://chromedriver.storage.googleapis.com/2.33/chromedriver_linux64.zip > /tmp.zip \
 && unzip tmp.zip \
 && rm tmp.zip \
 && mv /chromedriver /bin

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy source code
COPY package.json main.js /usr/src/app/

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
 && npm install --only=prod --no-optional \
 && echo "Installed NPM packages:" \
 && npm list \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version \
 && echo "Google Chrome version:" \
 && google-chrome-stable --version \
 && echo "ChromeDriver version:" \
 && chromedriver --version \
 && echo "Squid version:" \
 && squid -v

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory
ENV NODE_OPTIONS="--max_old_space_size=16000"

# Not using "npm start" to avoid unnecessary process, using CMD to enable simple overriding
CMD [ "node", "main.js" ]
