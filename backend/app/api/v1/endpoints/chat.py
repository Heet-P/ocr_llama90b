from fastapi import APIRouter, HTTPException, Body
from app.services.chat_service import chat_service
from pydantic import BaseModel

router = APIRouter()

class StartChatRequest(BaseModel):
    form_id: str

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str

@router.post("/start")
async def start_chat(request: StartChatRequest):
    try:
        return await chat_service.create_session(request.form_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/message")
async def send_message(request: ChatMessageRequest):
    try:
        return await chat_service.process_message(request.session_id, request.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
