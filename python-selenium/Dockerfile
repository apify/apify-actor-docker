# Use the specified Python version, fallback to 3.8 as default

ARG PYTHON_VERSION=3.8
FROM python:${PYTHON_VERSION}

LABEL maintainer="support@apify.com" Description="Base image for Apify actors written in Python using Selenium"

# Install firefox and gecko driver
RUN apt-get update                             \
 && apt-get install -y --no-install-recommends \
    ca-certificates curl firefox-esr           \
 && curl -L https://github.com/mozilla/geckodriver/releases/download/v0.30.0/geckodriver-v0.30.0-linux64.tar.gz | tar xz -C /usr/local/bin

# Install google chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
RUN apt-get -y update
RUN apt-get install -y google-chrome-stable

# Install chromedriver
RUN apt-get install -yqq unzip
RUN wget -O /tmp/chromedriver.zip http://chromedriver.storage.googleapis.com/`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE`/chromedriver_linux64.zip
RUN unzip /tmp/chromedriver.zip chromedriver -d /usr/local/bin/

# Set display port to avoid crash
ENV DISPLAY=:99

# Don't store bytecode, the Python app will be only run once
ENV PYTHONDONTWRITEBYTECODE 1

# Don't buffer output and flush it straight away
ENV PYTHONUNBUFFERED 1

# Create a virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Disable warnings about outdated pip
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Upgrade pip before installing anything else first
RUN pip install --upgrade pip

# Preinstall the latest versions of setuptools and wheel for faster package installs
RUN pip install --upgrade setuptools wheel

# Install apify and selenium
ARG APIFY_VERSION=0.2.0
RUN pip install apify~=${APIFY_VERSION} selenium

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy the dummy source code to the image
COPY main.py ./

# Set default startup command, using CMD instead of ENTRYPOINT, to allow manual overriding
CMD python3 main.py
