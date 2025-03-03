import os
import time
from loguru import logger
from .base import Platform


class Cloudflare(Platform):
    def __init__(self):
        super().__init__("Cloudflare")
        self.cloudflare_url = 'https://dash.cloudflare.com/'
        self.DB_MENU = 'css:#react-app > div > div > div > aside > div > nav > div > div > div > div > ul > li:nth-child(18) > a > div > span > span.c_d.c_s > span.linkText.c_be.c_dc'
        self.workspace_menu = 'xpath://*[@id="react-app"]/div/div/div/aside/div/nav/div/div/div/div/ul/li[16]/a/div/span/span[1]/span[1]'

    def visit_main_page(self, tab):

        tab.get(self.cloudflare_url)
        return True

    def login(self, tab):

        tab.get(self.cloudflare_url)
        logger.info("请登录后按回车继续....")
        input()
        if tab.wait.eles_loaded('tx:account', timeout=6):
            logger.info("登录成功")
            return True
        else:
            logger.warning("登录失败")
            return False

    def create_D1(self, tab):
        if tab.wait.eles_loaded(self.DB_MENU, timeout=6):
            tab.ele(self.DB_MENU).click()
            D1_MENU = tab.ele(
                r'xpath://*[@id="subnav-menu-navigation.account.storage_and_databases"]/li[2]/a/div/span/span/span')
            D1_MENU.click()
            create_btn = tab.ele(
                'xpath://*[@id="react-app"]/div/div/div/div[1]/main/div/div/div[2]/div[2]/div[1]/button/span')
            create_btn.click()
            app_name_ele = 'xpath://*[@id="react-app"]/div/div/div/div[1]/div[1]/form/div[1]/div/input'
            if tab.wait.eles_loaded(app_name_ele, timeout=6):
                tab.ele(app_name_ele).input('moemail')
                create_btn2 = tab.ele('xpath://*[@id="react-app"]/div/div/div/div[1]/div[1]/form/div[3]/div/button[2]')
                create_btn2.click()
                if tab.wait.eles_loaded('tx:moemail', timeout=6):
                    logger.info("创建D1数据库成功")
                    KV_MENU = tab.ele(
                        r'css:#subnav-menu-navigation\.account\.storage_and_databases > li:nth-child(1) > a > div > span')
                    KV_MENU.click()
                    D1_MENU = tab.ele(
                        r'xpath://*[@id="subnav-menu-navigation.account.storage_and_databases"]/li[2]/a/div/span/span/span')
                    D1_MENU.click()
                    DATABASE_ID = tab.ele(
                        'xpath://*[@id="react-app"]/div/div/div/div[1]/main/div/div/div[2]/div[2]/div[2]/table/tbody/tr/td[2]/div/div/span').text
                    DATABASE_NAME = 'moemail'
                    return DATABASE_ID, DATABASE_NAME
                else:
                    logger.warning("创建D1数据库失败")

    def create_KV(self, tab):
        if tab.wait.eles_loaded(self.DB_MENU, timeout=6):
            tab.ele(self.DB_MENU).click()
            KV_MENU = r'css:#subnav-menu-navigation\.account\.storage_and_databases > li:nth-child(1) > a > div > span'
            tab.ele(KV_MENU).click()
            create_btn = tab.ele(
                'xpath://*[@id="react-app"]/div/div/div/div[1]/main/div/div/div[2]/div[2]/div[1]/button/span')
            create_btn.click()
            space_name_ele = 'css:#addKVNameForm > div > div > input'
            if tab.wait.eles_loaded(space_name_ele, timeout=6):
                tab.ele(space_name_ele).input('moemail')
                time.sleep(1)
                add_btn = 'xpath://*[@id="react-app"]/div/div/div/div[1]/main/div/div/div[2]/article/div/div/div[2]/div/button[2]/span'
                tab.ele(add_btn).click()
            if tab.wait.eles_loaded('tx:moemail', timeout=6):
                logger.info("创建KV空间成功")
                KV_NAMESPACE_ID = tab.ele(
                    'xpath://*[@id="react-app"]/div/div/div/div[1]/main/div/div/div[2]/div[3]/div[2]/table/tbody/tr/td[2]/div/div/span').text
                return KV_NAMESPACE_ID
            else:
                logger.warning("创建KV空间失败")

    def create_Pages(self, tab):
        if tab.wait.eles_loaded(self.workspace_menu, timeout=6):
            tab.ele(self.workspace_menu).click()
            page_span = tab.ele(
                'xpath://*[@id="react-app"]/div/div/div/div[1]/main/div/div/div[2]/div/a[2]/div/span[2]/span')
            page_span.click()
            upload_btn = tab.ele('xpath://*[@id="react-app"]/div/div/div/div[1]/main/div/div/div[4]/a/span')
            upload_btn.click()
            page_name = 'xpath:/html/body/div[1]/div/div/div/div[1]/main/div/div/div[2]/div[2]/ol/li[1]/div[2]/div/div/form/div/div/div/div[1]/input'
            if tab.wait.eles_loaded(page_name, timeout=6):
                tab.ele(page_name).input('moemail')
                time.sleep(2)
                create_btn = tab.ele(
                    'xpath:/html/body/div[1]/div/div/div/div[1]/main/div/div/div[2]/div[2]/ol/li[1]/div[2]/div/div/form/div/div/div/div[2]/button/span')
                create_btn.click()
                time.sleep(2)
                home_page = tab.ele(
                    'xpath:/html/body/div[1]/div/div/div/aside/div/nav/div/div/div/div/ul/li[1]/a/div/span/span/span')
                home_page.click()
                time.sleep(2)
                tab.ele(self.workspace_menu).click()
                home_page = tab.ele(
                    'xpath:/html/body/div[1]/div/div/div/aside/div/nav/div/div/div/div/ul/li[1]/a/div/span/span/span')
                home_page.click()
                time.sleep(2)
                tab.ele(self.workspace_menu).click()
                home_page = tab.ele(
                    'xpath:/html/body/div[1]/div/div/div/aside/div/nav/div/div/div/div/ul/li[1]/a/div/span/span/span')
                home_page.click()
                time.sleep(2)
                tab.ele(self.workspace_menu).click()
                id_pan = tab.ele(
                    'xpath:/html/body/div[1]/div/div/div/div[1]/main/div/div[2]/aside/section[2]/dl/dd/div/div[1]/div/div/pre/code/span/span/span/div/span')
                CLOUDFLARE_ACCOUNT_ID = id_pan.text
                return CLOUDFLARE_ACCOUNT_ID

    def setting_cloudflare(self, tab):
        project_name = tab.ele(
            'xpath:/html/body/div[1]/div/div/div/div[1]/main/div/div[1]/div[3]/div/div[1]/div[1]/h3/a')
        project_name.click()
        setting_pan = 'xpath:/html/body/div[1]/div/div/div/div[1]/div[1]/div[1]/div/div[2]/div[1]/a[5]/div/span[2]/span'
        deploy_pan = 'xpath:/html/body/div[1]/div/div/div/div[1]/div[1]/div[1]/div/div[2]/div[1]/a[1]/div/span[2]/span'
        tab.ele(setting_pan).click()
        self.add_project_variable(tab, 'AUTH_GITHUB_ID', os.getenv('AUTH_GITHUB_ID'))
        tab.ele(deploy_pan).click()
        tab.ele(setting_pan).click()
        self.add_project_variable(tab, 'AUTH_GITHUB_SECRET', os.getenv('AUTH_GITHUB_SECRET'))
        tab.ele(deploy_pan).click()
        tab.ele(setting_pan).click()
        self.add_project_variable(tab, 'AUTH_SECRET', os.getenv('AUTH_SECRET'))

    def add_project_variable(self, tab, variable_key, variable):
        time.sleep(1)
        add_span = 'xpath://*[@id="variables"]/div[1]/div[2]/button[1]/span'
        tab.ele(add_span).click()
        time.sleep(1)
        option_span = 'xpath:/html/body/div[1]/div[3]/div[2]/form/div/div/div/div[2]/div/div/div/div/div/div[2]'
        tab.ele(option_span).click()
        time.sleep(1)
        keyword_span = 'xpath:/html/body/div[1]/div[3]/div[2]/form/div/div/div/div[2]/div/div/div/div/div[2]/div/div[1]/span'
        tab.ele(keyword_span).click()
        time.sleep(1)
        variable_name = 'xpath:/html/body/div[1]/div[3]/div[2]/form/div/div/div/div[3]/input'
        tab.ele(variable_name).input(variable_key)
        variable_value = 'xpath:/html/body/div[1]/div[3]/div[2]/form/div/div/div/div[4]/div/div/textarea[2]'
        tab.ele(variable_value).input(variable)
        save_btn = 'xpath:/html/body/div[1]/div[3]/div[3]/div/div[2]/button[2]/span'
        tab.ele(save_btn).click()
        time.sleep(1)

    def create_cloudflare(self, tab):
        KV_NAMESPACE_ID = self.create_KV(tab)
        DATABASE_ID, DATABASE_NAME = self.create_D1(tab)
        CLOUDFLARE_ACCOUNT_ID = self.create_Pages(tab)
        self.setting_cloudflare(tab)
        return KV_NAMESPACE_ID, DATABASE_ID, DATABASE_NAME, CLOUDFLARE_ACCOUNT_ID
