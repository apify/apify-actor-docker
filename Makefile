# Environment values
# Node
NODE_VERSION ?= 22
# Tag must have format: v1.42.0-
PLAYWRIGHT_VERSION ?= v1.57.0-
CAMOUFOX_VERSION ?= 0.8.5
# Tag must have format: 22.6.2
PUPPETEER_VERSION ?= 22.6.2
PKG_JSON_PW_VERSION = $(subst v,,$(subst -,,$(PLAYWRIGHT_VERSION)))

# Python
PYTHON_VERSION ?= 3.14
PYTHON_PLAYWRIGHT_VERSION = $(subst v,,$(subst -,,$(PLAYWRIGHT_VERSION)))
PYTHON_SELENIUM_VERSION ?= 4.14.0
PYTHON_CAMOUFOX_VERSION ?= 0.4.11

ALL_TESTS = test-node test-node-playwright test-node-playwright-chrome test-node-playwright-firefox test-node-playwright-webkit test-node-playwright-camoufox test-node-puppeteer-chrome test-python test-python-playwright test-python-playwright-chrome test-python-playwright-firefox test-python-playwright-webkit test-python-playwright-camoufox test-python-selenium
ALL_NODE_TESTS = test-node test-node-playwright test-node-playwright-chrome test-node-playwright-firefox test-node-playwright-webkit test-node-playwright-camoufox test-node-puppeteer-chrome
ALL_PYTHON_TESTS = test-python test-python-playwright test-python-playwright-chrome test-python-playwright-firefox test-python-playwright-webkit test-python-playwright-camoufox test-python-selenium

# Helper function to copy Firefox certificates to an image folder
define copy-firefox-certs
	@if [ -f "./certificates/firefox-certificates.zip" ]; then \
		mkdir -p ./$(1)/firefox-certs; \
		unzip -q -o ./certificates/firefox-certificates.zip -d ./$(1)/firefox-certs; \
		echo "Extracted $$(ls -1 ./$(1)/firefox-certs/*.crt | wc -l) certificates to $(1)"; \
	else \
		mkdir -p ./$(1)/firefox-certs; \
		echo "No certificate archive found, created empty folder in $(1)"; \
	fi
endef

# Helper function to clean up Firefox certificates from an image folder
define cleanup-firefox-certs
	@rm -rf ./$(1)/firefox-certs
endef

what-tests:
	@echo "Available tests:"
	@for test in $(ALL_TESTS); do \
		echo "  $$test"; \
	done

download-certificates:
	@echo "Downloading Firefox intermediate certificates..."
	@chmod +x ./certificates/download-certificates.sh
	@./certificates/download-certificates.sh

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

test-node-playwright:
	@echo "Building node-playwright with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) node ./scripts/update-package-json.mjs ./node-playwright

	@# Copy Firefox certificates
	$(call copy-firefox-certs,node-playwright)

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --build-arg PLAYWRIGHT_VERSION=$(PLAYWRIGHT_VERSION) --file ./node-playwright/Dockerfile --tag apify/node-playwright:local --load ./node-playwright
	docker run --rm -it --platform linux/amd64 apify/node-playwright:local

	@# Restore package.json and cleanup certificates
	@git checkout ./node-playwright/package.json 1>/dev/null 2>&1
	$(call cleanup-firefox-certs,node-playwright)

	@# Delete docker image
	docker rmi apify/node-playwright:local

test-node-playwright-chrome:
	@echo "Building node-playwright-chrome with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) node ./scripts/update-package-json.mjs ./node-playwright-chrome

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-chrome/Dockerfile --tag apify/node-playwright-chrome:local --load ./node-playwright-chrome
	docker run --rm -it --platform linux/amd64 apify/node-playwright-chrome:local

	@# Restore package.json
	@git checkout ./node-playwright-chrome/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/node-playwright-chrome:local

test-node-playwright-firefox:
	@echo "Building node-playwright-firefox with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) node ./scripts/update-package-json.mjs ./node-playwright-firefox

	@# Copy Firefox certificates
	$(call copy-firefox-certs,node-playwright-firefox)

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-firefox/Dockerfile --tag apify/node-playwright-firefox:local --load ./node-playwright-firefox
	docker run --rm -it --platform linux/amd64 apify/node-playwright-firefox:local

	@# Restore package.json and cleanup certificates
	@git checkout ./node-playwright-firefox/package.json 1>/dev/null 2>&1
	$(call cleanup-firefox-certs,node-playwright-firefox)

	@# Delete docker image
	docker rmi apify/node-playwright-firefox:local

test-node-playwright-camoufox:
	@echo "Building node-playwright-camoufox with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-), Camoufox $(CAMOUFOX_VERSION) (overwrite using CAMOUFOX_VERSION=0.3.5) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) CAMOUFOX_VERSION=$(CAMOUFOX_VERSION) node ./scripts/update-package-json.mjs ./node-playwright-camoufox

	@# Copy Firefox certificates
	$(call copy-firefox-certs,node-playwright-camoufox)

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-camoufox/Dockerfile --tag apify/node-playwright-camoufox:local --load ./node-playwright-camoufox
	docker run --rm -it --platform linux/amd64 apify/node-playwright-camoufox:local

	@# Restore package.json and cleanup certificates
	@git checkout ./node-playwright-camoufox/package.json 1>/dev/null 2>&1
	$(call cleanup-firefox-certs,node-playwright-camoufox)

	@# Delete docker image
	docker rmi apify/node-playwright-camoufox:local

test-node-playwright-webkit:
	@echo "Building node-playwright-webkit with version $(PLAYWRIGHT_VERSION) (overwrite using PLAYWRIGHT_VERSION=v1.42.0-) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PLAYWRIGHT_VERSION=$(PKG_JSON_PW_VERSION) node ./scripts/update-package-json.mjs ./node-playwright-webkit

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-playwright-webkit/Dockerfile --tag apify/node-playwright-webkit:local --load ./node-playwright-webkit
	docker run --rm -it --platform linux/amd64 apify/node-playwright-webkit:local

	@# Restore package.json
	@git checkout ./node-playwright-webkit/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/node-playwright-webkit:local

test-node-puppeteer-chrome:
	@echo "Building node-puppeteer-chrome with version $(PUPPETEER_VERSION) (overwrite using PUPPETEER_VERSION=22.6.2) and node version $(NODE_VERSION) (overwrite using NODE_VERSION=XX)"

	@# Correct package.json
	@APIFY_VERSION=latest CRAWLEE_VERSION=latest PUPPETEER_VERSION=$(PUPPETEER_VERSION) node ./scripts/update-package-json.mjs ./node-puppeteer-chrome

	docker buildx build --platform linux/amd64 --build-arg NODE_VERSION=$(NODE_VERSION) --file ./node-puppeteer-chrome/Dockerfile --tag apify/node-puppeteer-chrome:local --load ./node-puppeteer-chrome
	docker run --rm -it --platform linux/amd64 apify/node-puppeteer-chrome:local

	@# Restore package.json
	@git checkout ./node-puppeteer-chrome/package.json 1>/dev/null 2>&1

	@# Delete docker image
	docker rmi apify/node-puppeteer-chrome:local

test-python:
	@echo "Building python with version $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX)"

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --file ./python/Dockerfile --tag apify/python:local --load ./python
	docker run --rm -it --platform linux/amd64 apify/python:local

	@# Delete docker image
	docker rmi apify/python:local

test-python-playwright:
	@echo "Building python-playwright with version $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX)"

	@# Copy Firefox certificates
	$(call copy-firefox-certs,python-playwright)

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --build-arg PLAYWRIGHT_VERSION=$(PYTHON_PLAYWRIGHT_VERSION) --file ./python-playwright/Dockerfile --tag apify/python-playwright:local --load ./python-playwright
	docker run --rm -it --platform linux/amd64 apify/python-playwright:local

	@# Cleanup certificates
	$(call cleanup-firefox-certs,python-playwright)

	@# Delete docker image
	docker rmi apify/python-playwright:local

test-python-playwright-chrome:
	@echo "Building python-playwright-chrome with Python $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX) and Playwright $(PYTHON_PLAYWRIGHT_VERSION)"

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --build-arg PLAYWRIGHT_VERSION=$(PYTHON_PLAYWRIGHT_VERSION) --file ./python-playwright-chrome/Dockerfile --tag apify/python-playwright-chrome:local --load ./python-playwright-chrome
	docker run --rm -it --platform linux/amd64 apify/python-playwright-chrome:local

	@# Delete docker image
	docker rmi apify/python-playwright-chrome:local

test-python-playwright-firefox:
	@echo "Building python-playwright-firefox with Python $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX) and Playwright $(PYTHON_PLAYWRIGHT_VERSION)"

	@# Copy Firefox certificates
	$(call copy-firefox-certs,python-playwright-firefox)

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --build-arg PLAYWRIGHT_VERSION=$(PYTHON_PLAYWRIGHT_VERSION) --file ./python-playwright-firefox/Dockerfile --tag apify/python-playwright-firefox:local --load ./python-playwright-firefox
	docker run --rm -it --platform linux/amd64 apify/python-playwright-firefox:local

	@# Cleanup certificates
	$(call cleanup-firefox-certs,python-playwright-firefox)

	@# Delete docker image
	docker rmi apify/python-playwright-firefox:local

test-python-playwright-webkit:
	@echo "Building python-playwright-webkit with Python $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX) and Playwright $(PYTHON_PLAYWRIGHT_VERSION)"

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --build-arg PLAYWRIGHT_VERSION=$(PYTHON_PLAYWRIGHT_VERSION) --file ./python-playwright-webkit/Dockerfile --tag apify/python-playwright-webkit:local --load ./python-playwright-webkit
	docker run --rm -it --platform linux/amd64 apify/python-playwright-webkit:local

	@# Delete docker image
	docker rmi apify/python-playwright-webkit:local

test-python-playwright-camoufox:
	@echo "Building python-playwright-camoufox with Python $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX), Playwright $(PYTHON_PLAYWRIGHT_VERSION) and Camoufox $(PYTHON_CAMOUFOX_VERSION)"

	@# Copy Firefox certificates
	$(call copy-firefox-certs,python-playwright-camoufox)

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --build-arg PLAYWRIGHT_VERSION=$(PYTHON_PLAYWRIGHT_VERSION) --build-arg CAMOUFOX_VERSION=$(PYTHON_CAMOUFOX_VERSION) --file ./python-playwright-camoufox/Dockerfile --tag apify/python-playwright-camoufox:local --load ./python-playwright-camoufox
	docker run --rm -it --platform linux/amd64 apify/python-playwright-camoufox:local

	@# Cleanup certificates
	$(call cleanup-firefox-certs,python-playwright-camoufox)

	@# Delete docker image
	docker rmi apify/python-playwright-camoufox:local

test-python-selenium:
	@echo "Building python-selenium with version $(PYTHON_VERSION) (overwrite using PYTHON_VERSION=XX)"

	docker buildx build --platform linux/amd64 --build-arg PYTHON_VERSION=$(PYTHON_VERSION) --build-arg SELENIUM_VERSION=$(PYTHON_SELENIUM_VERSION) --file ./python-selenium/Dockerfile --tag apify/python-selenium:local --load ./python-selenium
	docker run --rm -it --platform linux/amd64 apify/python-selenium:local

	@# Delete docker image
	docker rmi apify/python-selenium:local
