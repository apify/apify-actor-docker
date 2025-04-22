#!/bin/bash

# xvfb-run -a -s "-ac -screen 0 $XVFB_WHD -nolisten tcp" npm start --silent

echo "Will run command: xvfb-run -a -s \"-ac -screen 0 $XVFB_WHD -nolisten tcp\" $@"
xvfb-run -a -s "-ac -screen 0 $XVFB_WHD -nolisten tcp" "$@"
