FROM debian:latest

# This image was inspired by https://github.com/ebidel/lighthouse-ci/blob/master/builder/Dockerfile

LABEL maintainer="support@apifier.com" Description="Image used to run Apifier acts with Google Chrome"

# Install utilities
RUN apt-get update --fix-missing && apt-get -y upgrade \
 && apt-get install -y --no-install-recommends sudo curl unzip ca-certificates

# Install Node 7
RUN curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash - \
 && sudo apt-get install -y --no-install-recommends nodejs

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - \
 && echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list \
 && sudo apt-get update \
 && sudo apt-get install -y --no-install-recommends yarn

# Install Chrome 59+
RUN curl -sS https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - \
 && sudo sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
 && sudo apt-get update \
 && sudo apt-get install -y google-chrome-beta

# Install ChromeDriver for Selenium
RUN sudo apt-get install -y --no-install-recommends libglib2.0-0 libx11-6 libnss3 libgconf-2-4 libfontconfig1 \
 && curl http://chromedriver.storage.googleapis.com/2.29/chromedriver_linux64.zip > /tmp.zip \
 && unzip tmp.zip \
 && rm tmp.zip \
 && mv /chromedriver /bin

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy source code
COPY package.json main.js /usr/src/app/

# Install default dependencies
RUN yarn install --production

# Add a user and make it a sudo user
RUN useradd -m chromeuser \
 && sudo adduser chromeuser sudo

# Copy the chrome-user script used to start Chrome as non-root
COPY chromeuser-script.sh /usr/src/app
RUN chmod +x /usr/src/app/chromeuser-script.sh

# Set the entrypoint
COPY entrypoint.sh /usr/src/app
RUN chmod +x /usr/src/app/entrypoint.sh

# Not using "npm start" to avoid unnecessary process, using CMD to enable simple overriding
CMD [ "node", "main.js" ]
