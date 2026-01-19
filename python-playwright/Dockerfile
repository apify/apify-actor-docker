# Get the Python version provided as a build argument
ARG PYTHON_VERSION=

# Extend from the latest Debian and its slim version to keep the image as small as possible
FROM --platform=linux/amd64 python:${PYTHON_VERSION}-slim-trixie

# Add labels to the image to identify it as an Apify Actor
LABEL maintainer="support@apify.com" \
    description="Base image for Apify Actors written in Python using Playwright with headless Chrome"

# Get the Apify Python SDK version provided as a build argument
ARG APIFY_VERSION=

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

# Sets path to Chrome executable
ENV APIFY_CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome

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
    # Packages for Google signing key
    gnupg unzip \
     # Add Google Linux signing key
    && wget -qO- https://dl-ssl.google.com/linux/linux_signing_key.pub \
        | gpg --dearmor \
        | tee /usr/share/keyrings/google-linux-signing.gpg > /dev/null \
    # Add Google Chrome APT repo
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && sh -c 'echo "deb http://ftp.us.debian.org/debian trixie main non-free" >> /etc/apt/sources.list.d/fonts.list' \
    && apt update \
    && apt install -y --no-install-recommends \
    # Install Google Chrome
    google-chrome-stable \
    # Extras
    fonts-freefont-ttf \
    fonts-kacst-one \
    fonts-thai-tlwg \
    fonts-wqy-zenhei \
    \
    # Register certificates
    && chmod +x ./register_intermediate_certs.sh \
    && ./register_intermediate_certs.sh \
    \
    # Disable chrome auto updates, based on https://support.google.com/chrome/a/answer/9052345
    && mkdir -p /etc/default && echo 'repo_add_once=false' > /etc/default/google-chrome \
    && mkdir -p /etc/opt/chrome/policies/managed \
    && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json \
    && echo '{ "ComponentUpdatesEnabled": false }' > /etc/opt/chrome/policies/managed/component_update.json \
    \
    # Install Playwright browser dependencies and browsers
    && python -m pip install --user playwright~=${PLAYWRIGHT_VERSION} \
    && python -m playwright install-deps \
    && python -m playwright install \
    && python -m pip uninstall -y playwright \
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
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix \
    \
    # Override the dynamic library used by Firefox to determine trusted root certificates with p11-kit-trust.so, which loads the system certificates.
    && rm -f $PLAYWRIGHT_BROWSERS_PATH/firefox-*/firefox/libnssckbi.so \
    && ln -s /usr/lib/x86_64-linux-gnu/pkcs11/p11-kit-trust.so $(ls -d $PLAYWRIGHT_BROWSERS_PATH/firefox-*)/firefox/libnssckbi.so

WORKDIR /usr/src/app

ENV PATH="/root/.local/bin:/home/myuser/.local/bin:$PATH"

# This instruction:
# - Upgrades pip to the latest version
# - Preinstalls the latest versions of setuptools and wheel to improve package installation speed
# - Installs the specified version of the Apify Python SDK and Playwright
# - Prints out the Google Chrome version
RUN pip install --upgrade \
    pip \
    setuptools \
    wheel \
    apify~=${APIFY_VERSION} \
    playwright~=${PLAYWRIGHT_VERSION} \
    && echo "Google Chrome version: $(bash -c "$APIFY_CHROME_EXECUTABLE_PATH --version")"

# Copy the dummy source code to the image
COPY --chown=myuser:myuser . .

# The entrypoint script will be the one handling the CMD passed in, and will always wrap it into xvfb-run
ENTRYPOINT ["./xvfb-entrypoint.sh"]

CMD ["python", "-m", "src"]
