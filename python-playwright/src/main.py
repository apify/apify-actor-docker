from playwright.async_api import async_playwright


async def run_test(launcher, headless=True):
    print(f'Testing {launcher.name} with {headless=}')
    browser = await launcher.launch(headless=headless)
    page = await browser.new_page()
    await page.goto('http://example.com')
    if 'Example Domain' != await page.title():
        raise Exception(f'Playwright failed to load! ({launcher.name}, {headless=})')
    await browser.close()


async def main():
    async with async_playwright() as playwright:
        print('Testing docker image by opening browsers...')
        for launcher in [playwright.firefox, playwright.chromium, playwright.webkit]:
            await run_test(launcher, headless=True)
            await run_test(launcher, headless=False)
        print('Testing finished successfully.')
