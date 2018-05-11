#!/bin/bash

echo "Starting X virtual framebuffer using: Xvfb $DISPLAY -ac -screen 0 $XVFB_WHD -nolisten tcp"
Xvfb $DISPLAY -ac -screen 0 $XVFB_WHD -nolisten tcp &

# Execute CMD (original CMD of this Dockerfile gets overriden in Actor build)
echo "Executing main command"
exec "$@"