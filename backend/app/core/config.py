from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LANGSMITH_TRACING: bool = False
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "llm-benchmark-dashboard"
    DATABASE_URL: str = "sqlite:///./benchmark.db"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": "../.env", "env_file_encoding": "utf-8"}


settings = Settings()
