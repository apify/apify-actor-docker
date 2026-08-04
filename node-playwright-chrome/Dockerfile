# Get the Node.js version provided as a build argument
ARG NODE_VERSION=

# Use trixie to be consistent across node versions.
FROM --platform=linux/amd64 node:${NODE_VERSION}-trixie-slim

# Playwright version is passed in the format `v1.57.0-` (matching the tag
# format used by the full node-playwright image). Stripped below before
# being passed to npx.
ARG PLAYWRIGHT_VERSION=

LABEL maintainer="support@apify.com" \
    description="Base image for Apify Actors written in Node.js using Playwright with only Chrome/Chromium"

ENV DEBIAN_FRONTEND=noninteractive

# Set the shell to use /bin/bash with specific options (see Hadolint DL4006)
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Set up XVFB
ENV XVFB_WHD=1920x1080x24+32

# Tells playwright where to install and where to find the browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/pw-browsers

# Tell the crawlee cli that we already have browsers installed, so it skips installing them
ENV CRAWLEE_SKIP_BROWSER_INSTALL=1

# Sets path to Chrome executable, this is used by Apify.launchPuppeteer()
ENV APIFY_CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome

ENV APIFY_DEFAULT_BROWSER_PATH=${PLAYWRIGHT_BROWSERS_PATH}/chrome

# Prevent installing of browsers by future `npm install`.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN apt update \
    && apt install --fix-missing -yq --no-install-recommends \
    # Install xvfb, xauth, wget, curl, git
    xvfb xauth wget curl git \
    ca-certificates \
    # Found this in other images, not sure whether it's needed, it does not come from Playwright deps
    procps \
    # Packages for Google signing key
    gnupg unzip \
    # Add Google Linux signing key
    && wget -qO- https://dl-ssl.google.com/linux/linux_signing_key.pub \
        | gpg --dearmor \
        | tee /usr/share/keyrings/google-linux-signing.gpg > /dev/null \
    # Add Google Chrome APT repo
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && apt update \
    && apt install -y --no-install-recommends \
    # Install Google Chrome
    google-chrome-stable \
    # Extras
    fonts-freefont-ttf \
    fonts-kacst-one \
    fonts-thai-tlwg \
    fonts-wqy-zenhei \
    \
    # Install playwright browser dependencies and browsers for chrome
    && _PW_VERSION="${PLAYWRIGHT_VERSION#v}" && _PW_VERSION="${_PW_VERSION%-}" \
    && npx playwright@${_PW_VERSION} install-deps chrome \
    && npx playwright@${_PW_VERSION} install chrome \
    && npx playwright@${_PW_VERSION} install chromium \
    # symlink the chromium binary to the root folder in order to bypass the versioning and resulting browser launch crashes.
    && ln -s ${PLAYWRIGHT_BROWSERS_PATH}/chromium-*/chrome-linux*/chrome ${PLAYWRIGHT_BROWSERS_PATH}/ \
    \
    # Disable chrome auto updates, based on https://support.google.com/chrome/a/answer/9052345
    && mkdir -p /etc/default && echo 'repo_add_once=false' > /etc/default/google-chrome \
    && mkdir -p /etc/opt/chrome/policies/managed \
    && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json \
    && echo '{ "ComponentUpdatesEnabled": false }' > /etc/opt/chrome/policies/managed/component_update.json \
    \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    \
    # Globally disable the update-notifier.
    && npm config --global set update-notifier false \
    \
    # Install the latest Corepack so Actors can opt into yarn or pnpm; `enable` drops the shims into
    # the global bin. --force: some base images (mcr playwright) already ship a yarn binary, which
    # npm otherwise refuses to overwrite with corepack's yarn shim.
    && npm install -g --force corepack@latest \
    && corepack enable \
    # Make pnpm >= 11 the version corepack provisions by default: pnpm 10 ignores the
    # PNPM_CONFIG_* env vars set below, so its store and cache would land in $HOME instead
    # of /pkg-cache. COREPACK_HOME is passed inline because its ENV is declared further down.
    && COREPACK_HOME=/pkg-cache/corepack corepack install -g pnpm@latest \
    # pnpm 10 ignores the PNPM_CONFIG_* env vars set further down (they are pnpm >= 11 only),
    # and npm >= 11 warns on the equivalent npmrc keys / NPM_CONFIG_* vars, so mirror the
    # settings into pnpm's own global rc files, which only pnpm reads. This makes Actors that
    # pin pnpm@10 via `packageManager` resolve to /pkg-cache too.
    && mkdir -p /root/.config/pnpm /home/myuser/.config/pnpm \
    && printf 'store-dir=/pkg-cache/pnpm/store\ncache-dir=/pkg-cache/pnpm/cache\nnode-linker=hoisted\n' > /root/.config/pnpm/rc \
    && cp /root/.config/pnpm/rc /home/myuser/.config/pnpm/rc \
    && chown -R myuser:myuser /home/myuser/.config \
    \
    # Pre-create the shared package-manager cache dirs (see the *_CACHE_*/*_STORE_DIR env vars), world-writable so any
    # user can populate them and `rm -rf` them at the end to reclaim space, regardless of which user the Actor runs as.
    && mkdir -p /pkg-cache/npm /pkg-cache/yarn /pkg-cache/pnpm/store /pkg-cache/pnpm/cache \
    && chmod -R 777 /pkg-cache \
    \
    # Cleanup time
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    && apt clean -y && apt autoremove -y \
    # This is needed to remove an annoying error message when running headful.
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix \
    \
    # Point the default per-user npm cache dirs (~/.npm) at the shared cache, so tooling
    # that bypasses NPM_CONFIG_CACHE - and templates that `rm -r ~/.npm` - keep working.
    && rm -rf /root/.npm /home/myuser/.npm \
    && ln -s /pkg-cache/npm /root/.npm \
    && ln -s /pkg-cache/npm /home/myuser/.npm

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Copy source code and xvfb script
COPY --chown=myuser:myuser package.json main.js check-playwright-version.mjs chrome_test.js start_xvfb_and_run_cmd.sh new_xvfb_run_cmd.sh xvfb-entrypoint.sh /home/myuser/

# Tell Node.js this is a production environment
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory (Actor has limit of 32GB)
# Increases default size of headers. The original limit was 80kb, but from node 10+ they decided to lower it to 8kb.
# However they did not think about all the sites there with large headers,
# so we put back the old limit of 80kb, which seems to work just fine.
ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

# Send every package-manager cache to a single, dedicated location instead of $HOME.
# npm, yarn, and pnpm have no real "disable the cache" switch (unlike pip), so isolating
# their caches under /pkg-cache is the practical equivalent: the tree holds only throwaway
# cache data and can be wiped or mounted as tmpfs without touching installed dependencies.
# COREPACK_HOME holds the package-manager versions corepack provisions on demand.
# NOTE: only pnpm >= 11 reads the PNPM_CONFIG_* vars; pnpm 10 picks up the same settings
# from the global pnpm rc files written to /root/.config/pnpm and /home/myuser/.config/pnpm.
ENV NPM_CONFIG_CACHE=/pkg-cache/npm \
    YARN_CACHE_FOLDER=/pkg-cache/yarn \
    YARN_GLOBAL_FOLDER=/pkg-cache/yarn \
    PNPM_CONFIG_STORE_DIR=/pkg-cache/pnpm/store \
    PNPM_CONFIG_CACHE_DIR=/pkg-cache/pnpm/cache \
    COREPACK_HOME=/pkg-cache/corepack

# Make pnpm and yarn use a flat, npm-style node_modules instead of their non-node_modules
# defaults (pnpm's symlinked store, yarn Berry's Plug'n'Play), so installed dependencies are
# plain copies that any tooling can resolve without symlinks or a PnP loader.
ENV PNPM_CONFIG_NODE_LINKER=hoisted \
    YARN_NODE_LINKER=node-modules

# Install default dependencies, print versions of everything
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional --no-package-lock --prefer-online \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --omit=optional || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && echo "Google Chrome version:" \
    && bash -c "$APIFY_CHROME_EXECUTABLE_PATH --version" \
    # Playwright allows downloading only one browser through separate package with same export. So we rename it to just playwright.
    && mv ./node_modules/playwright-chromium ./node_modules/playwright && rm -rf ./node_modules/playwright-chromium

# The entrypoint script will be the one handling the CMD passed in, and will always wrap it into xvfb-run
ENTRYPOINT ["/home/myuser/xvfb-entrypoint.sh"]

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ["npm", "start", "--silent"]
