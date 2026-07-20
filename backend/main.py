from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI(
    title="AI Code Review Assistant API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-code-review-assistant-two-olive.vercel.app",
    ],
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
    prompt = f"""
You are an expert code reviewer.

Language: {request.language}

Review the following code and provide:

1. Errors
2. Improvements
3. Best Practices
4. Optimized Version (if needed)

Code:
{request.code}
"""

    try:
        response = model.generate_content(prompt)

        return {
            "language": request.language,
            "review": response.text,
            "code_length": len(request.code)
        }

    except Exception as e:
        return {
            "error": str(e)
        }