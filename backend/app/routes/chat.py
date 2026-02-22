from fastapi import APIRouter
from app.models import ChatRequest
from app.judges_data import JUDGES_DATA
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize Gemini here (simplest for hackathon)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/chat")
async def chat_with_judge(payload: ChatRequest):

    if len(payload.question) > 300:
        return {"response": "Question too long. Keep under 300 characters."}

    prompt = f"""
    You are a judicial analytics assistant.

    You ONLY know about the following judges:
    {JUDGES_DATA}

    Rules:
    - Answer ONLY using the data provided.
    - Do NOT fabricate information.
    - If question is outside this data, say you don't have that information.

    User question:
    {payload.question}
    """

    response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents=prompt
    )

    return {"response": response.text}