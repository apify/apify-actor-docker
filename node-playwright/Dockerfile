ARG PLAYWRIGHT_VERSION=
FROM --platform=linux/amd64 mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}jammy

ARG NODE_VERSION=20

LABEL maintainer="support@apify.com" description="Base image for Apify Actors using headless Chrome"
ENV DEBIAN_FRONTEND=noninteractive

# Copy the script for registering intermediate certificates.
COPY ./register_intermediate_certs.sh ./register_intermediate_certs.sh

# Install libs
RUN apt update \
    && apt install --fix-missing -yq --no-install-recommends procps xvfb xauth wget \
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix \
    # Uninstall system NodeJs
    && apt purge -yq nodejs \
    # Install node
    && apt update && apt install -y curl \
    && curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt install -y nodejs \
    # The following packages are needed for the intermediate certificates to work in Firefox.
    ca-certificates \
    jq \
    wget \
    p11-kit \
    # Register cerificates
    && chmod +x ./register_intermediate_certs.sh \
    && ./register_intermediate_certs.sh \
    # Disable chrome auto updates, based on https://support.google.com/chrome/a/answer/9052345
    && mkdir -p /etc/default && echo 'repo_add_once=false' > /etc/default/google-chrome \
    # Install chrome
    && wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -nv \
    && apt install --fix-missing -yq ./google-chrome-stable_current_amd64.deb && rm ./google-chrome-stable_current_amd64.deb \
    \
    # Add user so we don't need --no-sandbox.
    && groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser \
    \
    && mkdir -p /etc/opt/chrome/policies/managed \
    && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json \
    && echo '{ "ComponentUpdatesEnabled": false }' > /etc/opt/chrome/policies/managed/component_update.json \
    \
    # Globally disable the update-notifier.
    && npm config --global set update-notifier false \
    \
    # Final cleanup
    # Cleanup time
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb \
    && apt clean -y && apt autoremove -y \
    && rm -rf /root/.npm \
    # This is needed to remove an annoying error message when running headful.
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Point playwright to the preincluded browsers - moving browsers around increases the image size a *lot*
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Tell the crawlee cli that we already have browers installed, so it skips installing them
ENV CRAWLEE_SKIP_BROWSER_INSTALL=1

# Copy source code and xvfb script
COPY --chown=myuser:myuser package.json main.js chrome_test.js start_xvfb_and_run_cmd.sh new_xvfb_run_cmd.sh /home/myuser/

# Sets path to Chrome executable, this is used by Apify.launchPuppeteer()
ENV APIFY_CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory (Actor has limit of 32GB)
# Increases default size of headers. The original limit was 80kb, but from node 10+ they decided to lower it to 8kb.
# However they did not think about all the sites there with large headers,
# so we put back the old limit of 80kb, which seems to work just fine.
ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

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
    # Overrides the dynamic library used by Firefox to determine trusted root certificates with p11-kit-trust.so, which loads the system certificates.
    && rm -f $PLAYWRIGHT_BROWSERS_PATH/firefox-*/firefox/libnssckbi.so \
    && ln -s /usr/lib/x86_64-linux-gnu/pkcs11/p11-kit-trust.so $(ls -d $PLAYWRIGHT_BROWSERS_PATH/firefox-*)/firefox/libnssckbi.so

# Set up xvfb
ENV XVFB_WHD=1920x1080x24+32

# The entrypoint script will be the one handling the CMD passed in, and will always wrap it into xvfb-run
ENTRYPOINT ["/home/myuser/new_xvfb_run_cmd.sh"]

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD ["npm", "start", "--silent"]
