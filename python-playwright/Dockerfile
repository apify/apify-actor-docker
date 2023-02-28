# Use the specified Python version and Playwright version
ARG PLAYWRIGHT_VERSION=1.30.0
FROM mcr.microsoft.com/playwright/python:v${PLAYWRIGHT_VERSION}-focal

LABEL maintainer="support@apify.com" Description="Base image for simple Apify actors written in Python using playwright"

# Playwright image comes with latest Python version, so we need to install the one we want.
ARG PYTHON_VERSION=3.8

# Use pyenv to install the specified Python version
ENV PYENV_ROOT /root/.pyenv
ENV PATH $PYENV_ROOT/shims:$PYENV_ROOT/bin:$PATH
# Set of all dependencies needed for pyenv to work on Ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libssl-dev zlib1g-dev \
        libbz2-dev libreadline-dev libsqlite3-dev curl \
        libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev

# Install specified Python version
RUN set -ex \
    && curl https://pyenv.run | bash \
    && pyenv update \
    && pyenv install $PYTHON_VERSION \
    && pyenv global $PYTHON_VERSION \
    && pyenv rehash

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

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install the specified Apify SDK version and Python Playwright version
ARG PLAYWRIGHT_VERSION=1.30.0
ARG APIFY_VERSION=0.1.0
RUN pip install apify~=${APIFY_VERSION} playwright~=${PLAYWRIGHT_VERSION}

# Next, copy the remaining files and directories with the source code.
COPY . ./

# Set up xvfb

# We should you the autodisplay detection as suggested here: https://github.com/microsoft/playwright/issues/2728#issuecomment-678083619
ENV DISPLAY=:99
ENV XVFB_WHD=1920x1080x24+32

# Uncoment this line if you want to run browser in headfull mode by defautl.
# ENV APIFY_XVFB=1

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ./start_xvfb_and_run_cmd.sh && python3 -m src
