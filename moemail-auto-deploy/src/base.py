import json
import os
from DrissionPage import Chromium
from loguru import logger


class Browser():
    def __init__(self):
        self.browser = Chromium()
        self.tab = self.browser.latest_tab

    def get_browser(self):
        return self.browser

    def get_tab(self):
        return self.tab

    def save_cookies(self, name):
        cookies = self.tab.cookies()
        with open(name, 'w', encoding='utf-8') as f:
            json.dump(cookies, f)
        logger.info(f"Cookies已保存到{name}")
        return True

    def load_cookies(self, name):
        if not os.path.exists(name):
            logger.warning(f"Cookies文件{name}不存在")
            return False
            
        with open(name, 'r', encoding='utf-8') as f:
            cookies = json.load(f)
        self.tab.cookies(cookies)
        logger.info(f"已加载Cookies: {name}")
        return True

    def quit(self):
        self.browser.quit()


class Platform:

    
    def __init__(self, name):
        self.name = name
        self.cookies_file = f"{name.lower()}_cookies.json"
        
    def visit_main_page(self, tab):

        raise NotImplementedError("子类必须实现此方法")
        
    def login(self, tab):

        raise NotImplementedError("子类必须实现此方法")
        
    def authenticate(self, browser, tab):

        if browser.load_cookies(self.cookies_file):
            self.visit_main_page(tab)
            return True
        else:
            if self.login(tab):
                browser.save_cookies(self.cookies_file)
                return True
            return False
