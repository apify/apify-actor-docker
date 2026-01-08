from camoufox.async_api import AsyncCamoufox


async def run_test(headless=True):
    print(f'Testing Camoufox with {headless=}')
    async with AsyncCamoufox(headless=headless) as browser:
        page = await browser.new_page()
        await page.goto('http://example.com')
        if 'Example Domain' != await page.title():
            raise Exception(f'Camoufox failed to load! ({headless=})')


async def main():
    print('Testing docker image by opening Camoufox browser...')
    await run_test(headless=True)
    await run_test(headless=False)
    print('Testing finished successfully.')
