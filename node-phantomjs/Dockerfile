FROM node:10-slim

# First, download PhantomJS and necessary libraries, these change rarely
RUN wget --no-verbose -O /usr/bin/phantomjs https://s3.amazonaws.com/apifier-phantomjs-builds/phantomjs-2.1.1s-apifier-ubuntu-16.04-x64 \
 && wget --no-verbose -O /lib/x86_64-linux-gnu/libicudata.so.55.1 https://s3.amazonaws.com/apifier-phantomjs-builds/libicudata.so.55.1 \
 && wget --no-verbose -O /lib/x86_64-linux-gnu/libicui18n.so.55.1 https://s3.amazonaws.com/apifier-phantomjs-builds/libicui18n.so.55.1 \
 && wget --no-verbose -O /lib/x86_64-linux-gnu/libicuuc.so.55.1 https://s3.amazonaws.com/apifier-phantomjs-builds/libicuuc.so.55.1 \
 && wget --no-verbose -O /lib/x86_64-linux-gnu/libssl.so.1.0.0 https://s3.amazonaws.com/apifier-phantomjs-builds/libssl.so.1.0.0 \
 && wget --no-verbose -O /lib/x86_64-linux-gnu/libcrypto.so.1.0.0 https://s3.amazonaws.com/apifier-phantomjs-builds/libcrypto.so.1.0.0 \
 && ln -s /lib/x86_64-linux-gnu/libicudata.so.55.1 /lib/x86_64-linux-gnu/libicudata.so.55 \
 && ln -s /lib/x86_64-linux-gnu/libicui18n.so.55.1 /lib/x86_64-linux-gnu/libicui18n.so.55 \
 && ln -s /lib/x86_64-linux-gnu/libicuuc.so.55.1 /lib/x86_64-linux-gnu/libicuuc.so.55 \
 && chmod a+x /usr/bin/phantomjs \
 && chown root:root /usr/bin/phantomjs

# Install packages
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y libfreetype6 libfontconfig1 procps --no-install-recommends \
 && rm -rf /var/lib/apt/lists/* \
 && rm -rf /src/*.deb \
 && rm -rf /opt/yarn /usr/local/bin/yarn /usr/local/bin/yarnpkg

# Run everything after as non-privileged user to avoid warnings
RUN groupadd -r myuser && useradd -r -g myuser -G audio,video myuser \
    && mkdir -p /home/myuser/Downloads \
    && chown -R myuser:myuser /home/myuser
USER myuser
WORKDIR /home/myuser

# Copy source code
COPY --chown=myuser:myuser test.js /home/myuser/

# Tell Node.js this is a production environemnt
ENV NODE_ENV=production

# Enable Node.js process to use a lot of memory
ENV NODE_OPTIONS="--max_old_space_size=16000"

# Install default dependencies, print versions of everything
RUN echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

# We're using CMD instead of ENTRYPOINT, to allow manual overriding
CMD node test.js
