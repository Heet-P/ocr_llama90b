import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

try:
    from app.db.supabase import supabase
    print("Supabase client initialized.")
    
    print(f"URL: {supabase.supabase_url}")
    
    # Test Storage Upload
    print("Testing Storage Upload...")
    try:
        supabase.storage.from_("pdf-forms").upload("test.txt", b"Hello World", {"content-type": "text/plain"})
        print("Upload Successful!")
    except Exception as e:
        if "Duplicate" in str(e) or "already exists" in str(e):
             print("Upload Successful (File already exists)!")
        else:
             raise e
             
    print("Verification Successful!")
except Exception as e:
    print(f"Verification Failed: {e}")
    import traceback
    traceback.print_exc()
