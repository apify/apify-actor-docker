#!/bin/bash

echo "Will run command: xvfb-run -a -s \"-ac -screen 0 $XVFB_WHD -nolisten tcp\" $@"
xvfb-run -a -s "-ac -screen 0 $XVFB_WHD -nolisten tcp" "$@"
