import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# 添加src模块的收集
src_modules = collect_submodules('src')

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=src_modules,  
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib', 'numpy', 'pandas', 'scipy', 'PyQt5', 'PyQt6', 
        'PySide2', 'PySide6', 'wx', 'notebook', 'sphinx', 'jupyter',
        'IPython', 'ipykernel', 'nbconvert', 'nbformat', 'test', 'tests',
        'unittest', 'distutils', 'pkg_resources',
        '_pytest', 'pytest', 'doctest', 'pycparser', 'pdb'
    ],
    noarchive=False,
    optimize=2,
)

excluded_binaries = [
    'VCRUNTIME140.dll',
    'MSVCP140.dll',
    'ucrtbase.dll',
    'api-ms-win*.dll',
    'Qt*.dll',
    'PySide*.dll',
    'sip*.dll',
    'python*.dll',
    'libopenblas*.dll',
    'mkl_*.dll'
]

a.binaries = TOC([x for x in a.binaries if not any(pattern.lower() in x[0].lower() for pattern in excluded_binaries)])

a.datas = TOC([x for x in a.datas if not x[0].startswith(('numpy', 'matplotlib')) and x[0] not in ['.env', 'README.md']])

pyz = PYZ(a.pure, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='moemail-auto-deploy',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=True,
    argv_emulation=True,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
    uac_admin=False,
)

