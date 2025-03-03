import os
import platform
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from clean import clean_build_dirs

APP_NAME = 'moemail-auto-deploy'

def check_requirements():
    required_packages = ['pyinstaller']
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            print(f"正在安装 {package}...")
            subprocess.run(['pip', 'install', package], check=True, encoding='utf-8')


def get_platform_info():
    system = platform.system().lower()
    arch = platform.machine().lower()
    
    if system == 'darwin': 
        if arch == 'arm64':
            return 'MacOS-ARM64'
        else:
            return 'MacOS-Intel'
    elif system == 'windows':
        return 'Windows'
    elif system == 'linux':
        return 'Linux'
    else:
        return f"{system}-{arch}"


def build_executable():
    platform_info = get_platform_info()
    print(f"开始为 {platform_info} 平台构建可执行文件...")

    clean_build_dirs()
    check_requirements()

    system = platform.system().lower()
    arch = platform.machine().lower()
    build_command = []
    
    if system == 'darwin': 
        if arch == 'arm64':
            build_command = ['pyinstaller', f'{APP_NAME}.spec']
        else:
    
            build_command = ['arch', '-x86_64', 'python3', '-m', 'PyInstaller', f'{APP_NAME}.spec']
    elif system == 'windows':
        build_command = ['pyinstaller', f'{APP_NAME}.spec', '--clean', '2>&1']
    elif system == 'linux':
        build_command = ['pyinstaller', f'{APP_NAME}.spec']
    else:
        print(f"不支持的平台: {system}-{arch}")
        return False

    try:
        result = subprocess.run(build_command, encoding='utf-8', check=True, shell=(system == 'windows'))
        if result.returncode != 0:
            print("构建失败！")
            return False
    except subprocess.CalledProcessError as e:
        print(f"构建失败: {e}")
        return False
    except UnicodeDecodeError:
        if system == 'windows':
            try:
                result = subprocess.run(build_command, encoding='gbk', check=True, shell=True)
                if result.returncode != 0:
                    print("构建失败！")
                    return False
            except subprocess.CalledProcessError as e:
                print(f"构建失败: {e}")
                return False
        else:
            print("构建失败：编码错误")
            return False


    extension = '.exe' if system == 'windows' else ''
    exe_path = Path(f'dist/{APP_NAME}{extension}')
    if not exe_path.exists():
        print("构建失败：未找到输出文件！")
        return False

    file_size = exe_path.stat().st_size / (1024 * 1024)
    print(f"\n构建成功！")
    print(f"输出文件：{exe_path.absolute()}")
    print(f"文件大小：{file_size:.2f} MB")
    if os.path.exists('../.env.example'):
        shutil.copy('../.env.example', 'dist/.env.example')
        print("已复制 .env.example 文件")
    return True


def create_zip():
    if not os.path.exists('dist'):
        print("dist 目录不存在，无法创建压缩包")
        return

    output_dir = 'output'
    os.makedirs(output_dir, exist_ok=True)

    platform_info = get_platform_info()
    zip_name = f"{APP_NAME}-{platform_info}-{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    zip_path = os.path.join(output_dir, zip_name)
    shutil.make_archive(zip_path.replace('.zip', ''), 'zip', 'dist')
    print(f"\n已创建压缩包：{zip_path}")


def main():
    print(f"=== {APP_NAME} 跨平台构建工具 ===")
    print(f"当前平台: {get_platform_info()}")
    
    if build_executable():
        create_zip()
    print("\n打包过程完成！")


if __name__ == '__main__':
    main()
