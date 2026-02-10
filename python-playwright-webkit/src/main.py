import os
from importlib.metadata import version

from playwright.async_api import async_playwright


def print_warning():
    print(
        'If you\'re seeing this text, it means the Actor started the default "main.py" file instead\n'
        "of your own source code file. You have two options how to fix this:\n"
        '1) Rename your source code file to "main.py" and put it in the "src" directory\n'
        '2) Define a custom "Dockerfile" that will run your code your way\n'
        "\n"
        "For more information, see https://docs.apify.com/actors/development/source-code#custom-dockerfile"
    )


def print_image_info():
    print(f"Playwright version: {version('playwright')}")
    print()
    print("Environment variables set in this image:")
    print("-" * 60)
    for key, value in sorted(os.environ.items()):
        if key.startswith(("PYTHON", "PIP", "PATH", "APIFY", "CRAWLEE", "PLAYWRIGHT", "XVFB")):
            print(f"  {key}={value}")
    print("-" * 60)
    print()


async def run_test(launcher, headless=True):
    print(f"Testing {launcher.name} with {headless=}")
    browser = await launcher.launch(headless=headless)
    page = await browser.new_page()
    await page.goto("http://www.example.com")
    title = await page.title()
    if title != "Example Domain":
        raise Exception(f"Playwright test failed ({launcher.name}, {headless=}): got title {title!r}")
    await browser.close()


async def main():
    print_warning()
    print_image_info()
    async with async_playwright() as playwright:
        print("Testing docker image by opening browsers...")
        await run_test(playwright.webkit, headless=True)
        await run_test(playwright.webkit, headless=False)
        print("All browser tests passed.")
