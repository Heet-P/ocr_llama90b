import google.generativeai as genai
from app.core.config import get_settings

settings = get_settings()

class GeminiClient:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        # Switching to the stable alias 'gemini-flash-latest' to avoid quota issues with experimental models
        self.model = genai.GenerativeModel('gemini-flash-latest')

    async def generate_content(self, prompt: str) -> str:
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini Error: {e}")
            raise e

gemini_client = GeminiClient()
