from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium import webdriver

def main():
    print('Testing Docker image...')

    for (browser_name, driver_class, options_class) in [('Chrome', webdriver.Chrome, ChromeOptions), ('Firefox', webdriver.Firefox, FirefoxOptions)]:
        for headless in [True, False]:
            print(f'Testing {browser_name}, {headless=}...')

            options = options_class()
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            if headless:
                options.add_argument('--headless')

            driver = driver_class(options=options)

            driver.get('http://www.example.com')
            assert driver.title == 'Example Domain'

            driver.quit()

    print('Tests succeeded!')
