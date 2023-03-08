# This file will be replaced by the actual actor source code,
# we keep this one here just for testing and clarification.

from apify import Actor


async def main():
    async with Actor:
        print('Testing Docker image...')
        try:
            assert Actor.config.is_at_home is False

            apify_user = await Actor.apify_client.user('apify').get()
            assert apify_user is not None
            assert apify_user.get('username') == 'apify'
            print('Test successful')
        except:
            print('Test failed')
            raise
