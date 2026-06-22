from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Inventory & Order Management API"
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/inventory_db"
    frontend_origin: str = "*"
    low_stock_threshold: int = 5

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
