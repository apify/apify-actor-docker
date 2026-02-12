import os
from importlib.metadata import version

from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium import webdriver


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
    print(f"Selenium version: {version('selenium')}")
    print()
    print("Environment variables set in this image:")
    print("-" * 60)
    for key, value in sorted(os.environ.items()):
        if key.startswith(("PYTHON", "PIP", "PATH", "APIFY", "CRAWLEE", "SELENIUM", "XVFB")):
            print(f"  {key}={value}")
    print("-" * 60)
    print()


def main():
    print_warning()
    print_image_info()

    print("Testing Docker image...")

    for browser_name, driver_class, options_class in [
        ("Chrome", webdriver.Chrome, ChromeOptions),
        ("Firefox", webdriver.Firefox, FirefoxOptions),
    ]:
        for headless in [True, False]:
            print(f"Testing {browser_name}, {headless=}...")

            options = options_class()
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            if headless:
                options.add_argument("--headless")

            driver = driver_class(options=options)

            driver.get("http://www.example.com")
            assert driver.title == "Example Domain"

            driver.quit()

    print("Tests succeeded!")
