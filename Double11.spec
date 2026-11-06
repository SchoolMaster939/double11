# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller 打包配置。

用法（在项目根目录 C:\\Users\\王鼎文\\src\\double11 下执行）：
    backend\\main\\.venv\\Scripts\\python.exe -m PyInstaller --noconfirm --clean Double11.spec

产物：dist/Double11/Double11.exe（onedir，启动快，data/ 与 .env 放 exe 旁边）

打包前先构建前端：
    cd frontend\\Project && npm run build
"""

from pathlib import Path

from PyInstaller.utils.hooks import collect_all

ROOT = Path(SPECPATH).resolve()  # noqa: F821  (SPECPATH 由 PyInstaller 注入)
ENTRY = ROOT / "backend" / "main" / "main.py"
FRONTEND_DIST = ROOT / "frontend" / "Project" / "dist"

if not ENTRY.exists():
    raise SystemExit(f"找不到入口文件: {ENTRY}")
if not (FRONTEND_DIST / "index.html").exists():
    raise SystemExit(f"找不到前端产物: {FRONTEND_DIST}，请先执行 npm run build")

datas = [(str(FRONTEND_DIST), "frontend")]
binaries = []
hiddenimports = [
    # uvicorn 的消息循环 / 协议实现是动态导入的，必须显式声明
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.loops.asyncio",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    # 业务包
    "backend.main",
    "backend.main.server",
    "backend.main.storage",
    "backend.main.models",
    "backend.main.auth",
    "backend.main.Tool",
    "backend.main.Tool.filePath",
    # 表单解析（上传图片）
    "multipart",
    "python_multipart",
]

# pywebview 的 js 注入文件、窗体后端需要完整收集
for package in ("webview", "clr_loader", "pythonnet"):
    try:
        package_datas, package_binaries, package_hidden = collect_all(package)
        datas += package_datas
        binaries += package_binaries
        hiddenimports += package_hidden
    except Exception as exc:  # pragma: no cover
        print(f"[spec] 跳过收集 {package}: {exc}")

a = Analysis(  # noqa: F821
    [str(ENTRY)],
    pathex=[str(ROOT)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "IPython", "pytest", "PySide6", "PyQt5", "PyQt6"],
    noarchive=False,
)

pyz = PYZ(a.pure)  # noqa: F821

exe = EXE(  # noqa: F821
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="Double11",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
)

coll = COLLECT(  # noqa: F821
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="Double11",
)
