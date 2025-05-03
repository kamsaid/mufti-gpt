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
    # PINECONE_ENV is deprecated in newer Pinecone versions
    # PINECONE_ENV: str = Field("us-east1-gcp", env="PINECONE_ENV")
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

    # ------------------------------------------------------------------
    # Pydantic v2 configuration
    # ------------------------------------------------------------------
    # `model_config` is the new way (v2) to tweak behaviour.  We keep the
    # original `.env` loading and case-sensitivity, **plus** tell Pydantic
    # to *ignore* unrelated env vars (e.g. VITE_API_URL from the frontend)
    # instead of raising `ValidationError: extra_forbidden`.
    model_config = {
        "env_file": ".env",     # allow optional local .env overrides
        "case_sensitive": True,  # preserve original behaviour
        "extra": "ignore",      # <- crucial: ignore unknown env vars
    }


@lru_cache()
def get_settings() -> Settings:
    """Retrieve a cached instance of application Settings."""
    return Settings() 