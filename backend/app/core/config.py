import os
from pathlib import Path

try:
    from pydantic_settings import BaseSettings
except ImportError:
    class BaseSettings:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
EXPORTS_DIR = STORAGE_DIR / "exports"

STORAGE_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)
EXPORTS_DIR.mkdir(exist_ok=True)

class Settings:
    PROJECT_NAME: str = "US Phone Number Validation Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite+aiosqlite:///{STORAGE_DIR / 'validator.db'}"
    )
    SYNC_DATABASE_URL: str = os.getenv(
        "SYNC_DATABASE_URL", 
        f"sqlite:///{STORAGE_DIR / 'validator.db'}"
    )
    
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Authorized System API Keys
    PRIMARY_API_KEY: str = "val_live_4099da90f132c073e926c6fce76e2438365238a7"
    ADDITIONAL_AUTHORIZED_KEYS: set = {
        "val_live_4099da90f132c073e926c6fce76e2438365238a7",
        "val_live_22148df3452f6f52107426b3b6f90d536ca769ab",
        "val_master_live_998877665544332211"
    }
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "val_master_live_998877665544332211")
    CORS_ORIGINS: list[str] = ["*"]
    
    # Bulk Processing Performance
    MAX_BULK_RECORDS: int = 1_000_000
    CHUNK_SIZE: int = 1000
    DEFAULT_BATCH_INSERT_SIZE: int = 1000
    MAX_WORKERS: int = 4

settings = Settings()
