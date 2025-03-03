import json
import os
import random
import string
import sys
import time

from DrissionPage import Chromium
from dotenv import load_dotenv
from loguru import logger


def generate_random_string(length=8):

    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


def initialize_env():

    if getattr(sys, 'frozen', False):
        base_path = os.path.dirname(sys.executable)
    else:
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    env_path = os.path.join(base_path, '.env')

    if os.path.exists(env_path):
        load_dotenv(dotenv_path=env_path)


def update_variable(**kwargs):
    try:
        if getattr(sys, 'frozen', False):
            base_path = os.path.dirname(sys.executable)
        else:
            base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        env_path = os.path.join(base_path, '.env')
        env_vars = {}
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()

        env_vars.update(kwargs)

        with open(env_path, 'w', encoding='utf-8') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")

        load_dotenv(dotenv_path=env_path, override=True)

        logger.info(f"环境变量已更新到: {env_path}")
        for key in kwargs:
            logger.info(f"已更新环境变量: {key}")
        return True
    except Exception as e:
        logger.error(f"更新环境变量失败: {str(e)}")
        return False
