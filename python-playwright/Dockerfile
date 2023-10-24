# Use the specified Python version
ARG PYTHON_VERSION
FROM python:${PYTHON_VERSION}-bullseye

LABEL maintainer="support@apify.com" description="Base image for Apify Actors written in Python using Playwright"

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
ARG APIFY_VERSION
ARG PLAYWRIGHT_VERSION
RUN pip install apify~=${APIFY_VERSION} playwright~=${PLAYWRIGHT_VERSION}
RUN playwright install-deps
RUN playwright install

# Next, copy the remaining files and directories with the source code.
COPY . ./

# Set up XVFB
# We should use the autodisplay detection as suggested here: https://github.com/microsoft/playwright/issues/2728#issuecomment-678083619
ENV DISPLAY=:99
ENV XVFB_WHD=1920x1080x24+32

# NOTE: This needs to be compatible with how Apify CLI launches Actors
ENTRYPOINT ["./start_xvfb_and_run_cmd.sh"]
CMD ["python3", "-m", "src"]
