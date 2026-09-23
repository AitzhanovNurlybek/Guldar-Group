from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "GulDar Group API"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"

    # Через запятую: http://localhost:3000,https://guldar.kz
    CORS_ORIGINS: str = "http://localhost:3000"

    DATABASE_URL: str = "sqlite:///./guldar.db"
    SECRET_KEY: str = "change-me"

    # Уведомления о заявках
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
