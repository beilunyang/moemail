import os
import shutil


def clean_build_dirs():
    dirs_to_clean = ['build', 'dist']
    for dir_name in dirs_to_clean:
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
            print(f"已清理 {dir_name} 目录")


def main():
    print("=== Cursor Register 清理工具 ===")
    clean_build_dirs()
    print("\n清理完成！")


if __name__ == '__main__':
    main()
