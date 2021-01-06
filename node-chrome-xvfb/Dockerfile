ARG TAG=latest
FROM apify/actor-node-chrome:$TAG

# Run everything after as non-privileged user.
USER myuser
WORKDIR /home/myuser

# Set up xvfb
ENV XVFB_WHD=1920x1080x16
ENV APIFY_XVFB=1

# NOTEs:
# - This needs to be compatible with CLI.
# - Using CMD instead of ENTRYPOINT, to allow manual overriding
CMD xvfb-run npm start --silent

