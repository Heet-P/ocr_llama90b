from supabase import create_client, Client
from app.core.config import get_settings

settings = get_settings()

try:
    print(f"Initializing Supabase Client with URL: {settings.SUPABASE_URL}")
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
except Exception as e:
    print(f"Supabase Client Init Error: {e}")
    raise e

