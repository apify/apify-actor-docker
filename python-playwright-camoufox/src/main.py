import os
from importlib.metadata import version

from camoufox.async_api import AsyncCamoufox


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
    print(f"Camoufox version: {version('camoufox')}")
    print()
    print("Environment variables set in this image:")
    print("-" * 60)
    for key, value in sorted(os.environ.items()):
        if key.startswith(("PYTHON", "PIP", "PATH", "APIFY", "CRAWLEE", "PLAYWRIGHT", "XVFB")):
            print(f"  {key}={value}")
    print("-" * 60)
    print()


async def run_test(headless=True):
    print(f"Testing Camoufox with {headless=}")
    async with AsyncCamoufox(headless=headless) as browser:
        page = await browser.new_page()
        await page.goto("http://www.example.com")
        title = await page.title()
        if title != "Example Domain":
            raise Exception(f"Camoufox test failed ({headless=}): got title {title!r}")


async def main():
    print_warning()
    print_image_info()
    print("Testing docker image by opening Camoufox...")
    await run_test(headless=True)
    await run_test(headless=False)
    print("All browser tests passed.")
