FROM ubuntu:latest

# This image was inspired by https://github.com/ebidel/lighthouse-ci/blob/master/builder/Dockerfile

LABEL maintainer="support@apifier.com" Description="This image is used to run Apifier acts"

## PART 1: Core components
## =======================

# Install utilities
RUN apt-get update --fix-missing && apt-get -y upgrade \
 && apt-get install -y --no-install-recommends apt-utils sudo curl wget unzip git

# Install Node 7
RUN curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash - \
 && sudo apt-get install -y nodejs

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - \
 && echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list \
 && sudo apt-get update \
 && sudo apt-get install -y yarn


# Install Xvfb and dbus for X11
# Note: Uncomment if you don't want to use Headless Chrome.
# RUN apt-get install -y xvfb dbus-x11

# Install Chrome 59+
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - \
 && sudo sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
 && sudo apt-get update \
 && sudo apt-get install -y google-chrome-beta

# Install imagemagick for tests [optional]
# RUN apt-get install -y imagemagick

# Copy key documents (except .dockerignored files)
# Note: Uncomment these if you don't want to use Headless Chrome.
# COPY etc/xvfb /etc/init.d/xvfb
# RUN chmod +x /etc/init.d/xvfb

RUN yarn --version

## PART 2: Lighthouse
## ==================

# Download lighthouse from source.
# RUN git clone https://github.com/googlechrome/lighthouse &&\
# cd /lighthouse &&\
# git checkout tags/1.6.5 &&\
# yarn install &&\
# yarn install-all &&\
# yarn build-all

# Download lighthouse from npm.
# cache bust so we always get the latest version of LH when building the image.
# ARG CACHEBUST=1
# RUN yarn global add lighthouse



## PART 3: Express server
## ======================

# Install express
# COPY package.json /
# RUN yarn install

# Add the simple server file
# COPY server.js /
# RUN chmod +x /server.js

# Expose port 8080
# EXPOSE 8080

## PART 4: Final setup
## ===================

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy source code
COPY package.json main.js /usr/src/app/

# Install default dependencies
RUN yarn install --production

# Add a user and make it a sudo user
RUN useradd -m chromeuser &&\
sudo adduser chromeuser sudo

# Copy the chrome-user script used to start Chrome as non-root
COPY chromeuser-script.sh /usr/src/app
RUN chmod +x /usr/src/app/chromeuser-script.sh

# Set the entrypoint
COPY entrypoint.sh /usr/src/app
RUN chmod +x /usr/src/app/entrypoint.sh
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]

# CMD ["/bin/bash"]
