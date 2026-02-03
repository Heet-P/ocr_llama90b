from doctr.io import DocumentFile
from doctr.models import ocr_predictor
import io
from functools import lru_cache
import asyncio

class OCRService:
    def __init__(self):
        # Load the model once (this might take time)
        print("Loading Doctr OCR model...")
        self.model = ocr_predictor(det_arch='db_resnet50', reco_arch='crnn_vgg16_bn', pretrained=True)
        print("Doctr OCR model loaded.")

    def process_pdf(self, file_content: bytes) -> dict:
        """
        Process PDF content bytes and return structured OCR data.
        """
        try:
            # Load document from bytes
            doc = DocumentFile.from_pdf(file_content)
            
            # Predict
            result = self.model(doc)
            
            # Serialize result to JSON-compatible dict
            return result.export()
        except Exception as e:
            print(f"OCR Error: {e}")
            raise e

# Global instance
_ocr_service = None

def get_ocr_service():
    global _ocr_service
    if _ocr_service is None:
        _ocr_service = OCRService()
    return _ocr_service

async def process_form_background(form_id: str, file_content: bytes):
    """
    Background task to process form OCR and update database.
    """
    from app.db.supabase import supabase
    
    try:
        print(f"Starting OCR for form {form_id}")
        
        # Update status to processing
        supabase.table("forms").update({"status": "processing"}).eq("id", form_id).execute()
        
        # Run OCR (CPU intensive, run in thread pool if needed, but for now direct)
        # Note: Doctr is synchronous. To avoid blocking the event loop, we should run it in an executor.
        ocr_service = get_ocr_service()
        
        loop = asyncio.get_event_loop()
        ocr_data = await loop.run_in_executor(None, ocr_service.process_pdf, file_content)
        
        # Run Analysis
        from app.core.form_parser.analyzer import analyzer
        schema = await analyzer.analyze_form(ocr_data)

        # Update database with result
        supabase.table("forms").update({
            "status": "ready", 
            "ocr_data": ocr_data,
            "form_schema": schema
        }).eq("id", form_id).execute()
        
        print(f"OCR & Analysis completed for form {form_id}")
        
    except Exception as e:
        print(f"Error processing form {form_id}: {e}")
        supabase.table("forms").update({
            "status": "error", 
            "ocr_data": {"error": str(e)}
        }).eq("id", form_id).execute()
