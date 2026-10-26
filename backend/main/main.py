import os
import threading

import uvicorn
import webview
from pathlib import Path
from dotenv import load_dotenv
from backend.main.Path.filePath import get_base_url
from backend.main.server import app
_ENV_FILE = Path(get_base_url()) / ".env"
load_dotenv(_ENV_FILE)
class Api:
    pass

def get_url():
    devModeUrl = os.environ.get('DEV_MODE', 0) in ('1', 'true', 'yes', 'on')
    if devModeUrl:
        print(f"Dev(.env: {_ENV_FILE})")
        return 'http://localhost:5173'
    print(f"Gen(.env:{_ENV_FILE})")
    return 'http://localhost:8000'

def fastapi_server():
    uvicorn.run(
        app=app,
        host="127.0.0.1",
        port=8000,
        log_level="warning"
    )


if __name__ == '__main__':
    api_thread = threading.Thread(target=fastapi_server, daemon=True)
    api_thread.start()
    url = get_url()
    print(f"[WebView] 加载地址: {url}")
    window = webview.create_window(
        'Double 11 Treasure Hunt Plan',
        url,
        width=1000,
        height=800,
        js_api=Api()
    )

    webview.start(debug=True)