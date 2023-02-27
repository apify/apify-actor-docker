from playwright.async_api import async_playwright


async def run_test(launcher, headless=True):
    browser = await launcher.launch(headless=headless)
    page = await browser.new_page()
    await page.goto('http://example.com')
    if 'Example Domain' != await page.title():
        raise Exception("Playwright failed to load!")
    await browser.close()


async def main():
    async with async_playwright() as playwright:
        for launcher in [playwright.firefox, playwright.chromium, playwright.webkit]:
            await run_test(launcher, headless=True)
            await run_test(launcher, headless=False)