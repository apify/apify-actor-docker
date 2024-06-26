# Get the Python version provided as a build argument
ARG PYTHON_VERSION

# Extend from the latest Debian and its slim version to keep the image as small as possible
FROM python:${PYTHON_VERSION}-slim-bookworm

# Add labels to the image to identify it as an Apify Actor
LABEL maintainer="support@apify.com" \
      description="Base image for simple Apify Actors written in Python"

# Set the shell to use /bin/bash with specific options (see Hadolint DL4006)
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Get the Apify Python SDK version provided as a build argument
ARG APIFY_VERSION

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

# This instruction:
# - Upgrades pip to the latest version
# - Preinstalls the latest versions of setuptools and wheel to improve package installation speed
# - Installs the specified version of the Apify Python SDK
RUN pip install --upgrade \
    pip \
    setuptools \
    wheel \
    apify~=${APIFY_VERSION}

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy the dummy source code to the image
COPY . .

# Set default startup command, using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ["python3", "-m", "src"]
