# Environment values
# Node
NODE_VERSION ?= 20
# Tag must have format: v1.42.0-
PLAYWRIGHT_VERSION ?= v1.50.0-
CAMOUFOX_VERSION ?= 0.3.5
# Tag must have format: 22.6.2
PUPPETEER_VERSION ?= 22.6.2
PKG_JSON_PW_VERSION = $(subst v,,$(subst -,,$(PLAYWRIGHT_VERSION)))

# Python
PYTHON_VERSION ?= 3.13
# Apify latest version (python does not support the 'latest' tag)
PYTHON_APIFY_VERSION ?= 1.7.0
PYTHON_PLAYWRIGHT_VERSION = $(subst v,,$(subst -,,$(PLAYWRIGHT_VERSION)))
PYTHON_SELENIUM_VERSION ?= 4.14.0

ALL_TESTS = test-node test-playwright test-playwright-chrome test-playwright-firefox test-playwright-webkit test-puppeteer-chrome test-python test-python-playwright test-python-selenium test-playwright-camoufox
ALL_NODE_TESTS = test-node test-playwright test-playwright-chrome test-playwright-firefox test-playwright-webkit test-puppeteer-chrome test-playwright-camoufox
ALL_PYTHON_TESTS = test-python test-python-playwright test-python-selenium

what-tests:
	@echo "Available tests:"
	@for test in $(ALL_TESTS); do \
		echo "  $$test"; \
	done

all:
	@echo "Running all tests, this will take a while..."

	@for test in $(ALL_TESTS); do \
		echo "Running $$test"; \
		$(MAKE) $$test; \
		echo "Done $$test"; \
	done

	@echo ""
	@echo "All tests done!"

all-node:
	@echo "Running all node tests, this will take a while..."

	@for test in $(ALL_NODE_TESTS); do \
		echo "Running $$test"; \
		$(MAKE) $$test; \
		echo "Done $$test"; \
	done

	@echo ""
	@echo "All node tests done!"

all-python:
	@echo "Running all python tests, this will take a while..."

	@for test in $(ALL_PYTHON_TESTS); do \
		echo "Running $$test"; \
		$(MAKE) $$test; \
		echo "Done $$test"; \
	done

	@echo ""
	@echo "All python tests done!"

test-node:
	@echo "Building node with version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest node ./scripts/update-package-json.mjs ./node

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node/Dockerfile -t apify/node:local --load ./node
	docker run --rm -it --platform linux/amd64 apify/node:local

	@# Restore package.json
	@git checkout ./node/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/node:local

test-playwright:
	@echo "Building playwright with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) node ./scripts/update-package-json.mjs ./node-playwright

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --build-arg PLAYWRIGHT_VERSION=$(PLAYWRIGHT_VERSION) --file ./node-playwright/Dockerfile --tag apify/playwright:local --load ./node-playwright
	docker run --rm -it --platform linux/amd64 apify/playwright:local

	@# Restore package.json
	@git checkout ./node-playwright/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/playwright:local

test-playwright-chrome:
	@echo "Building playwright-chrome with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) node ./scripts/update-package-json.mjs ./node-playwright-chrome

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-chrome/Dockerfile --tag apify/playwright-chrome:local --load ./node-playwright-chrome
	docker run --rm -it --platform linux/amd64 apify/playwright-chrome:local

	@# Restore package.json
	@git checkout ./node-playwright-chrome/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/playwright-chrome:local


test-playwright-firefox:
	@echo "Building playwright-firefox with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) node ./scripts/update-package-json.mjs ./node-playwright-firefox

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-firefox/Dockerfile --tag apify/playwright-firefox:local --load ./node-playwright-firefox
	docker run --rm -it --platform linux/amd64 apify/playwright-firefox:local

	@# Restore package.json
	@git checkout ./node-playwright-firefox/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/playwright-firefox:local

test-playwright-camoufox:
	@echo "Building playwright-camoufox with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-), Camoufox $(CAMOUFOX_VERSION) (overwrite using CAMOUFOX_VERSION=0.3.5) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) CAMOUFOX_VERSION=$(CAMOUFOX_VERSION) node ./scripts/update-package-json.mjs ./node-playwright-camoufox

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-camoufox/Dockerfile --tag apify/playwright-camoufox:local --load ./node-playwright-camoufox
	docker run --rm -it --platform linux/amd64 apify/playwright-camoufox:local

	@# Restore package.json
	@git checkout ./node-playwright-camoufox/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/playwright-camoufox:local

test-playwright-webkit:
	@echo "Building playwright-webkit with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) node ./scripts/update-package-json.mjs ./node-playwright-webkit

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-webkit/Dockerfile --tag apify/playwright-webkit:local --load ./node-playwright-webkit
	docker run --rm -it --platform linux/amd64 apify/playwright-webkit:local

	@# Restore package.json
	@git checkout ./node-playwright-webkit/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/playwright-webkit:local

test-puppeteer-chrome:
	@echo "Building puppeteer-chrome with version $(PUPPETEER_VERSION) (overwrite using PUPPETEER_VERSION=22.6.2) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PUPPETEER_VERSION=$(PUPPETEER_VERSION) node ./scripts/update-package-json.mjs ./node-puppeteer-chrome

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-puppeteer-chrome/Dockerfile --tag apify/puppeteer-chrome:local --load ./node-puppeteer-chrome
	docker run --rm -it --platform linux/amd64 apify/puppeteer-chrome:local

	@# Restore package.json
	@git checkout ./node-puppeteer-chrome/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/puppeteer-chrome:local

test-python:
	@echo "Building python with version $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX)"

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --build-arg APIFY_VERSION=$(PYTHON_APIFY_VERSION) --file ./python/Dockerfile --tag apify/python:local --load ./python
	docker run --rm -it --platform linux/amd64 apify/python:local

	@# Delete docker image
	docker rmi apify/python:local

test-python-playwright:
	@echo "Building python-playwright with version $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX)"

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --build-arg APIFY_VERSION=$(PYTHON_APIFY_VERSION) --build-arg PLAYWRIGHT_VERSION=$(PYTHON_PLAYWRIGHT_VERSION) --file ./python-playwright/Dockerfile --tag apify/python-playwright:local --load ./python-playwright
	docker run --rm -it --platform linux/amd64 apify/python-playwright:local

	@# Delete docker image
	docker rmi apify/python-playwright:local

test-python-selenium:
	@echo "Building python-selenium with version $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX)"

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --build-arg APIFY_VERSION=$(PYTHON_APIFY_VERSION) --build-arg SELENIUM_VERSION=$(PYTHON_SELENIUM_VERSION) --file ./python-selenium/Dockerfile --tag apify/python-selenium:local --load ./python-selenium
	docker run --rm -it --platform linux/amd64 apify/python-selenium:local

	@# Delete docker image
	docker rmi apify/python-selenium:local

