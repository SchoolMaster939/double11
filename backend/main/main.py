"""应用入口：启动 FastAPI 服务并用 pywebview 打开窗口。

开发：DEV_MODE=1 时窗口加载 Vite 开发服务器（默认 http://localhost:5173）
打包：PyInstaller 单文件运行时，窗口加载内置的 FastAPI（http://127.0.0.1:8000），
前端静态文件通过 --add-data 打进 exe，由 server.py 提供。
"""

import os
import threading
import time
from pathlib import Path
from urllib.request import urlopen

import uvicorn
import webview
from dotenv import load_dotenv

from backend.main.Tool.filePath import get_base_url
from backend.main.server import app

# .env 放在 exe 同目录（开发时是项目根目录）
_ENV_FILE = get_base_url() / ".env"
load_dotenv(_ENV_FILE)

HOST = "127.0.0.1"
PORT = 8000
BASE_URL = f"http://{HOST}:{PORT}"


class Api:
    """暴露给前端的原生接口（window.pywebview.api）"""
    def get_base_url(self):
        return BASE_URL


def dev_mode() -> bool:
    return os.environ.get("DEV_MODE", "0") in ("1", "true", "yes", "on")


def get_url() -> str:
    if dev_mode():
        print(f"[WebView] 开发模式（.env: {_ENV_FILE}）-> http://localhost:5173")
        return "http://localhost:5173"
    print(f"[WebView] 生产模式（.env: {_ENV_FILE}）-> {BASE_URL}")
    return BASE_URL


def fastapi_server() -> None:
    uvicorn.run(app=app, host=HOST, port=PORT, log_level="warning")


def wait_for_server(timeout: float = 15.0) -> bool:
    """等后端起来再打开窗口，避免首屏 404 / 连接失败。"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urlopen(f"{BASE_URL}/health", timeout=0.5) as res:
                if res.status == 200:
                    return True
        except Exception:
            time.sleep(0.15)
    return False


def start() -> None:
    api_thread = threading.Thread(target=fastapi_server, daemon=True)
    api_thread.start()

    ready = wait_for_server()
    if not ready:
        print("[WebView] 警告：后端未在超时内就绪，仍尝试打开窗口")

    url = get_url()
    webview.create_window(
        "Double 11 Treasure Hunt Plan",
        url,
        width=1180,
        height=860,
        min_size=(900, 640),
        js_api=Api(),
    )
    webview.start(debug=dev_mode())


if __name__ == "__main__":
    start()
