from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="AI Code Review Assistant API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str
    language: str

@app.get("/")
def home():
    return {"message": "Welcome to AI Code Review Assistant Backend 🚀"}

@app.post("/review")
def review_code(request: CodeRequest):
    return {
        "language": request.language,
        "review": "Backend connected successfully! AI integration will be added in Day 3.",
        "code_length": len(request.code)
    }