from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator
import json


class Settings(BaseSettings):
    APP_NAME: str = "OrganDonationPlatform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/organ_donation"
    DATABASE_ECHO: bool = False

    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ENCRYPTION_KEY: str = "your-32-byte-base64-encryption-key"

    OTP_EXPIRY_MINUTES: int = 5
    OTP_LENGTH: int = 6

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@organdonation.com"

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    SMS_PROVIDER: str = "twilio"
    SMS_API_KEY: str = ""
    SMS_SENDER_ID: str = "ORGDNT"

    SMTP_TLS: bool = True

    FIREBASE_CREDENTIALS_PATH: str = "./firebase-credentials.json"

    RATE_LIMIT_PER_MINUTE: int = 60

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000", "http://localhost:8080"]

    MAX_VIABLE_DISTANCE_KM: float = 500.0
    DEFAULT_SEARCH_RADIUS_KM: float = 100.0

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
