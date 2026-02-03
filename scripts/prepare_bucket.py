import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

try:
    from app.db.supabase import supabase
    
    BUCKET_NAME = "pdf-forms"
    
    print(f"Checking for bucket: {BUCKET_NAME}")
    buckets = supabase.storage.list_buckets()
    bucket_names = [b.name for b in buckets]
    
    if BUCKET_NAME not in bucket_names:
        print(f"Bucket '{BUCKET_NAME}' not found. Attempting to create...")
        # Create public bucket
        supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
        print(f"Bucket '{BUCKET_NAME}' created successfully!")
    else:
        print(f"Bucket '{BUCKET_NAME}' already exists.")
        
    print("Verification Done.")

except Exception as e:
    print(f"Error: {e}")
    # If creation fails, it might be permissions (Service Role needed for bucket creation? Or just auth)
    # The client uses anon key usually? No, creation usually needs service_role.
    # But usually authenticated users can upload if RLS allows. 
    # Creating bucket usually requires higher privileges.
    # We will see.
