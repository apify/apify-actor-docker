#!/usr/bin/env python3

# This file will be replaced by the actual actor source code,
# we keep this one here just for testing and clarification.

import sys

from apify_client import ApifyClient

# Run the main function of the script, if the script is executed directly
if __name__ == '__main__':
    print('Testing Docker image...')

    # Initialize the main ApifyClient instance
    client = ApifyClient()

    # Get the resource subclient for working with the 'apify' user
    user_client = client.user('apify')

    # Get the details of the 'apify' user
    apify_user = user_client.get()

    # Do a very basic check that the user details contain correct information
    if apify_user['username'] == 'apify':
        print('... test PASSED')
    else:
        print('... test FAILED')
        sys.exit(1)
