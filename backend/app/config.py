from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    app_name: str = "Password Manager"
    debug: bool = Field(default=False)
    environment: str = Field(default="development")
    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@db:5432/password_manager"
    )

    secret_key: str = Field(default="change-me-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Accepts a comma-separated string from env:
    # CORS_ORIGINS=https://myapp.vercel.app,http://localhost:3000
    cors_origins: list[str] = Field(default=["http://localhost:3000"])

    argon2_time_cost: int = 3
    argon2_memory_cost: int = 65536
    argon2_parallelism: int = 4

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()