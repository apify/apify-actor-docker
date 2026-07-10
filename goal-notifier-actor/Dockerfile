# Base image maintained in this repo (apify/apify-actor-docker).
FROM apify/actor-node:22

# Copy just the manifests first so the npm install layer is cached
# unless dependencies actually change.
COPY package*.json ./

RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed npm packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "npm version:" \
    && npm --version

# Copy the rest of the source.
COPY . ./

CMD ["npm", "start", "--silent"]
