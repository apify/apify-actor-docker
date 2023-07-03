# Use the specified Python version
ARG PYTHON_VERSION
FROM python:${PYTHON_VERSION}-bullseye

LABEL maintainer="support@apify.com" Description="Base image for simple Apify actors written in Python"

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

# Install the specified Apify SDK for Python version
ARG APIFY_VERSION
RUN pip install apify~=${APIFY_VERSION}

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy the dummy source code to the image
COPY . .

# Set default startup command, using CMD instead of ENTRYPOINT, to allow manual overriding
CMD python3 -m src
