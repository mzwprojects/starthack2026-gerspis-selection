import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "wealth_manager_arena_db")
    MYSQL_USER: str = os.getenv("MYSQL_USER", "wealth_manager_arena_user")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "password")

    # Auth
    API_SECRET_KEY: str = os.getenv("API_SECRET_KEY", "dev-secret-key-change-me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # Debug
    API_DEBUG: bool = os.getenv("API_DEBUG", "true").lower() == "true"

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
        )

    class Config:
        env_file = ".env"


settings = Settings()
