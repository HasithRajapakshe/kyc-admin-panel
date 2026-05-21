from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    data.update({"exp": expire, "type": "access"})
    return jwt.encode(data, settings.secret_key, settings.algorithm)


def create_refresh_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(
        days=settings.refresh_token_expire_days
    )
    data.update({"exp": expire, "type": "refresh"})
    return jwt.encode(data, settings.secret_key, settings.algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.algorithm]
    )
