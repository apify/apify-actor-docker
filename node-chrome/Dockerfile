FROM debian:latest

# This image was inspired by https://github.com/ebidel/lighthouse-ci/blob/master/builder/Dockerfile

LABEL maintainer="support@apifier.com" Description="Image used to run Apifier acts with Google Chrome"

# Install utilities
RUN apt-get update --fix-missing \
 && DEBIAN_FRONTEND=noninteractive apt-get -y upgrade \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends apt-utils sudo curl unzip ca-certificates

# Install Squid
RUN sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends squid3 \
 && sudo squid3 -k shutdown \
 && sudo ln -s /usr/sbin/squid3 /usr/sbin/squid

# Install Node 7
RUN curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash - \
 && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends nodejs

# Install Chrome Beta
RUN curl -sS https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - \
 && sudo sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
 && sudo DEBIAN_FRONTEND=noninteractive apt-get update \
 && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y google-chrome-beta

# Install ChromeDriver for Selenium
RUN curl -sS http://chromedriver.storage.googleapis.com/2.30/chromedriver_linux64.zip > /tmp.zip \
 && unzip tmp.zip \
 && rm tmp.zip \
 && mv /chromedriver /bin

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - \
 && echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list \
 && sudo DEBIAN_FRONTEND=noninteractive apt-get update \
 && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends yarn

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy source code
COPY package.json main.js /usr/src/app/

# Install default dependencies, print versions of everything
RUN yarn install --production \
 && echo "Installed NPM packages:" \
 && yarn list \
 && echo "Node.js version:" \
 && node --version \
 && echo "Yarn version:" \
 && yarn --version \
 && echo "Google Chrome version:" \
 && google-chrome-beta --version \
 && echo "ChromeDriver version:" \
 && chromedriver --version

# Not using "npm start" to avoid unnecessary process, using CMD to enable simple overriding
CMD [ "node", "main.js" ]
