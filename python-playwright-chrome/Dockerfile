# Get the Python version provided as a build argument
ARG PYTHON_VERSION

# Use trixie-slim to be consistent across python versions
FROM --platform=linux/amd64 python:${PYTHON_VERSION}-slim-trixie

# Add labels to the image to identify it as an Apify Actor
LABEL maintainer="support@apify.com" \
    description="Base image for Apify Actors written in Python using Playwright with Chrome"

# Set the shell to use /bin/bash with specific options (see Hadolint DL4006)
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Get the Apify Python SDK version provided as a build argument
ARG APIFY_VERSION

# Get the Playwright version provided as a build argument
ARG PLAYWRIGHT_VERSION

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

ENV PLAYWRIGHT_BROWSERS_PATH=/pw-browsers

# Install dependencies and Chrome
RUN \
    # Disable chrome auto updates, based on https://support.google.com/chrome/a/answer/9052345
    mkdir -p /etc/default && echo 'repo_add_once=false' > /etc/default/google-chrome \
    && apt update \
    && apt install -y wget gnupg unzip ca-certificates xvfb xauth git procps curl --no-install-recommends \
    # Add Google Linux signing key
    && wget -qO- https://dl-ssl.google.com/linux/linux_signing_key.pub \
        | gpg --dearmor \
        | tee /usr/share/keyrings/google-linux-signing.gpg > /dev/null \
    # Add Google Chrome APT repo
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list' \
    && sh -c 'echo "deb http://ftp.us.debian.org/debian trixie main non-free" >> /etc/apt/sources.list.d/fonts.list' \
    && apt update \
    && apt purge --auto-remove -y unzip \
    && apt install -y \
    google-chrome-stable \
    # Extras
    fonts-freefont-ttf \
    fonts-kacst-one \
    fonts-thai-tlwg \
    fonts-wqy-zenhei \
    --no-install-recommends \
    # Install playwright browser dependencies for chrome
    && python3 -m pip install --user playwright~=${PLAYWRIGHT_VERSION} \
    && python3 -m playwright install-deps chromium \
    # Install chromium browser in a specific path
    && python3 -m playwright install chromium \
    && python3 -m pip uninstall -y playwright \
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    && mkdir -p /usr/src/app \
    && chown -R myuser:myuser /usr/src/app \
    && ln -s /usr/src/app /home/myuser \
    && mkdir -p /etc/opt/chrome/policies/managed \
    && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json \
    && echo '{ "ComponentUpdatesEnabled": false }' > /etc/opt/chrome/policies/managed/component_update.json \
    # Clean up
    && apt autoremove -yqq --purge \
    && apt clean \
    && rm -rf /var/lib/apt/lists/* /var/log/*

WORKDIR /usr/src/app

ENV PATH="/root/.local/bin:/home/myuser/.local/bin:$PATH"

# Sets path to Chrome executable
ENV APIFY_CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome

# Set default browser path
ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/chromium-1169/chrome-linux/chrome

# This instruction:
# - Upgrades pip to the latest version
# - Preinstalls the latest versions of setuptools and wheel to improve package installation speed
# - Installs the specified version of the Apify Python SDK and Playwright
RUN pip install --upgrade \
    pip \
    setuptools \
    wheel \
    apify~=${APIFY_VERSION} \
    playwright~=${PLAYWRIGHT_VERSION}

# Copy the dummy source code to the image
COPY --chown=myuser:myuser . .

# NOTE: This needs to be compatible with how Apify CLI launches Actors
ENTRYPOINT ["./xvfb-entrypoint.sh"]
CMD ["python3", "-m", "src"]
