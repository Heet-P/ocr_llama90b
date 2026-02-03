from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from app.api.v1.endpoints import forms, chat, pdf

load_dotenv()

app = FastAPI(title="PDF Form Assistant API", version="0.1.0")

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
    "https://*.vercel.app",   # Vercel deployments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router, prefix="/api/v1/forms", tags=["forms"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(pdf.router, prefix="/api/v1/pdf", tags=["pdf"])

@app.get("/")
async def root():
    return {"message": "Welcome to PDF Form Assistant API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
