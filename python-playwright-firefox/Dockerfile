# Get the Python version provided as a build argument
ARG PYTHON_VERSION

# Use trixie-slim to be consistent across python versions
FROM --platform=linux/amd64 python:${PYTHON_VERSION}-slim-trixie

# Add labels to the image to identify it as an Apify Actor
LABEL maintainer="support@apify.com" \
    description="Base image for Apify Actors written in Python using Playwright with Firefox"

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

# Copy the script for registering intermediate certificates.
COPY ./register_intermediate_certs.sh ./register_intermediate_certs.sh

# Install dependencies and Firefox
RUN sh -c 'echo "deb http://ftp.us.debian.org/debian trixie main non-free" >> /etc/apt/sources.list.d/fonts.list' \
    && apt update \
    && apt install -y --no-install-recommends \
    git \
    procps \
    xvfb \
    xauth \
    curl \
    wget \
    # The following packages are needed for the intermediate certificates to work in Firefox.
    ca-certificates \
    jq \
    p11-kit \
    # Register certificates
    && chmod +x ./register_intermediate_certs.sh \
    && ./register_intermediate_certs.sh \
    # Install playwright browser dependencies for firefox
    && python3 -m pip install --user playwright~=${PLAYWRIGHT_VERSION} \
    && python3 -m playwright install-deps firefox \
    # Install firefox browser in a specific path
    && python3 -m playwright install firefox \
    && python3 -m pip uninstall -y playwright \
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    && mkdir -p /usr/src/app \
    && chown -R myuser:myuser /usr/src/app \
    && ln -s /usr/src/app /home/myuser \
    # Clean up
    && apt autoremove -yqq --purge \
    && apt clean \
    && rm -rf /var/lib/apt/lists/* /var/log/* \
    # Overrides the dynamic library used by Firefox to determine trusted root certificates with p11-kit-trust.so, which loads the system certificates.
    && rm -f $PLAYWRIGHT_BROWSERS_PATH/firefox-*/firefox/libnssckbi.so \
    && ln -s /usr/lib/x86_64-linux-gnu/pkcs11/p11-kit-trust.so $(ls -d $PLAYWRIGHT_BROWSERS_PATH/firefox-*)/firefox/libnssckbi.so

WORKDIR /usr/src/app

ENV PATH="/root/.local/bin:/home/myuser/.local/bin:$PATH"

# Set default browser path
ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/firefox

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
