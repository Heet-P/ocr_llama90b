from app.core.llm.gemini_client import gemini_client
import json

class FormAnalyzer:
    def __init__(self):
        self.llm = gemini_client

    def _ocr_to_text(self, ocr_data: dict) -> str:
        """
        Convert OCR data to simple text representation for the LLM.
        Handled new simple format {"text": "..."} or legacy Doctr format.
        """
        # New simplified format from NVIDIA NIM
        if isinstance(ocr_data, dict) and 'text' in ocr_data:
            return ocr_data['text']
            
        # Fallback/Legacy Doctr format
        text_content = ""
        try:
            pages = ocr_data.get('pages', [])
            for page in pages:
                blocks = page.get('blocks', [])
                for block in blocks:
                    lines = block.get('lines', [])
                    for line in lines:
                        words = line.get('words', [])
                        line_text = " ".join([w.get('value', '') for w in words])
                        text_content += line_text + "\n"
                    text_content += "\n"
        except Exception as e:
            text_content = str(ocr_data) # Global fallback
            
        return text_content

    async def analyze_form(self, ocr_data: dict) -> dict:
        text_context = self._ocr_to_text(ocr_data)
        
        prompt = f"""
        You are an expert form analyst. Analyze the following text extracted from a PDF form and generate a JSON schema representing the fields.
        
        FORM TEXT:
        {text_context}
        
        INSTRUCTIONS:
        1. Identify all questions/fields that specific information is requested for.
        2. Infer the field type (text, number, date, boolean, select).
        3. Create a helpful question for each field.
        4. Return ONLY valid JSON.
        
        OUTPUT FORMAT:
        {{
            "fields": [
                {{
                    "id": "field_unique_id",
                    "label": "Original Label",
                    "question": "Chatbot Question",
                    "type": "text",
                    "required": true
                }}
            ],
            "title": "Form Title",
            "description": "Form Description"
        }}
        """
        
        response_text = await self.llm.generate_content(prompt)
        
        # Clean response (remove markdown code blocks if present)
        cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            print("Failed to parse Gemini response as JSON")
            return {"error": "Failed to parse schema", "raw_response": response_text}

analyzer = FormAnalyzer()
