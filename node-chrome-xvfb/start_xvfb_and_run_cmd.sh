#!/bin/bash

echo "Starting xvfb frame buffer"
Xvfb :99 -ac -screen 0 1280x720x16 -nolisten tcp &

# Execute CMD (original CMD of this Dockerfile gets overriden in Actor build)
echo "Executing Docker CMD"
exec "$@"