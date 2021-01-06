ARG TAG=latest
FROM apify/actor-node-chrome:$TAG

# Install xvfb frame buffer needed for non-headless Chrome
USER root
RUN apt-get update
RUN apt-get install --fix-missing -yq --no-install-recommends libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 libnss3 wget

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Copy source code
COPY --chown=myuser:myuser start_xvfb_and_run_cmd.sh /home/myuser/

# Set up xvfb
ENV XVFB_WHD=1920x1080x16
ENV APIFY_XVFB=1

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD xvfb-run npm start --silent

