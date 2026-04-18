from datetime import datetime, timedelta
from typing import Optional, Tuple
import secrets
import hashlib
import base64
import pyotp
from passlib.context import CryptContext
from jose import jwt, JWTError
from cryptography.fernet import Fernet

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def create_token_pair(user_id: str, email: str, roles: list[str]) -> Tuple[str, str, datetime]:
    token_data = {"sub": user_id, "email": email, "roles": roles}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return access_token, refresh_token, expires_at


def generate_otp(length: int = 6) -> str:
    return "".join([str(secrets.randbelow(10)) for _ in range(length)])


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def verify_otp(otp: str, otp_hash: str) -> bool:
    return hash_otp(otp) == otp_hash


def get_otp_expiry() -> datetime:
    return datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def verify_totp(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token)


def get_fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY
    if len(key) < 32:
        key = hashlib.sha256(key.encode()).digest()
        key = base64.urlsafe_b64encode(key)
    return Fernet(key)


def encrypt_sensitive_data(data: str) -> str:
    fernet = get_fernet()
    return fernet.encrypt(data.encode()).decode()


def decrypt_sensitive_data(encrypted_data: str) -> str:
    fernet = get_fernet()
    return fernet.decrypt(encrypted_data.encode()).decode()


def generate_secure_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)
