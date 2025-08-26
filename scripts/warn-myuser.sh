#!/bin/sh

IN_PYTHON_IMAGE=false
if [ "$1" = "python" ]; then
    IN_PYTHON_IMAGE=true
fi

IN_NODE_IMAGE=false
if [ "$1" = "node" ]; then
    IN_NODE_IMAGE=true
fi

if [ "$IN_PYTHON_IMAGE" = true ]; then
    cat <<EOF
This Docker image is now being ran as the user 'myuser', and with the WORKDIR set to '/home/myuser'.

You might encounter issues depending on what package manager you are using, or if you need to install some dependencies as root.

If you encounter any issues because of this, you may need to do some changes in your Dockerfile.
Please refer to the following documentation for how to solve common issues: https://docs.apify.com/platform/actors/development/actor-definition/dockerfile#updating-older-dockerfiles
EOF

    exit 0
fi

if [ "$IN_NODE_IMAGE" = true ]; then
    cat <<EOF
The base node image is now being ran as the user 'myuser', and with the WORKDIR set to '/home/myuser'.

If you encounter any issues because of this, you may need to do some changes in your Dockerfile.
Please refer to the following documentation for how to solve common issues: https://docs.apify.com/platform/actors/development/actor-definition/dockerfile#updating-older-dockerfiles
EOF

    exit 0
fi
