from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    allowed_origins: str = "http://localhost:3000"
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
