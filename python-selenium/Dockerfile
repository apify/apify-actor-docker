# Use the specified Python version
ARG PYTHON_VERSION
FROM python:${PYTHON_VERSION}-bullseye

LABEL maintainer="support@apify.com" Description="Base image for Apify actors written in Python using Selenium"

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install curl, firefox, jq, unzip, xvfb and other dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        firefox-esr \
        fonts-liberation \
        jq \
        libappindicator3-1 \
        libasound2 \
        libatk-bridge2.0-0 \
        libgbm-dev \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libx11-6 \
        libx11-xcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxkbcommon0 \
        libxrandr2 \
        libxrender1 \
        libxslt1.1 \
        libxss1 \
        libxt6 \
        libxtst6 \
        unzip \
        wget \
        xdg-utils \
        xvfb && \
    apt-get autoremove -yqq --purge && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install gecko driver
RUN curl -L https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz | tar xz -C /usr/local/bin

RUN export CHROME_VERSION="$(curl -s https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json | jq -r '.channels.Stable.version')" && \
    # Install Google Chrome \
    curl -sSL -o /tmp/chrome-linux64.zip "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${CHROME_VERSION}/linux64/chrome-linux64.zip" && \
    unzip /tmp/chrome-linux64.zip -d /opt/ && \
    ln -s /opt/chrome-linux64/chrome /usr/bin/google-chrome && \
    ln -s /opt/chrome-linux64/chrome /usr/bin/google-chrome-stable && \
    rm -f /tmp/chrome-linux64.zip && \
    # Install Google Chrome driver \
    curl -sSL -o /tmp/chromedriver-linux64.zip "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${CHROME_VERSION}/linux64/chromedriver-linux64.zip" && \
    unzip /tmp/chromedriver-linux64.zip -d /usr/local/bin/ && \
    rm -f /tmp/chromedriver-linux64.zip

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
ARG APIFY_VERSION=1.1.0
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
