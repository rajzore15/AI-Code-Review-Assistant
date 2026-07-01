from fastapi import FastAPI

app = FastAPI(
    title="AI Code Review Assistant API",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Welcome to AI Code Review Assistant Backend 🚀"
    }