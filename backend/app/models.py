from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str
    language: str | None = None  # en, es, pt, zh