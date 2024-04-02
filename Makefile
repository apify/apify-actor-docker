# Environment values
NODE_VERSION ?= 20
# Tag must have format: v1.42.0-
PLAYWRIGHT_VERSION ?= v1.42.0-
# Tag must have format: 22.6.2
PUPPETEER_VERSION ?= 22.6.2

ALL_TESTS = test-node test-playwright test-playwright-chrome test-playwright-firefox test-playwright-webkit test-puppeteer-chrome

all:
	@echo "Running all tests, this will take a while..."

	@for test in $(ALL_TESTS); do \
		echo "Running $$test"; \
		$(MAKE) $$test; \
		echo "Done $$test"; \
	done

	@echo ""
	@echo "All tests done!"

test-node:
	@echo "Building node with version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@jq '.dependencies.apify = "latest" | .dependencies.crawlee = "latest"' ./node/package.json > ./node/package.json.tmp && mv ./node/package.json.tmp ./node/package.json

	docker buildx build --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node/Dockerfile -t apify/node:local --load ./node
	docker run --rm -it --platform linux/amd64 apify/node:local

	@# Restore package.json
	@git checkout ./node/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/node:local

test-playwright:
	@echo "Building playwright with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@export PKG_JSON_PW_VERSION=$(echo ${PLAYWRIGHT_VERSION} | cut -c 2- | rev | cut -c 2- | rev)
	@jq ".dependencies.apify = \"latest\" | .dependencies.crawlee = \"latest\" | .dependencies.playwright = \"${PKG_JSON_PW_VERSION}\"" ./node-playwright/package.json > ./node-playwright/package.json.tmp && mv ./node-playwright/package.json.tmp ./node-playwright/package.json

	docker buildx build --build-arg NODE_VERSION=$(NODE_VERSION) --build-arg PLAYWRIGHT_VERSION=$(PLAYWRIGHT_VERSION) --file ./node-playwright/Dockerfile --tag apify/playwright:local --load ./node-playwright
	docker run --rm -it --platform linux/amd64 apify/playwright:local

	@# Restore package.json
	@git checkout ./node-playwright/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/playwright:local

test-playwright-chrome:
	@echo "Building playwright-chrome with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@export PKG_JSON_PW_VERSION=$(echo ${PLAYWRIGHT_VERSION} | cut -c 2- | rev | cut -c 2- | rev)
	@jq ".dependencies.apify = \"latest\" | .dependencies.crawlee = \"latest\" | .dependencies.\"playwright-chromium\" = \"${PKG_JSON_PW_VERSION}\"" ./node-playwright-chrome/package.json > ./node-playwright-chrome/package.json.tmp && mv ./node-playwright-chrome/package.json.tmp ./node-playwright-chrome/package.json

	docker buildx build --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-chrome/Dockerfile --tag apify/playwright-chrome:local --load ./node-playwright-chrome
	docker run --rm -it --platform linux/amd64 apify/playwright-chrome:local

	@# Restore package.json
	@git checkout ./node-playwright-chrome/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/playwright-chrome:local


test-playwright-firefox:
	@echo "Building playwright-firefox with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@export PKG_JSON_PW_VERSION=$(echo ${PLAYWRIGHT_VERSION} | cut -c 2- | rev | cut -c 2- | rev)
	@jq ".dependencies.apify = \"latest\" | .dependencies.crawlee = \"latest\" | .dependencies.\"playwright-firefox\" = \"${PKG_JSON_PW_VERSION}\"" ./node-playwright-firefox/package.json > ./node-playwright-firefox/package.json.tmp && mv ./node-playwright-firefox/package.json.tmp ./node-playwright-firefox/package.json

	docker buildx build --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-firefox/Dockerfile --tag apify/playwright-firefox:local --load ./node-playwright-firefox
	docker run --rm -it --platform linux/amd64 apify/playwright-firefox:local

	@# Restore package.json
	@git checkout ./node-playwright-firefox/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/playwright-firefox:local

test-playwright-webkit:
	@echo "Building playwright-webkit with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@export PKG_JSON_PW_VERSION=$(echo ${PLAYWRIGHT_VERSION} | cut -c 2- | rev | cut -c 2- | rev)
	@jq ".dependencies.apify = \"latest\" | .dependencies.crawlee = \"latest\" | .dependencies.\"playwright-webkit\" = \"${PKG_JSON_PW_VERSION}\"" ./node-playwright-webkit/package.json > ./node-playwright-webkit/package.json.tmp && mv ./node-playwright-webkit/package.json.tmp ./node-playwright-webkit/package.json

	docker buildx build --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-webkit/Dockerfile --tag apify/playwright-webkit:local --load ./node-playwright-webkit
	docker run --rm -it --platform linux/amd64 apify/playwright-webkit:local

	@# Restore package.json
	@git checkout ./node-playwright-webkit/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/playwright-webkit:local

test-puppeteer-chrome:
	@echo "Building puppeteer-chrome with version $(PUPPETEER_VERSION) (overwrite using PUPPETEER_VERSION=22.6.2) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@jq ".dependencies.apify = \"latest\" | .dependencies.crawlee = \"latest\" | .dependencies.puppeteer = \"${PUPPETEER_VERSION}\"" ./node-puppeteer-chrome/package.json > ./node-puppeteer-chrome/package.json.tmp && mv ./node-puppeteer-chrome/package.json.tmp ./node-puppeteer-chrome/package.json

	docker buildx build --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-puppeteer-chrome/Dockerfile --tag apify/puppeteer-chrome:local --load ./node-puppeteer-chrome
	docker run --rm -it --platform linux/amd64 apify/puppeteer-chrome:local

	@# Restore package.json
	@git checkout ./node-puppeteer-chrome/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/puppeteer-chrome:local

# TODO: python too
