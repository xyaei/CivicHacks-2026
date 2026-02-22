import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

# Create client
client = genai.Client(api_key=GEMINI_API_KEY)


LANG_NAMES = {"en": "English", "es": "Spanish", "pt": "Portuguese", "zh": "Chinese"}


def generate_outlier_brief(
    judge: str,
    crime: str,
    judge_median: float,
    court_median: float,
    language: str | None = None,
):
    ratio = round(judge_median / court_median, 2) if court_median > 0 else "N/A"
    lang = (language or "en").strip().lower() if language else "en"
    if lang not in LANG_NAMES:
        lang = "en"
    respond_in = LANG_NAMES[lang]

    prompt = f"""
You are analyzing judicial bail data.

Judge: {judge}
Crime: {crime}
Judge median bond: {judge_median}
Court median bond: {court_median}
Ratio compared to court median: {ratio}x

Write a neutral 3 sentence explanation of this difference in {respond_in} only.
Do not speculate. Only describe the numerical comparison.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return {
        "judge": judge,
        "crime_committed": crime,
        "judge_median": judge_median,
        "court_median": court_median,
        "ratio": ratio,
        "ai_summary": response.text,
    }