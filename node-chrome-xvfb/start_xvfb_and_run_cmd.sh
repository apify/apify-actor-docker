#!/bin/bash

echo "Starting xvfb frame buffer"
Xvfb $DISPLAY -ac -screen 0 $XVFB_WHD -nolisten tcp &

# Execute CMD (original CMD of this Dockerfile gets overriden in Actor build)
echo "Executing Docker CMD"
exec "$@"