"""FastAPI 服务层。

通用增删改查（只开放业务集合）：
GET    /{object}        查询全部
POST   /{object}        新增
GET    /{object}/{id}   查询单条
PUT    /{object}/{id}   更新
DELETE /{object}/{id}   删除
object 只能是 seller / promotion / product。

认证与关注：
POST   /auth/register   注册
POST   /auth/login      登录，返回 token
GET    /auth/me         当前用户 + 关注列表
POST   /auth/logout     退出登录
POST   /follows/{type}/{id}    关注
DELETE /follows/{type}/{id}    取消关注
"""

from typing import Any, Dict, Literal, Optional
import os
import sys
import uuid
from pathlib import Path

from fastapi import Body, Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.main import auth, storage
from backend.main.Tool.filePath import SAVE_PATH_, ensure_dir

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_IMAGE_ROOT = SAVE_PATH_ / "images"
_IMAGE_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/images", StaticFiles(directory=str(_IMAGE_ROOT)), name="images")


def _frontend_dir() -> Optional[Path]:
    """
    前端静态文件目录。
    打包后由 PyInstaller 解压到 sys._MEIPASS/frontend；
    开发时可以用环境变量 FRONTEND_DIST 指向 dist 目录，没有就不托管。
    """
    candidates: list[Path] = []

    from_env = os.environ.get("FRONTEND_DIST")
    if from_env:
        candidates.append(Path(from_env))

    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        candidates.append(Path(meipass) / "frontend")
    project_root = SAVE_PATH_.parent
    candidates.append(project_root / "frontend" / "Project" / "dist")

    for path in candidates:
        if (path / "index.html").exists():
            return path
    return None


_FRONTEND_DIR = _frontend_dir()
if _FRONTEND_DIR:
    app.mount("/assets", StaticFiles(directory=str(_FRONTEND_DIR / "assets")), name="assets")

_object_type = Literal["seller", "promotion", "product"]
_follow_type = Literal["seller", "promotion", "product"]


@app.get("/health")
def health():
    """启动探针，main.py 用它确认后端已就绪。"""
    return {"status": "ok"}

@app.on_event("startup")
async def init_all():
    ensure_dir()
    created = storage.init_storage()
    if created:
        print(f"[init_all] 新建数据文件：{', '.join(created)}")

@app.exception_handler(storage.StorageError)
async def storage_error_handler(_request: Request, exc: storage.StorageError):
    """记录不存在回 404，其余（数据校验失败等）回 422。"""
    status_code = 404 if isinstance(exc, storage.ObjectNotFound) else 422
    return JSONResponse(status_code=status_code, content={"detail": str(exc)})


def _require_payload(payload: Any) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="请求体必须是 JSON 对象")
    return payload


""" 认证 """
@app.post("/auth/register", status_code=201)
def register(payload: Dict[str, Any] = Body(...)):
    data = _require_payload(payload)
    account = str(data.get("account", "")).strip()
    password = str(data.get("password", ""))
    name = str(data.get("name") or account).strip()

    if not account:
        raise HTTPException(status_code=422, detail="账号不能为空")
    if len(password) < 6:
        raise HTTPException(status_code=422, detail="密码至少 6 位")
    if storage.find_user_by_account(account):
        raise HTTPException(status_code=409, detail="该账号已被注册")

    hashed = auth.hash_password(password)
    user = storage.create_item(
        "user",
        {
            "account": account,
            "name": name,
            "avatar": data.get("avatar"),
            "password_hash": hashed["hash"],
            "password_salt": hashed["salt"],
        },
    )
    return {
        "token": auth.issue_token(user["id"]),
        "user": _public_user(user),
    }


@app.post("/auth/login")
def login(payload: Dict[str, Any] = Body(...)):
    data = _require_payload(payload)
    account = str(data.get("account", "")).strip()
    password = str(data.get("password", ""))

    user = storage.find_user_by_account(account)
    if not user or not auth.verify_password(password, user["password_hash"], user["password_salt"]):
        raise HTTPException(status_code=401, detail="账号或密码不正确")

    return {
        "token": auth.issue_token(user["id"]),
        "user": _public_user(user),
    }


@app.get("/auth/me")
def me(user: Dict[str, Any] = Depends(auth.get_current_user)):
    return {**_public_user(user), "follows": _follow_payloads(user["id"])}


@app.post("/auth/logout")
def logout(authorization: Optional[str] = Header(default=None)):
    token = (authorization or "").removeprefix("Bearer ").strip()
    if token:
        auth.revoke_token(token)
    return {"detail": "已退出登录"}

def _public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "account": user["account"],
        "name": user.get("name", user["account"]),
        "avatar": user.get("avatar"),
        "created_at": user.get("created_at"),
    }

def _follow_payloads(user_id: str):
    return storage.list_follows(user_id)


""" 关注 """
@app.post("/follows/{target_type}/{target_id}", status_code=201)
def follow(
    target_type: _follow_type,
    target_id: str,
    user: Dict[str, Any] = Depends(auth.get_current_user),
):
    storage.get_item(target_type, target_id)
    return storage.create_follow(user["id"], target_type, target_id)


@app.delete("/follows/{target_type}/{target_id}")
def unfollow(
    target_type: _follow_type,
    target_id: str,
    user: Dict[str, Any] = Depends(auth.get_current_user),
):
    storage.delete_follow(user["id"], target_type, target_id)
    return {"detail": "已取消关注"}


@app.get("/cart")
def cart_list(user: Dict[str, Any] = Depends(auth.get_current_user)):
    return [item for item in storage.list_items("cart") if item.get("user_id") == user["id"]]


@app.post("/cart", status_code=201)
def cart_add(payload: Dict[str, Any] = Body(...), user: Dict[str, Any] = Depends(auth.get_current_user)):
    data = _require_payload(payload)
    product_id = str(data.get("product_id", ""))
    if not product_id:
        raise HTTPException(status_code=422, detail="缺少 product_id")
    storage.get_item("product", product_id)

    for item in storage.list_items("cart"):
        if item.get("user_id") == user["id"] and item.get("product_id") == product_id:
            return storage.update_item("cart", item["id"], {"quantity": int(item.get("quantity", 1)) + 1})

    return storage.create_item(
        "cart",
        {"user_id": user["id"], "product_id": product_id, "quantity": int(data.get("quantity", 1))},
    )


@app.put("/cart/{item_id}")
def cart_update(
    item_id: str,
    payload: Dict[str, Any] = Body(...),
    user: Dict[str, Any] = Depends(auth.get_current_user),
):
    item = storage.get_item("cart", item_id)
    if item.get("user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="购物车项不存在")

    quantity = int(_require_payload(payload).get("quantity", 1))
    if quantity <= 0:
        storage.delete_item("cart", item_id)
        return {"detail": "已移除"}
    return storage.update_item("cart", item_id, {"quantity": quantity})


@app.delete("/cart/{item_id}")
def cart_remove(item_id: str, user: Dict[str, Any] = Depends(auth.get_current_user)):
    item = storage.get_item("cart", item_id)
    if item.get("user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="购物车项不存在")
    storage.delete_item("cart", item_id)
    return {"detail": "已移除"}


""" 图片 """
_IMAGE_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
_MAX_IMAGE_BYTES = 5 * 1024 * 1024

def _image_dir() -> Path:
    path = SAVE_PATH_ / "images"
    path.mkdir(parents=True, exist_ok=True)
    return path

@app.post("/upload/image", status_code=201)
async def upload_image(request: Request):
    form = await request.form()
    upload = form.get("file")
    if upload is None or not hasattr(upload, "read"):
        raise HTTPException(status_code=422, detail="缺少 file 字段")

    content_type = (getattr(upload, "content_type", "") or "").lower()
    suffix = _IMAGE_TYPES.get(content_type)
    if not suffix:
        raise HTTPException(status_code=415, detail="只支持 png / jpg / webp / gif")

    data = await upload.read()
    if len(data) > _MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="图片不能超过 5MB")

    filename = f"{uuid.uuid4().hex}{suffix}"
    (_image_dir() / filename).write_bytes(data)

    return {"id": f"image_{uuid.uuid4().hex[:8]}", "url": f"/images/{filename}", "filename": filename}


""" 通用增删改查  """
@app.get("/{_object}")
def _list(_object: _object_type):
    return storage.list_items(_object)


@app.post("/{_object}", status_code=201)
def _create(_object: _object_type, payload: Dict[str, Any] = Body(...)):
    return storage.create_item(_object, _require_payload(payload))


@app.get("/{_object}/{item_id}")
def _get(_object: _object_type, item_id: str):
    return storage.get_item(_object, item_id)


@app.put("/{_object}/{item_id}")
def _update(_object: _object_type, item_id: str, payload: Dict[str, Any] = Body(...)):
    return storage.update_item(_object, item_id, _require_payload(payload))


@app.delete("/{_object}/{item_id}")
def _delete(_object: _object_type, item_id: str):
    removed = storage.delete_item(_object, item_id)
    return {"detail": "已删除", "id": removed.get("id")}


""" 前端静态文件（放在所有 API 路由之后，避免抢占接口） """


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    """
    非 API 路径一律交给前端：
      - 能对到 dist 里的真实文件就返回文件（favicon.svg 等）
      - 其余返回 index.html（本项目没有前端路由，但这样更稳妥）
    """
    if not _FRONTEND_DIR:
        raise HTTPException(status_code=404, detail="未找到前端产物，请先执行 npm run build")

    target = (_FRONTEND_DIR / full_path).resolve()
    # 防目录穿越
    if str(target).startswith(str(_FRONTEND_DIR.resolve())) and target.is_file():
        return FileResponse(target)

    return FileResponse(_FRONTEND_DIR / "index.html")
