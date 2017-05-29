#!/bin/bash

# Note: Uncomment if you don't want to use Headless Chrome.
# export DISPLAY=:1

# TMP_PROFILE_DIR=$(mktemp -d -t lighthouse.XXXXXXXXXX)

# Note: Uncomment if you don't want to use Headless Chrome.
# /etc/init.d/dbus start
# /etc/init.d/xvfb start
# sleep 1s

su chromeuser /usr/src/app/chromeuser-script.sh
# sleep 3s

# wait for Chrome to start using workaround described at https://bugs.chromium.org/p/chromium/issues/detail?id=624837#c4

node /usr/src/app/main.js