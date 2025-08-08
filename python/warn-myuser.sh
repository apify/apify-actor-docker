#!/bin/bash

WHOAMI=`whoami`

IN_PYTHON_IMAGE=false
if [ "$1" = "python" ]; then
    IN_PYTHON_IMAGE=true
fi

IN_NODE_IMAGE=false
if [ "$1" = "node" ]; then
    IN_NODE_IMAGE=true
fi

if [ "$WHOAMI" != "myuser" ]; then
    cat <<EOF
WARNING: This Docker image is currently being built under the user '$WHOAMI'.

We recommend you to build the image as the user 'myuser' instead, as it has less privileges.

Please update your Dockerfile to:
- Use 'USER myuser' directive if it isn't already
- Use 'WORKDIR /home/myuser' directive if it isn't already
- Copy all files with 'COPY --chown=myuser:myuser' directive if it isn't already

You may also need more changes in your Dockerfile, depending on the base image you are using.

If this is intentional, you can ignore this warning.
EOF

    exit 0
fi


if [ "$IN_PYTHON_IMAGE" = true ]; then
    cat <<EOF
This Docker image is currently being built under the user '$WHOAMI'.

If you encounter issues with your package manager, you might need to do some changes in your Dockerfile.
Please refer to the following documentation: https://docs.crawlee.dev/vlad-is-writing-a-url-we-need-documentation-for-thissss
EOF

    exit 0
fi

if [ "$IN_NODE_IMAGE" = true ]; then
    cat <<EOF
The base node image is now being ran as the user '$WHOAMI', and with the WORKDIR set to '/home/myuser'.

If you encounter any issues because of this, you may need to do some changes in your Dockerfile.
Please refer to the following documentation: https://docs.crawlee.dev/vlad-is-writing-a-url-we-need-documentation-for-thissss
EOF

    exit 0
fi
