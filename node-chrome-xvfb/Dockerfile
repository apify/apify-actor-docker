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

# NOTE: This needs to be compatible with CLI.
# NOTE: Fallback to "node main.js" is there for backwards compatibility. We should remove in the future.
ENTRYPOINT ./start_xvfb_and_run_cmd.sh && (\
    npm run start \
    || (printf "\nWARNING: The npm start script not found in package.json. Using \"node main.js\" instead. \
Please update your package.json file. For more information see \
https://github.com/apifytech/apify-cli/blob/develop/MIGRATIONS.md\n\n"\
    && node main.js) \
)\