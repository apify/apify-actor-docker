ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

LABEL maintainer="support@apify.com" description="Base image for simple Apify Actors"

# Globally disable the update-notifier.
RUN npm config --global set update-notifier false \
    # add user
    && addgroup -S myuser \
    && adduser -S -h /home/myuser -s /bin/sh -D myuser myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Copy source code
COPY --chown=myuser:myuser package.json main.js /home/myuser/

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
	&& npm install --omit=dev --omit=optional --no-package-lock --prefer-online \
	&& echo "Installed NPM packages:" \
	&& (npm list --omit=dev --omit=optional || true) \
	&& echo "Node.js version:" \
	&& node --version \
	&& echo "NPM version:" \
	&& npm --version \
    && ls -la /home/myuser

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory (Actor has limit of 32GB)
# Increases default size of headers. The original limit was 80kb, but from node 10+ they decided to lower it to 8kb.
# However they did not think about all the sites there with large headers,
# so we put back the old limit of 80kb, which seems to work just fine.
ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ["npm", "start", "--silent"]
