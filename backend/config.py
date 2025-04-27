from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings pulled from environment variables.

    Using Pydantic's BaseSettings gives us automatic environment variable
    parsing and validation while still allowing default values for local
    development.  The `lru_cache` wrapper around `get_settings` ensures we
    only instantiate the Settings object once (singleton-ish) which avoids
    re-reading environment variables on every import.
    """

    # ------------------------------------------------------------------
    # OpenAI / Pinecone credentials & configuration
    # ------------------------------------------------------------------
    OPENAI_API_KEY: str = Field(..., env="OPENAI_API_KEY")
    PINECONE_API_KEY: str = Field(..., env="PINECONE_API_KEY")
    PINECONE_ENV: str = Field("us-east1-gcp", env="PINECONE_ENV")
    PINECONE_INDEX_NAME: str = Field("islamic-kb", env="PINECONE_INDEX_NAME")

    # ------------------------------------------------------------------
    # Application behaviour toggles
    # ------------------------------------------------------------------
    MODERATION_ENABLED: bool = Field(True, env="MODERATION_ENABLED")
    CONFIDENCE_THRESHOLD: float = Field(0.25, ge=0.0, le=1.0, env="CONFIDENCE_THRESHOLD")

    # ------------------------------------------------------------------
    # Miscellaneous
    # ------------------------------------------------------------------
    FASTAPI_DEBUG: bool = Field(False, env="FASTAPI_DEBUG")

    class Config:
        env_file = ".env"  # still works if user opts for local .env file
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retrieve a cached instance of application Settings."""
    return Settings() 