FROM apify/actor-node-chrome:beta

# Install xvfb frame buffer needed for non-headless Chrome
USER root
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Copy source code
COPY --chown=myuser:myuser main.js /home/myuser/

# Not using "npm start" to avoid unnecessary process, using CMD to enable simple overriding
CMD [ "node", "main.js" ]

