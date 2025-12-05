from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from app.common.enums import Environment


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    
    # Application
    APP_NAME: str = "Wedding Innovation"
    APP_VERSION: str = "1.0.0"
    ENV: str = Environment.DEVELOPMENT.value
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    TIMEZONE: str = "Asia/Ho_Chi_Minh"
    
    # API Documentation
    DOCS_USERNAME: Optional[str] = None  
    DOCS_PASSWORD: Optional[str] = None  
    
    # Database Configuration
    DATABASE_URL: str
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600
 
    # JWT Configuration
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    WIDGET_TOKEN_EXPIRE_HOURS: int = 1
    INVITE_TOKEN_EXPIRE_DAYS: int = 7
    
    # Password & Encryption
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_RESET_EXPIRE_HOURS: int = 1
    SECRET_KEY: str
    ENCRYPTION_SALT: str = "salt" 
    
    # Root User (for admin setup)
    ROOT_USERNAME: Optional[str] = None
    ROOT_PASSWORD: Optional[str] = None


    FRONTEND_BASE_DOMAIN: str = "hoangdieuit.io.vn"

    BACKEND_URL: str = "https://hoangdieuit.io.vn"

    # CORS Configuration
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]
 
    # Document Upload/Crawl
    UPLOAD_DIR: str = "/static/uploads"

    
    # Development
    RELOAD: bool = False
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    def __init__(self, **kwargs):
        """Initialize settings and auto-configure DEBUG based on ENV if not explicitly set."""
        super().__init__(**kwargs)
        
        if "DEBUG" not in kwargs:
            self.DEBUG = self.ENV == "dev"


settings = Settings()

