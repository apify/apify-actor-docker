# Use the specified Python version
ARG PYTHON_VERSION
FROM python:${PYTHON_VERSION}

LABEL maintainer="support@apify.com" Description="Base image for Apify actors written in Python using Selenium"

# Install firefox and gecko driver
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl firefox-esr \
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

# Install XVFB
RUN apt-get install -y xvfb

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

# Install the specified Apify SDK for Python version and selenium
ARG APIFY_VERSION=0.2.0
RUN pip install apify~=${APIFY_VERSION} selenium

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy the dummy source code to the image
COPY . .

# Set up XVFB
# We should use the autodisplay detection as suggested here: https://github.com/microsoft/playwright/issues/2728#issuecomment-678083619
ENV DISPLAY=:99
ENV XVFB_WHD=1920x1080x24+32

# NOTE: This needs to be compatible with how Apify CLI launches actors
ENTRYPOINT ["./start_xvfb_and_run_cmd.sh"]
CMD ["python3", "-m", "src"]
