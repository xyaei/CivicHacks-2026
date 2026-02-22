from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import analytics
from app.routes import chat

app = FastAPI(title="JusticeHack Bail Analytics API")

# 🔥 CORS (REQUIRED for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing analytics routes
app.include_router(analytics.router)

# New chat route
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Bail Analytics API. Use /analytics/* endpoints."}