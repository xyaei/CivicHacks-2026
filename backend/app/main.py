from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import analytics
from app.routes import chat
from app.routes import tts

app = FastAPI(title="JusticeHack Bail Analytics API")

# CORS: allow common dev origins (Vite often uses 5173; also 3000 and 127.0.0.1)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing analytics routes
app.include_router(analytics.router)

# Chat and TTS
app.include_router(chat.router)
app.include_router(tts.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Bail Analytics API. Use /analytics/* endpoints."}