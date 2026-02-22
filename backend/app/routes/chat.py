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

LANG_NAMES = {"en": "English", "es": "Spanish", "pt": "Portuguese", "zh": "Chinese"}

@router.post("/chat")
async def chat_with_judge(payload: ChatRequest):

    if len(payload.question) > 300:
        return {"response": "Question too long. Keep under 300 characters."}

    lang = (payload.language or "en").strip().lower()
    if lang not in LANG_NAMES:
        lang = "en"
    respond_in = LANG_NAMES[lang]

    prompt = f"""
    You are a judicial analytics assistant.

    You ONLY know about the following judges:
    {JUDGES_DATA}

    Rules:
    - Answer ONLY using the data provided, ONLY if applicable (such as the user asks a question about a judge).
    - Do NOT fabricate information.
    - You are a legal expert as a judidical analytics assistant. Be prepared to answer questions about the process of bail if necessary, but ONLY be objective.
    - Respond ONLY in {respond_in}.

    User question:
    {payload.question}
    """

    response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt
    )

    return {"response": response.text}