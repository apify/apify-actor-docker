# Get the Python version provided as a build argument
ARG PYTHON_VERSION

# Use jammy (Ubuntu 22.04) for WebKit compatibility
FROM --platform=linux/amd64 ubuntu:jammy

# Add labels to the image to identify it as an Apify Actor
LABEL maintainer="support@apify.com" \
    description="Base image for Apify Actors written in Python using Playwright with WebKit"

# Set the shell to use /bin/bash with specific options (see Hadolint DL4006)
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Get the Python version provided as a build argument
ARG PYTHON_VERSION

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

ENV DEBIAN_FRONTEND=noninteractive

# Install Python and WebKit dependencies
RUN apt update \
    && apt install -y --no-install-recommends \
    software-properties-common \
    && add-apt-repository -y ppa:deadsnakes/ppa \
    && apt update \
    && apt install -y --no-install-recommends \
    python${PYTHON_VERSION} \
    python${PYTHON_VERSION}-venv \
    python${PYTHON_VERSION}-distutils \
    python3-pip \
    git \
    procps \
    xvfb \
    xauth \
    curl \
    wget \
    ca-certificates \
    libgtk-3-0 \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    # Set the default Python version
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python${PYTHON_VERSION} 1 \
    && update-alternatives --set python3 /usr/bin/python${PYTHON_VERSION} \
    # Install playwright browser dependencies for webkit
    && python3 -m pip install --user playwright~=${PLAYWRIGHT_VERSION} \
    && python3 -m playwright install-deps webkit \
    # Install webkit browser in a specific path
    && python3 -m playwright install webkit \
    && python3 -m pip uninstall -y playwright \
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix \
    && mkdir -p /usr/src/app \
    && chown -R myuser:myuser /usr/src/app \
    && ln -s /usr/src/app /home/myuser \
    # Clean up
    && apt autoremove -yqq --purge \
    && apt clean \
    && rm -rf /var/lib/apt/lists/* /var/log/*

WORKDIR /usr/src/app

ENV PATH="/root/.local/bin:/home/myuser/.local/bin:$PATH"

# Set default browser path
ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/webkit

# This instruction:
# - Upgrades pip to the latest version
# - Preinstalls the latest versions of setuptools and wheel to improve package installation speed
# - Installs the specified version of the Apify Python SDK and Playwright
RUN python3 -m pip install --upgrade \
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
