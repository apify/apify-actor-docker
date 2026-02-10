# Get the Python version provided as a build argument
ARG PYTHON_VERSION=

# Use trixie-slim to be consistent across python versions
FROM --platform=linux/amd64 python:${PYTHON_VERSION}-slim-trixie

# Add labels to the image to identify it as an Apify Actor
LABEL maintainer="support@apify.com" \
    description="Base image for Apify Actors written in Python using Playwright with only Firefox"

# Get the Playwright version provided as a build argument
ARG PLAYWRIGHT_VERSION=

ENV DEBIAN_FRONTEND=noninteractive

# Set the shell to use /bin/bash with specific options (see Hadolint DL4006)
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

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

# Tells playwright where to install and where to find the browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/pw-browsers

# Tell the crawlee cli that we already have browsers installed, so it skips installing them
ENV CRAWLEE_SKIP_BROWSER_INSTALL=1

# Prevent playwright from downloading browsers when users install playwright via pip
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/firefox

# Copy the script for registering intermediate certificates and the pre-downloaded certificates
COPY ./register_intermediate_certs.sh ./register_intermediate_certs.sh
COPY ./firefox-certs /tmp/firefox-certs

RUN apt update \
    && apt install --fix-missing -yq --no-install-recommends \
    # Install xvfb, xauth, wget, git
    xvfb xauth wget git \
    # The following packages are needed for the intermediate certificates to work in Firefox.
    ca-certificates jq p11-kit \
    # Found this in other images, not sure whether it's needed, it does not come from Playwright deps
    procps \
    && sh -c 'echo "deb http://ftp.us.debian.org/debian trixie main non-free" >> /etc/apt/sources.list.d/fonts.list' \
    && apt update \
    && apt install -y --no-install-recommends \
    # Extras
    fonts-freefont-ttf \
    fonts-kacst-one \
    fonts-thai-tlwg \
    fonts-wqy-zenhei \
    \
    # Install Playwright browser OS dependencies
    && python -m pip install playwright \
    && python -m playwright install-deps firefox \
    && python -m pip uninstall -y playwright \
    \
    # Register certificates
    && chmod +x ./register_intermediate_certs.sh \
    && ./register_intermediate_certs.sh \
    \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    && mkdir -p /usr/src/app \
    && chown -R myuser:myuser /usr/src/app \
    && ln -s /usr/src/app /home/myuser \
    \
    # Cleanup time
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    && apt clean -y && apt autoremove -y \
    # This is needed to remove an annoying error message when running headful.
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

WORKDIR /usr/src/app

ENV PATH="/root/.local/bin:/home/myuser/.local/bin:$PATH"

# This instruction:
# - Upgrades pip to the latest version
# - Preinstalls the latest versions of setuptools and wheel to improve package installation speed
# - Installs the specified version of Playwright
RUN python -m pip install --upgrade \
    pip \
    setuptools \
    wheel \
    playwright~=${PLAYWRIGHT_VERSION} \
    # Install Playwright browsers
    && python -m playwright install firefox \
    # symlink the firefox binary to the root folder in order to bypass the versioning and resulting browser launch crashes.
    && ln -s ${PLAYWRIGHT_BROWSERS_PATH}/firefox-*/firefox/firefox ${PLAYWRIGHT_BROWSERS_PATH}/ \
    # Overrides the dynamic library used by Firefox to determine trusted root certificates with p11-kit-trust.so, which loads the system certificates.
    && rm -f $PLAYWRIGHT_BROWSERS_PATH/firefox-*/firefox/libnssckbi.so \
    && ln -s /usr/lib/x86_64-linux-gnu/pkcs11/p11-kit-trust.so $(ls -d $PLAYWRIGHT_BROWSERS_PATH/firefox-*)/firefox/libnssckbi.so

# Copy the dummy source code to the image
COPY --chown=myuser:myuser . .

# The entrypoint script will be the one handling the CMD passed in, and will always wrap it into xvfb-run
ENTRYPOINT ["./xvfb-entrypoint.sh"]

CMD ["python", "-m", "src"]
