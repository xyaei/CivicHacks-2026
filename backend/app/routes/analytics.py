from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import bias, outliers
from app.services.ai_briefs import generate_outlier_brief
from typing import Any

router = APIRouter(prefix="/analytics")


@router.get("/bias-summary")
def bias_summary():
    return bias.compute_bias_metrics()


@router.get("/outliers")
def judge_outliers():
    return outliers.detect_judge_outliers()


class JudgeRequest(BaseModel):
    judge: str


@router.post("/ai_briefs")
def ai_brief(req: JudgeRequest):
    """
    Given a judge name, return an AI-generated brief for one of their high-outlier cases.
    """
    # Force type hint: list of dicts with string keys and any values
    outliers_list: list[dict[str, Any]] = outliers.detect_judge_outliers()  # type: ignore

    judge_outliers = [o for o in outliers_list if o.get("judge") == req.judge]

    if not judge_outliers:
        raise HTTPException(status_code=404, detail="No outlier found for this judge.")

    case = judge_outliers[0]

    brief = generate_outlier_brief(
        judge=case.get("judge", "Unknown"),
        crime=case.get("crime_committed", "Unknown"),
        judge_median=case.get("judge_median", 0),
        court_median=case.get("court_median", 0)
    )

    return brief