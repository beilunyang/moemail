import os
import time
from loguru import logger
from .base import Platform
from .utils import update_variable


class Github(Platform):
    def __init__(self):
        super().__init__("Github")
        self.github_url = 'https://github.com/login'
        self.github_developers_url = 'https://github.com/settings/developers'
        self.github_moemail_url = 'https://github.com/beilunyang/moemail/fork'
        self.MOE_MAIL_DOMAIN = None
        self.MOE_MAIL_CALLBACK_URL = None

    def set_domain(self, domain):
        if not domain:
            logger.error("域名不能为空")
            return False
            
        self.MOE_MAIL_DOMAIN = domain.rstrip('/')
        self.MOE_MAIL_CALLBACK_URL = f"{self.MOE_MAIL_DOMAIN}/api/auth/callback/github"
        logger.info(f"MOE_MAIL_DOMAIN: {self.MOE_MAIL_DOMAIN}")
        logger.info(f"MOE_MAIL_CALLBACK_URL: {self.MOE_MAIL_CALLBACK_URL}")
        return True

    def visit_main_page(self, tab):

        tab.get(self.github_developers_url)
        return True

    def login(self, tab):

        tab.get(self.github_url)
        logger.info("请登录后按回车继续....")
        input()
        if tab.wait.eles_loaded('tx:Dashboard', timeout=6):
            logger.info("登录成功")
            return True
        else:
            logger.warning("登录失败")
            return False

    def github_auth(self, tab):
        return tab.ele('tx:Authentication')

    def create_app(self, tab):
        tab.get(self.github_developers_url)
        new_auth_app = 'css:body > div.logged-in.env-production.page-responsive > div.application-main > main > div > div > div.Layout-main > div > div > div.settings-next > div > div > a'
        if tab.wait.eles_loaded(new_auth_app, timeout=6):
            tab.ele(new_auth_app).click()
            tab.ele('css:#oauth_application_name').input('MoeMail')
            tab.ele('css:#oauth_application_url').input(self.MOE_MAIL_DOMAIN)
            tab.ele('css:#oauth_application_callback_url').input(self.MOE_MAIL_CALLBACK_URL)
            tab.ele('css:#new_oauth_application > p > button').click()
            if tab.wait.eles_loaded('tx:Application created successfully', timeout=6):
                logger.info("创建应用成功")
                return True
            else:
                logger.warning("创建应用失败")
                return False
        else:
            logger.warning("创建应用失败")
            return False

    def get_github_variable(self, tab):
        AUTH_GITHUB_ID = tab.ele(
            'css:body > div.logged-in.env-production.page-responsive.page-account > div.application-main > main > div.pt-4.container-lg.p-responsive.d-flex.flex-md-row.flex-column.px-md-0.px-3.clearfix > div.col-md-9.col-12 > code').text
        tab.ele(
            'css:body > div.logged-in.env-production.page-responsive.page-account > div.application-main > main > div.pt-4.container-lg.p-responsive.d-flex.flex-md-row.flex-column.px-md-0.px-3.clearfix > div.col-md-9.col-12 > div.container-md.mx-auto.py-6 > div.Subhead.border-bottom-0.mb-0 > div > form > input.btn.btn-sm').click()
        if tab.wait.eles_loaded('tx:Authentication', timeout=6):
            time.sleep(5)
            logger.info("请输入Authentication,程序将在5秒后继续")
        if tab.wait.eles_loaded('tx:Make sure to copy your new client secret now'):
            AUTH_GITHUB_SECRET = tab.ele('css:#new-oauth-token').text
        return AUTH_GITHUB_ID, AUTH_GITHUB_SECRET

    def fork_moe_mail(self, tab):
        forked_project = 'xpath://*[@id="js-repo-pjax-container"]/react-app/div/form/ul/li/a'
        if tab.wait.eles_loaded(forked_project, timeout=3):
            logger.info("项目已存在")
            time.sleep(2)
            tab.ele(forked_project).click()
        else:
            logger.info("项目不存在，开始创建")
            create_btn = 'xpath://*[@id="js-repo-pjax-container"]/react-app/div/form/div[8]/button/span/span'
            time.sleep(2)
            tab.ele(create_btn).click()

    def settings_project_variable(self, tab):
        time.sleep(2)
        url= tab.url
        secrets_variables_url = f"{url}/settings/secrets/actions"
        tab.get(secrets_variables_url)
        self.add_project_variable(tab, 'CLOUDFLARE_ACCOUNT_ID')
        self.add_project_variable(tab, 'CLOUDFLARE_API_TOKEN')
        self.add_project_variable(tab, 'DATABASE_NAME')
        self.add_project_variable(tab, 'DATABASE_ID')
        self.add_project_variable(tab, 'KV_NAMESPACE_ID')

    def add_project_variable(self, tab, var):
        time.sleep(2)
        url = tab.url
        secrets_variables_url = f"{url}/new"
        var_name = 'xpath://*[@id="secret_name"]'
        var_secret = 'xpath://*[@id="secret_value"]'
        add_btn = 'xpath://*[@id="repo-content-pjax-container"]/div/div/div[2]/div/div/form/div/div[5]/button'
        tab.get(secrets_variables_url)
        tab.ele(var_name).input(var)
        tab.ele(var_secret).input(os.getenv(var))
        tab.ele(add_btn).click()
        time.sleep(2)

    def run_workflow(self, tab):
        action_tab = "xpath:/html/body/div[1]/div[1]/header/div[2]/nav/ul/li[3]/a/span[1]"
        tab.ele(action_tab).click()
        understand_btn = "xpath:/html/body/div[1]/div[5]/div/main/turbo-frame/div/div/div/div/div/div/form/input[1]"
        if tab.wait.eles_loaded(understand_btn, timeout=3):
            tab.ele(understand_btn).click()
        deploy_btn = "xpath:/html/body/div[1]/div[5]/div/main/turbo-frame/div/split-page-layout/div/div/div[1]/form/div/actions-workflow-list/nav/nav-list/ul/li[3]/nav-list-group/action-list/div/ul/li/a/span"
        run_work_btn = "xpath:/html/body/div[1]/div[5]/div/main/turbo-frame/div/split-page-layout/div/div/div[2]/div/div/div[2]/div[2]/details/summary"
        option1 = "xpath:/html/body/div[1]/div[5]/div/main/turbo-frame/div/split-page-layout/div/div/div[2]/div/div/div[2]/div[2]/details/div/div/div/form[2]/div[1]/div/div/label/input"
        option2 = "xpath:/html/body/div[1]/div[5]/div/main/turbo-frame/div/split-page-layout/div/div/div[2]/div/div/div[2]/div[2]/details/div/div/div/form[2]/div[2]/div/div/label/input"
        option3 = "xpath:/html/body/div[1]/div[5]/div/main/turbo-frame/div/split-page-layout/div/div/div[2]/div/div/div[2]/div[2]/details/div/div/div/form[2]/div[3]/div/div/label/input"
        run_btn = "xpath:/html/body/div[1]/div[5]/div/main/turbo-frame/div/split-page-layout/div/div/div[2]/div/div/div[2]/div[2]/details/div/div/div/form[2]/button/span/span"
        tab.ele(deploy_btn).click()
        tab.ele(run_work_btn).click()
        tab.ele(option1).click()
        tab.ele(option2).click()
        tab.ele(option3).click()
        tab.ele(run_btn).click()
