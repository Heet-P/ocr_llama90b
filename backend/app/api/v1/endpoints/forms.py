from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
from app.db.supabase import supabase
from app.core.ocr import process_form_background
import uuid

router = APIRouter()

@router.post("/upload", response_model=dict)
async def upload_form(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        # Generate unique filename
        file_ext = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        
        # Read file content
        content = await file.read()
        
        # Upload to Supabase Storage
        res = supabase.storage.from_("pdf-forms").upload(
            file_name,
            content,
            {"content-type": "application/pdf"}
        )
        
        # Get Public URL
        public_url = supabase.storage.from_("pdf-forms").get_public_url(file_name)
        
        # Insert into Database
        form_data = {
            "name": file.filename,
            "file_path": file_name,
            "url": public_url,
            "content_type": file.content_type,
            "file_size": len(content),
            "status": "uploaded"
        }
        
        data = supabase.table("forms").insert(form_data).execute()
        form_id = data.data[0]['id']
        
        # Trigger Background OCR
        background_tasks.add_task(process_form_background, form_id, content)
        
        return {"message": "Form uploaded successfully, processing started", "form": data.data[0]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{form_id}")
async def get_form(form_id: str):
    try:
        data = supabase.table("forms").select("*").eq("id", form_id).single().execute()
        if not data.data:
            raise HTTPException(status_code=404, detail="Form not found")
        return data.data
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
