"""
数据存储层：seller / promotion / product / user / follow / token 的增删改查。
"""
import json
import os
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Type

from pydantic import BaseModel, ValidationError

from backend.main.models import CartItem, Follow, Product, Promotion, Seller, Token, User
from backend.main.Tool.filePath import (
    COLLECTION_PATHS,
    ensure_dir,
)

_object_type = Literal["seller", "promotion", "product", "user", "follow", "token", "cart"]

ObjectModel = Type[BaseModel]

_OBJECT_MODEL_MAP: Dict[str, ObjectModel] = {
    "seller": Seller,
    "promotion": Promotion,
    "product": Product,
    "user": User,
    "follow": Follow,
    "token": Token,
    "cart": CartItem,
}

_OBJECT_PATH_MAP: Dict[str, Path] = dict(COLLECTION_PATHS)

_LOCK = threading.RLock()


class StorageError(Exception):
    """存储层异常，server 层转成 HTTP 状态码。"""


class ObjectNotFound(StorageError):
    """记录不存在。"""


def _now() -> str:
    return datetime.now().isoformat()

def _read_raw(_object: _object_type) -> List[Dict[str, Any]]:
    path = _OBJECT_PATH_MAP[_object]
    if not path.exists():
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        raise StorageError(f"读取 {path.name} 失败：{exc}") from exc

    if not isinstance(content, dict):
        raise StorageError(f"{path.name} 内容格式错误，期望对象")
    data = content.get(_object, [])
    if not isinstance(data, list):
        raise StorageError(f"{path.name} 里 {_object} 不是列表")
    return data

def _write_raw(_object: _object_type, records: List[Dict[str, Any]]) -> None:
    path = _OBJECT_PATH_MAP[_object]
    ensure_dir()
    payload = {_object: records}
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, path)
    except OSError as exc:
        raise StorageError(f"写入 {path.name} 失败：{exc}") from exc
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass

def _validate(_object: _object_type, data: Dict[str, Any]) -> BaseModel:
    try:
        return _OBJECT_MODEL_MAP[_object].model_validate(data)
    except ValidationError as exc:
        raise StorageError(f"数据校验失败：{exc.errors()}") from exc

def _find_index(records: List[Dict[str, Any]], _id: str) -> int:
    for index, record in enumerate(records):
        if record.get("id") == _id:
            return index
    raise ObjectNotFound(f"{_id} 不存在")

def list_items(_object: _object_type) -> List[Dict[str, Any]]:
    with _LOCK:
        return [_validate(_object, record).model_dump() for record in _read_raw(_object)]

def get_item(_object: _object_type, _id: str) -> Dict[str, Any]:
    with _LOCK:
        records = _read_raw(_object)
        return _validate(_object, records[_find_index(records, _id)]).model_dump()

def create_item(_object: _object_type, data: Dict[str, Any]) -> Dict[str, Any]:

    with _LOCK:
        records = _read_raw(_object)
        payload = dict(data)
        payload.pop("id", None)
        payload.pop("created_at", None)
        payload["updated_at"] = _now()

        record = _validate(_object, payload).model_dump()
        records.append(record)
        _write_raw(_object, records)
        return record

def update_item(_object: _object_type, _id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    with _LOCK:
        records = _read_raw(_object)
        index = _find_index(records, _id)
        old = records[index]

        merged = {
            **old,
            **data,
            "id": old["id"],
            "created_at": old.get("created_at", _now()),
            "updated_at": _now(),
        }
        records[index] = _validate(_object, merged).model_dump()
        _write_raw(_object, records)
        return records[index]

def delete_item(_object: _object_type, _id: str) -> Dict[str, Any]:
    with _LOCK:
        records = _read_raw(_object)
        index = _find_index(records, _id)
        removed = records.pop(index)
        _write_raw(_object, records)
        return removed


""" 用户 """
def find_user_by_account(account: str) -> Optional[Dict[str, Any]]:
    with _LOCK:
        for record in _read_raw("user"):
            if record.get("account") == account:
                return record
    return None

def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    with _LOCK:
        for record in _read_raw("user"):
            if record.get("id") == user_id:
                return record
    return None


""" 关注 """
def list_follows(user_id: str) -> List[Dict[str, Any]]:
    with _LOCK:
        return [record for record in _read_raw("follow") if record.get("user_id") == user_id]

def create_follow(user_id: str, target_type: str, target_id: str) -> Dict[str, Any]:
    with _LOCK:
        records = _read_raw("follow")
        for record in records:
            same = (
                record.get("user_id") == user_id
                and record.get("target_type") == target_type
                and record.get("target_id") == target_id
            )
            if same:
                return record

        payload = {"user_id": user_id, "target_type": target_type, "target_id": target_id}
        record = _validate("follow", payload).model_dump()
        records.append(record)
        _write_raw("follow", records)
        return record

def delete_follow(user_id: str, target_type: str, target_id: str) -> bool:
    with _LOCK:
        records = _read_raw("follow")
        kept = [
            record
            for record in records
            if not (
                record.get("user_id") == user_id
                and record.get("target_type") == target_type
                and record.get("target_id") == target_id
            )
        ]
        if len(kept) == len(records):
            return False
        _write_raw("follow", kept)
        return True


"""  登录令牌  """
def save_token(token: str, user_id: str) -> Dict[str, Any]:
    with _LOCK:
        records = _read_raw("token")
        record = _validate("token", {"id": token, "user_id": user_id}).model_dump()
        records.append(record)
        _write_raw("token", records)
        return record

def find_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    with _LOCK:
        for record in _read_raw("token"):
            if record.get("id") == token:
                return find_user_by_id(record.get("user_id", ""))
    return None

def delete_token(token: str) -> None:
    with _LOCK:
        records = _read_raw("token")
        kept = [record for record in records if record.get("id") != token]
        if len(kept) != len(records):
            _write_raw("token", kept)

def init_storage() -> List[str]:
    ensure_dir()
    created: List[str] = []
    for _object, path in _OBJECT_PATH_MAP.items():
        if not path.exists():
            _write_raw(_object, [])
            created.append(path.name)
    return created
