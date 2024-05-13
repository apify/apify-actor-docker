# Get the Python version provided as a build argument
ARG PYTHON_VERSION

# Extend from the latest Debian and its slim version to keep the image as small as possible
FROM python:${PYTHON_VERSION}-slim-bookworm

# Add labels to the image to identify it as an Apify Actor
LABEL maintainer="support@apify.com" \
      description="Base image for Apify Actors written in Python using Playwright"

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
# We should use the autodisplay detection as suggested here: https://github.com/microsoft/playwright/issues/2728#issuecomment-678083619
ENV DISPLAY=:99
ENV XVFB_WHD=1920x1080x24+32

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

# Install Playwright and its dependencies
RUN playwright install-deps && \
    playwright install

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy the dummy source code to the image
COPY . .

# NOTE: This needs to be compatible with how Apify CLI launches Actors
ENTRYPOINT ["./start_xvfb_and_run_cmd.sh"]
CMD ["python3", "-m", "src"]
