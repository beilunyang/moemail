import json
import os
import random
import string
import sys
import time
from src.base import Browser
from src.utils import update_variable, generate_random_string, initialize_env
from src.cloudflare import Cloudflare
from src.github import Github
from dotenv import load_dotenv
from loguru import logger


def create_github_auth(github, tab):

    if github.create_app(tab):
        AUTH_GITHUB_ID, AUTH_GITHUB_SECRET = github.get_github_variable(tab)
        auth_secret_length = random.randint(5, 12)
        AUTH_SECRET = generate_random_string(auth_secret_length)
        update_variable(
            AUTH_GITHUB_ID=AUTH_GITHUB_ID,
            AUTH_GITHUB_SECRET=AUTH_GITHUB_SECRET,
            AUTH_SECRET=AUTH_SECRET
        )
        return True
    return False


def setting_github_moemail_project(github, tab):
    tab.get(github.github_moemail_url)
    github.fork_moe_mail(tab)
    github.settings_project_variable(tab)
    github.run_workflow(tab)
    return True


def create_cloudflare_resources(cloudflare, tab):

    KV_NAMESPACE_ID, DATABASE_ID, DATABASE_NAME, CLOUDFLARE_ACCOUNT_ID = cloudflare.create_cloudflare(tab)
    update_variable(
        KV_NAMESPACE_ID=KV_NAMESPACE_ID,
        DATABASE_ID=DATABASE_ID,
        DATABASE_NAME=DATABASE_NAME,
        CLOUDFLARE_ACCOUNT_ID=CLOUDFLARE_ACCOUNT_ID,
    )
    return True


def handle_domain_variable():

    MOE_MAIL_DOMAIN = os.getenv('MOE_MAIL_DOMAIN')
    if not MOE_MAIL_DOMAIN:
        logger.info("请输入您的网站域名（例如：https://example.com，不要以/结尾）：")
        MOE_MAIL_DOMAIN = input()
        update_variable(MOE_MAIL_DOMAIN=MOE_MAIL_DOMAIN)
    return MOE_MAIL_DOMAIN


def init_apis():
    browser = Browser()
    tab = browser.get_tab()
    github = Github()
    cloudflare = Cloudflare()
    

    MOE_MAIL_DOMAIN = handle_domain_variable()
    github.set_domain(MOE_MAIL_DOMAIN)
    
    return browser, tab, github, cloudflare


def full_process(browser, tab, github, cloudflare):

    logger.info("开始执行完整自动部署流程")
    

    if not github.authenticate(browser, tab):
        logger.error("Github登录失败，流程终止")
        return False
    
    if not create_github_auth(github, tab):
        logger.error("Github应用创建失败，流程终止")
        return False

    if not cloudflare.authenticate(browser, tab):
        logger.error("Cloudflare登录失败，流程终止")
        return False
        
    if not create_cloudflare_resources(cloudflare, tab):
        logger.error("Cloudflare资源创建失败，流程终止")
        return False
    

    if not github.authenticate(browser, tab):
        logger.error("Github再次登录失败，流程终止")
        return False
        
    if not setting_github_moemail_project(github, tab):
        logger.error("Github项目设置失败，流程终止")
        return False
    
    logger.info("完整流程执行成功")
    return True


def register_github_app(browser, tab, github):

    logger.info("开始注册Github应用")
    
    if not github.authenticate(browser, tab):
        logger.error("Github登录失败，流程终止")
        return False
    
    if not create_github_auth(github, tab):
        logger.error("Github应用创建失败，流程终止")
        return False
    
    logger.info("Github应用注册成功")
    return True


def create_cloudflare_page(browser, tab, cloudflare):

    logger.info("开始创建Cloudflare资源")
    
    if not cloudflare.authenticate(browser, tab):
        logger.error("Cloudflare登录失败，流程终止")
        return False
    
    if not create_cloudflare_resources(cloudflare, tab):
        logger.error("Cloudflare资源创建失败，流程终止")
        return False
    
    logger.info("Cloudflare资源创建成功")
    return True


def github_deploy(browser, tab, github):

    logger.info("开始Github项目部署")
    
    if not github.authenticate(browser, tab):
        logger.error("Github登录失败，流程终止")
        return False
    
    if not setting_github_moemail_project(github, tab):
        logger.error("Github项目设置失败，流程终止")
        return False
    
    logger.info("Github项目部署成功")
    return True


def show_menu():

    logger.info("======== MoeMail自动部署工具 ========")
    logger.info("1. 执行完整流程")
    logger.info("2. 仅注册Github应用")
    logger.info("3. 仅创建Cloudflare Page")
    logger.info("4. 仅执行Github部署")
    logger.info("0. 退出程序")
    logger.info("====================================")
    
    while True:
        try:
            logger.info("请选择功能 (0-4): ")
            choice = int(input())
            if 0 <= choice <= 4:
                return choice
            else:
                logger.warning("无效选择，请输入0-4之间的数字")
        except ValueError:
            logger.warning("无效输入，请输入数字")


def main():
    logger.info("程序启动")
    initialize_env()
    

    
    try:
        choice = show_menu()
        browser, tab, github, cloudflare = init_apis()
        if choice == 0:
            logger.info("用户选择退出程序")
            return
            
        elif choice == 1:
            success = full_process(browser, tab, github, cloudflare)
            
        elif choice == 2:
            success = register_github_app(browser, tab, github)
            
        elif choice == 3:
            success = create_cloudflare_page(browser, tab, cloudflare)
            
        elif choice == 4:
            success = github_deploy(browser, tab, github)
        
        if success:
            logger.info("所选功能执行成功")
        else:
            logger.error("所选功能执行失败")
            
    except Exception as e:
        logger.error(f"执行过程中发生错误: {str(e)}")
    finally:
        browser.quit()
        logger.info("程序结束")


if __name__ == '__main__':
    main()
