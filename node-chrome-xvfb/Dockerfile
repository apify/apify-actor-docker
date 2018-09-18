FROM apify/actor-node-chrome:beta

# Install xvfb frame buffer needed for non-headless Chrome
USER root
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb \
 && rm -rf /var/lib/apt/lists/* \
 && rm -rf /src/*.deb

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Copy source code
COPY --chown=myuser:myuser main.js start_xvfb_and_run_cmd.sh /home/myuser/

ENV DISPLAY=:99
ENV XVFB_WHD=1280x720x16
ENV APIFY_XVFB=1

# This starts xvfb frame buffer and then executes Dockerfile CMD
ENTRYPOINT [ "./start_xvfb_and_run_cmd.sh" ]

# NOTE: This needs to be compatible with CLI.
CMD [ "npm", "run", "start" ]
