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
ENV XVFB_WHD=1920x1080x24+32

# Install xvfb and xauth
RUN apt update \
    && apt install -y xvfb xauth git procps curl wget --no-install-recommends \
    # Install playwright browser dependencies
    && python3 -m pip install --user playwright~=${PLAYWRIGHT_VERSION} \
    && python3 -m playwright install-deps \
    && python3 -m pip uninstall -y playwright \
    # Clean up
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    && apt clean -y && apt autoremove -y \
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

ENV PLAYWRIGHT_BROWSERS_PATH=/home/myuser/pw-browsers

ENV PATH="/home/myuser/.local/bin:$PATH"

# This instruction:
# - Upgrades pip to the latest version
# - Preinstalls the latest versions of setuptools and wheel to improve package installation speed
# - Installs the specified version of the Apify Python SDK and Playwright
RUN pip install --user --upgrade \
    pip \
    setuptools \
    wheel \
    apify~=${APIFY_VERSION} \
    playwright~=${PLAYWRIGHT_VERSION}

# Install Playwright and its dependencies
RUN playwright install

# Copy the dummy source code to the image
COPY --chown=myuser:myuser . .

# NOTE: This needs to be compatible with how Apify CLI launches Actors
ENTRYPOINT ["./xvfb-entrypoint.sh"]
CMD ["python3", "-m", "src"]
