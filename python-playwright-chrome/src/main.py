import os

from playwright.async_api import async_playwright


async def run_test(launcher, headless=True, executable_path=None):
    browser_name = launcher.name
    if executable_path:
        browser_name = f"{launcher.name} (Chrome at {executable_path})"

    print(f"Testing {browser_name} with {headless=}")
    launch_options = {"headless": headless}
    if executable_path:
        launch_options["executable_path"] = executable_path

    browser = await launcher.launch(**launch_options)
    page = await browser.new_page()
    await page.goto("http://example.com")
    if "Example Domain" != await page.title():
        raise Exception(f"Playwright failed to load! ({browser_name}, {headless=})")
    await browser.close()


async def main():
    async with async_playwright() as playwright:
        print("Testing docker image by opening Chrome browser...")

        # Test Chromium
        await run_test(playwright.chromium, headless=True)
        await run_test(playwright.chromium, headless=False)

        # Test Google Chrome using the executable path
        chrome_path = os.environ.get("APIFY_CHROME_EXECUTABLE_PATH")
        if chrome_path and os.path.exists(chrome_path):
            print(f"Testing Google Chrome at {chrome_path}...")
            await run_test(playwright.chromium, headless=True, executable_path=chrome_path)
            await run_test(playwright.chromium, headless=False, executable_path=chrome_path)
        else:
            raise Exception(f"APIFY_CHROME_EXECUTABLE_PATH not set or does not exist (env var: {chrome_path})")

        print("Testing finished successfully.")
