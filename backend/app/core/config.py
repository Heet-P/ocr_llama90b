from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    GOOGLE_API_KEY: str
    NVIDIA_API_KEY: str | None = None
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    settings = Settings()
    
    # Auto-fix URL format if possible
    if settings.SUPABASE_URL:
        url = settings.SUPABASE_URL.strip()
        if not url.startswith("http"):
            url = f"https://{url}"
        if url.endswith("/"):
            url = url[:-1]
        settings.SUPABASE_URL = url
        
    return settings
