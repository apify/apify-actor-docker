#!/bin/bash

filtered_args="$@"

# If the filtered_args start with /bin/sh, that means we are in an extended Docker image, and we want to strip out /bin/sh -c + possibly the script name
if [[ "$filtered_args" == "/bin/sh"* ]]; then
    filtered_args=$(echo "$filtered_args" | sed 's|/bin/sh -c||g')
fi

# Filter out './new_xvfb_run_cmd.sh' and './start_xvfb_and_run_cmd.sh' from the arguments, and trim the start of the string
filtered_args=$(echo "$filtered_args" | sed 's|./new_xvfb_run_cmd.sh||g' | sed 's|./start_xvfb_and_run_cmd.sh||g')
filtered_args=$(echo "$filtered_args" | sed 's|^[[:space:]]*||')

echo "Will run command: xvfb-run -a -s \"-ac -screen 0 $XVFB_WHD -nolisten tcp\" $filtered_args"
xvfb-run -a -s "-ac -screen 0 $XVFB_WHD -nolisten tcp" $filtered_args
