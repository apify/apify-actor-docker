#!/usr/bin/env bash

# fail on any error
set -ex

./publish_beta_as_latest.sh node-basic
./publish_beta_as_latest.sh node-chrome
./publish_beta_as_latest.sh node-chrome-xvfb
./publish_beta_as_latest.sh node-puppeteer
