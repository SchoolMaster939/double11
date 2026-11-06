
import hashlib
import hmac
import secrets
from typing import Any, Dict, Optional

from fastapi import Header, HTTPException

from backend.main import storage

_ALGORITHM = "sha256"
_ITERATIONS = 120_000
_KEY_LENGTH = 32


def hash_password(password: str, salt: Optional[str] = None) -> Dict[str, str]:
    """返回 {hash, salt}，salt 不传时自动生成。"""
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        _ALGORITHM,
        password.encode("utf-8"),
        salt.encode("utf-8"),
        _ITERATIONS,
        dklen=_KEY_LENGTH,
    )
    return {"hash": digest.hex(), "salt": salt}


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    candidate = hash_password(password, salt)["hash"]
    return hmac.compare_digest(candidate, password_hash)


def issue_token(user_id: str) -> str:
    token = secrets.token_urlsafe(24)
    storage.save_token(token, user_id)
    return token


def revoke_token(token: str) -> None:
    storage.delete_token(token)


def _read_bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    scheme, _, value = authorization.partition(" ")
    if scheme.lower() != "bearer" or not value:
        return None
    return value


def get_current_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    token = _read_bearer(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="请先登录")

    user = storage.find_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="登录状态已失效，请重新登录")
    return user
