#!/usr/bin/env python3

from selenium.webdriver.chrome.options import Options
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium import webdriver

if __name__ == '__main__':
    print('Testing Docker image...')

    print('Testing Chrome...')
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=chrome_options)
    driver.get("http://www.example.com")
    assert driver.title == 'Example Domain'
    driver.quit()

    print('Testing Firefox...')
    firefox_options = FirefoxOptions()
    firefox_options.add_argument("--headless")
    firefox_options.add_argument("--no-sandbox")
    firefox_options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Firefox(options=firefox_options)
    driver.get("http://www.example.com")
    assert driver.title == 'Example Domain'
    driver.quit()

    print('Tests succeeded!')
