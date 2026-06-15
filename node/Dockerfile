ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine

LABEL maintainer="support@apify.com" description="Base image for simple Apify Actors"

# Globally disable the update-notifier.
RUN npm config --global set update-notifier false \
    # add user
    && addgroup -S myuser \
    && adduser -S -h /home/myuser -s /bin/sh -D myuser -G myuser \
    && adduser myuser audio \
    && adduser myuser video \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    && mkdir -p /usr/src/app \
    && chown -R myuser:myuser /usr/src/app \
    && ln -s /usr/src/app /home/myuser \
    \
    # Install the latest Corepack so Actors can opt into yarn or pnpm; `enable` drops the shims into the global bin.
    && npm install -g corepack@latest \
    && corepack enable \
    \
    # Pre-create the shared package-manager cache dirs (see the *_CACHE_*/*_STORE_DIR env vars), world-writable so any
    # user can populate them and `rm -rf` them at the end to reclaim space, regardless of which user the Actor runs as.
    && mkdir -p /pkg-cache/npm /pkg-cache/yarn /pkg-cache/pnpm/store /pkg-cache/pnpm/cache \
    && chmod -R 777 /pkg-cache

WORKDIR /usr/src/app

# Copy source code
COPY --chown=myuser:myuser package.json main.js .

# Send every package-manager cache to a single, dedicated location instead of $HOME.
# npm, yarn, and pnpm have no real "disable the cache" switch (unlike pip), so isolating
# their caches under /pkg-cache is the practical equivalent: the tree holds only throwaway
# cache data and can be wiped or mounted as tmpfs without touching installed dependencies.
ENV NPM_CONFIG_CACHE=/pkg-cache/npm \
    YARN_CACHE_FOLDER=/pkg-cache/yarn \
    YARN_GLOBAL_FOLDER=/pkg-cache/yarn \
    PNPM_CONFIG_STORE_DIR=/pkg-cache/pnpm/store \
    PNPM_CONFIG_CACHE_DIR=/pkg-cache/pnpm/cache

# Make pnpm use a flat, npm-style node_modules (the `hoisted` linker) instead of its
# default symlinked layout, so installed dependencies are plain copies with no symlinks.
ENV PNPM_CONFIG_NODE_LINKER=hoisted

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
	&& npm install --omit=dev --omit=optional --no-package-lock --prefer-online \
	&& echo "Installed NPM packages:" \
	&& (npm list --omit=dev --omit=optional || true) \
	&& echo "Node.js version:" \
	&& node --version \
	&& echo "NPM version:" \
	&& npm --version

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
