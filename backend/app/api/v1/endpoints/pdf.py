from fastapi import APIRouter, HTTPException
from app.core.pdf.writer import pdf_writer
from pydantic import BaseModel

router = APIRouter()

class GeneratePDFRequest(BaseModel):
    form_id: str
    session_id: str

@router.post("/generate")
async def generate_pdf(request: GeneratePDFRequest):
    try:
        url = await pdf_writer.fill_pdf(request.form_id, request.session_id)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
