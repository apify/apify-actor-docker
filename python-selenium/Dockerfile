# Get the Python version provided as a build argument
ARG PYTHON_VERSION

# Extend from the latest Debian and its slim version to keep the image as small as possible
FROM python:${PYTHON_VERSION}-slim-trixie

# Add labels to the image to identify it as an Apify Actor
LABEL maintainer="support@apify.com" \
    description="Base image for Apify Actors written in Python using Selenium"

# Set the shell to use /bin/bash with specific options (see Hadolint DL4006)
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Get the Selenium version provided as a build argument
ARG SELENIUM_VERSION

# Don't store bytecode, the Python app will be only run once
ENV PYTHONDONTWRITEBYTECODE=1

# Don't buffer output and flush it straight away
ENV PYTHONUNBUFFERED=1

# Don't use a cache dir
ENV PIP_NO_CACHE_DIR=1

# Disable warnings about outdated pip
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Disable warnings about running pip as root
ENV PIP_ROOT_USER_ACTION=ignore

# Set up XVFB
ENV XVFB_WHD=1920x1080x24+32

# Setup the less privileged user
RUN groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    && mkdir -p /usr/src/app \
    && chown -R myuser:myuser /usr/src/app \
    && ln -s /usr/src/app /home/myuser \
    # Install curl, firefox, jq, unzip, xvfb and dependencies of Chrome and its driver
    && apt update \
    && apt install -y --no-install-recommends \
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
    xdg-utils \
    xvfb \
    xauth \
    && apt autoremove -yqq --purge \
    && apt clean \
    && rm -rf /var/lib/apt/lists/* /var/log/*

# Download and install Geckodriver
RUN GECKO_DRIVER_URL="https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz" && \
    curl --silent --show-error --location --output /tmp/geckodriver.tar.gz "$GECKO_DRIVER_URL" && \
    tar --gzip --extract --file=/tmp/geckodriver.tar.gz --directory=/usr/local/bin && \
    rm -f /tmp/geckodriver.tar.gz

# Download and install Google Chrome
RUN CHROME_URL="$( \
    curl --silent --show-error --location https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json | \
    jq -r '.channels.Stable.downloads.chrome[] | select(.platform=="linux64") | .url' \
    )" && \
    curl --silent --show-error --location --output /tmp/chrome-linux64.zip "$CHROME_URL" && \
    unzip /tmp/chrome-linux64.zip -d /opt/ && \
    ln -s /opt/chrome-linux64/chrome /usr/bin/google-chrome && \
    ln -s /opt/chrome-linux64/chrome /usr/bin/google-chrome-stable && \
    rm -f /tmp/chrome-linux64.zip

# Download and install Google Chrome driver
RUN CHROME_DRIVER_URL="$( \
    curl --silent --show-error --location https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json | \
    jq -r '.channels.Stable.downloads.chromedriver[] | select(.platform=="linux64") | .url' \
    )" && \
    curl --silent --show-error --location --output /tmp/chromedriver-linux64.zip "$CHROME_DRIVER_URL" && \
    unzip /tmp/chromedriver-linux64.zip -d /usr/local/bin/ && \
    rm -f /tmp/chromedriver-linux64.zip

WORKDIR /usr/src/app

ENV PATH="/root/.local/bin:/home/myuser/.local/bin:$PATH"

# This instruction:
# - Upgrades pip to the latest version
# - Preinstalls the latest versions of setuptools and wheel to improve package installation speed
# - Installs the specified version of Selenium
RUN python -m pip install --upgrade \
    pip \
    setuptools \
    wheel \
    selenium~=${SELENIUM_VERSION}

# Copy the dummy source code to the image
COPY --chown=myuser:myuser . .

# NOTE: This needs to be compatible with how Apify CLI launches Actors
ENTRYPOINT ["./xvfb-entrypoint.sh"]
CMD ["python", "-m", "src"]
