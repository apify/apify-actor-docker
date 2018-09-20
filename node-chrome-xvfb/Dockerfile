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
COPY --chown=myuser:myuser main.js start_xvfb_and_run_cmd.sh start_actor.sh /home/myuser/

ENV DISPLAY=:99
ENV XVFB_WHD=1280x720x16
ENV APIFY_XVFB=1

# NOTE: This needs to be compatible with CLI.
# NOTE: Fallback to "node main.js" is there for backwards compatibility. We should remove in the future.
ENTRYPOINT ./start_xvfb_and_run_cmd.sh && ./start_actor.sh