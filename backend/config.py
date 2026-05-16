"""
Syngenta Agri-AI Platform — Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# Resolve .env relative to this file (backend/../.env)
_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    # GCP
    gcp_project_id: str = ""
    google_cloud_region: str = "asia-south1"

    # Gemini
    gemini_api_key: str = ""

    # Groq
    groq_api_key: str = ""

    # MongoDB
    mongodb_uri: str = ""
    mongodb_db_name: str = "syngenta_agri"

    # Meteoblue
    meteoblue_api_key: str = "zCblUXDRZfW6g5Qh"

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = "whatsapp:+14155238886"
    twilio_phone_number: str = "+14155238886"

    # App
    app_port: int = 8080
    environment: str = "production"
    log_level: str = "INFO"

    class Config:
        env_file = str(_ENV_FILE)
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
