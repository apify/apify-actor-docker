#!/bin/bash
# See https://github.com/mark-adams/docker-chromium-xvfb/blob/master/images/base/xvfb-chromium

echo 1;
XVFB_WHD=${XVFB_WHD:-1280x720x16}
Xvfb :99 -ac -screen 0 $XVFB_WHD -nolisten tcp &
echo 2;
echo $XVFB_WHD;
export DISPLAY=:99
echo 3;

# execute invisible scripts :)
echo 'running your scripts';

node main.js
