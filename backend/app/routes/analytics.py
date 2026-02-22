from fastapi import APIRouter
from app.services import bias, outliers

from app.services.ai_briefs import generate_outlier_brief
from fastapi import Query

router = APIRouter(prefix="/analytics")


# Endpoint for bias summary
@router.get("/bias-summary")
def bias_summary():
    return bias.compute_bias_metrics()

# Endpoint for judge outliers
@router.get("/outliers")
def judge_outliers():
    return outliers.detect_judge_outliers()

@router.get("/outlier-brief")
def get_outlier_brief(
    judge: str,
    crime: str,
    judge_median: float,
    court_median: float
):
    return generate_outlier_brief(
        judge, crime, judge_median, court_median
    )