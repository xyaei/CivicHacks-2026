from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Any

from app.services import bias, outliers
from app.services.aggregations import (
    get_summary,
    get_distribution,
    get_distribution_by_category,
    get_judges_list,
    get_judge_stats,
    get_top_judge,
)
from app.services.csv_heatmap import (
    get_heatmap_from_csv,
    get_summary_from_csv,
    get_distribution_from_csv,
    get_distribution_by_category_from_csv,
    get_judges_list_from_csv,
    get_judge_stats_from_csv,
    get_top_judge_from_csv,
    get_recent_record_ids,
)
from app.services.ai_briefs import generate_outlier_brief

router = APIRouter(prefix="/analytics")


def _summary(date_range: str):
    """MongoDB first; fall back to CSV when MongoDB fails or returns no data."""
    try:
        out = get_summary(date_range)
        if out.get("total_cases", 0) > 0:
            return out
    except Exception:
        pass
    return get_summary_from_csv(date_range)


def _distribution(date_range: str):
    """MongoDB first; fall back to CSV when MongoDB fails or returns all zeros."""
    try:
        out = get_distribution(date_range)
        if any(r.get("count", 0) > 0 for r in out):
            return out
    except Exception:
        pass
    return get_distribution_from_csv(date_range)


def _distribution_by_category(date_range: str):
    """MongoDB first; fall back to CSV when MongoDB fails or all categories empty."""
    try:
        out = get_distribution_by_category(date_range)
        if any(c.get("count", 0) > 0 for c in out):
            return out
    except Exception:
        pass
    return get_distribution_by_category_from_csv(date_range)


def _judges():
    """MongoDB first; fall back to CSV when MongoDB fails or returns empty list."""
    try:
        out = get_judges_list()
        if out:
            return out
    except Exception:
        pass
    return get_judges_list_from_csv()


def _judge_stats(judge: str, date_range: str = "all"):
    """MongoDB first; fall back to CSV when MongoDB fails or returns no comparison."""
    try:
        out = get_judge_stats(judge, date_range)
        if out.get("bailComparison") or out.get("trendData"):
            return out
    except Exception:
        pass
    return get_judge_stats_from_csv(judge, date_range)


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


@router.get("/outlier-brief")
def get_outlier_brief(
    judge: str,
    crime: str,
    judge_median: float,
    court_median: float,
    language: str = Query("en", description="en, es, pt, zh"),
):
    return generate_outlier_brief(
        judge, crime, judge_median, court_median, language=language
    )


@router.get("/summary")
def summary(date_range: str = Query("30d", description="30d | 90d | 6m | 1y | 2y | all")):
    return _summary(date_range)


@router.get("/distribution")
def distribution(date_range: str = Query("30d", description="30d | 90d | 6m | 1y | 2y | all")):
    return _distribution(date_range)


@router.get("/distribution-by-category")
def distribution_by_category(date_range: str = Query("30d", description="30d | 90d | 6m | 1y | 2y | all")):
    return _distribution_by_category(date_range)


@router.get("/judges")
def judges():
    return _judges()


def _top_judge():
    try:
        name = get_top_judge()
        if name:
            return name
    except Exception:
        pass
    return get_top_judge_from_csv() or ""


@router.get("/top-judge")
def top_judge():
    return {"name": _top_judge()}


@router.get("/judge-stats")
def judge_stats(
    judge: str = Query(..., description="Judge full name"),
    date_range: str = Query("all", description="30d | 90d | 6m | 1y | 2y | all"),
):
    return _judge_stats(judge, date_range)


@router.get("/heatmap")
def heatmap(date_range: str = Query("all", description="30d | 90d | 6m | 1y | 2y | all")):
    return get_heatmap_from_csv(date_range)


@router.get("/recent-record-ids")
def recent_record_ids(limit: int = Query(10, ge=1, le=20)):
    """Last N record IDs (MA-{id}) for blockchain sidebar."""
    return {"record_ids": get_recent_record_ids(limit)}
