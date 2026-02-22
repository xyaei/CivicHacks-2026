"""
MongoDB aggregation-based analytics. Uses pipelines for efficiency (no full scan into Python).
Date filtering uses file_date (YYYY-MM-DD) when present.
"""
import logging
import statistics
from datetime import datetime, timedelta
from typing import Optional

from app.db import bail_collection
from app.services.crime_categories import categorize, CATEGORY_ORDER

logger = logging.getLogger(__name__)

# Bond buckets matching frontend labels
DISTRIBUTION_BOUNDS = [0, 2000, 5000, 10000, 25000, 50000, 1_000_000]
DISTRIBUTION_LABELS = [
    "$0-2K", "$2K-5K", "$5K-10K", "$10K-25K", "$25K-50K", "$50K+"
]


def _date_range_filter(days: Optional[int]):
    """Return a $match stage for file_date >= (today - days), or None for no filter."""
    if days is None:
        return {}
    start = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    return {"file_date": {"$gte": start}}


def _numeric_bonds(bonds):
    """Filter to numeric bond values (handle string or int from MongoDB)."""
    out = []
    for b in bonds:
        if b is None:
            continue
        try:
            n = float(b) if not isinstance(b, (int, float)) else b
            if n >= 0:
                out.append(n)
        except (TypeError, ValueError):
            continue
    return out


def get_summary(date_range: str):
    """
    Total cases, median bond, mean bond, most common crime.
    date_range: "30d" | "90d" | "6m" | "1y" | "2y" | "all".
    """
    try:
        days_map = {"30d": 30, "90d": 90, "6m": 180, "1y": 365, "2y": 730, "all": None}
        days = days_map.get(date_range, 30)
        match = _date_range_filter(days)
        pipeline = [{"$match": match}] if match else []
        pipeline.extend([
            {"$group": {"_id": None, "count": {"$sum": 1}, "bonds": {"$push": "$bond"}}},
            {"$limit": 1},
        ])
        cur = bail_collection.aggregate(pipeline)
        doc = next(cur, None)
        out = {"total_cases": 0, "median_bond": 0, "mean_bond": 0, "most_common_crime": ""}
        if doc:
            bonds = _numeric_bonds(doc.get("bonds") or [])
            out["total_cases"] = doc["count"]
            out["median_bond"] = round(statistics.median(bonds), 2) if len(bonds) > 0 else 0
            out["mean_bond"] = round(statistics.mean(bonds), 2) if len(bonds) > 0 else 0
        _add_most_common_crime(bail_collection, match, out)
        return out
    except Exception as e:
        logger.exception("get_summary failed")
        return {"total_cases": 0, "median_bond": 0, "mean_bond": 0, "most_common_crime": ""}


def _add_most_common_crime(coll, match_filter, out: dict):
    """Set out['most_common_crime'] from top crime by count in filtered cases."""
    try:
        pipeline = [{"$match": match_filter}] if match_filter else []
        pipeline.extend([
            {"$match": {"crime_committed": {"$exists": True, "$nin": [None, ""]}}},
            {"$group": {"_id": "$crime_committed", "n": {"$sum": 1}}},
            {"$sort": {"n": -1}},
            {"$limit": 1},
        ])
        cur = coll.aggregate(pipeline)
        top = next(cur, None)
        if top and top.get("_id"):
            out["most_common_crime"] = (top["_id"] or "").strip() or ""
    except Exception:
        pass


def _distribution_default():
    """Default distribution response (all zeros) when aggregation fails."""
    bound_to_label = {
        0: "$0-2K", 2000: "$2K-5K", 5000: "$5K-10K",
        10000: "$10K-25K", 25000: "$25K-50K", 50000: "$50K+",
    }
    return [{"range": bound_to_label[b], "count": 0} for b in [0, 2000, 5000, 10000, 25000, 50000]]


def get_distribution(date_range: str):
    """
    Count of cases per bond bucket. Returns list of { range, count }.
    Uses $convert so string bonds are coerced to double; on error returns zeros.
    """
    bound_to_label = {
        0: "$0-2K", 2000: "$2K-5K", 5000: "$5K-10K",
        10000: "$10K-25K", 25000: "$25K-50K", 50000: "$50K+",
    }
    try:
        days_map = {"30d": 30, "90d": 90, "6m": 180, "1y": 365, "2y": 730, "all": None}
        days = days_map.get(date_range, 30)
        match = _date_range_filter(days)
        pipeline = [{"$match": match}] if match else []
        # Coerce bond to double so string/number mix doesn't break $bucket
        pipeline.append({
            "$addFields": {
                "bondNum": {"$convert": {"input": "$bond", "to": "double", "onError": 0, "onNull": 0}},
            }
        })
        pipeline.append({
            "$match": {"bondNum": {"$gte": 0}},
        })
        pipeline.append({
            "$bucket": {
                "groupBy": "$bondNum",
                "boundaries": DISTRIBUTION_BOUNDS,
                "default": 50000,
                "output": {"count": {"$sum": 1}},
            }
        })
        cur = bail_collection.aggregate(pipeline)
        buckets = {}
        for r in cur:
            buckets[r["_id"]] = buckets.get(r["_id"], 0) + r["count"]
        return [
            {"range": bound_to_label[b], "count": buckets.get(b, 0)}
            for b in [0, 2000, 5000, 10000, 25000, 50000]
        ]
    except Exception as e:
        logger.exception("get_distribution failed: %s", e)
        return _distribution_default()


def _bond_to_bucket(bond_num: float) -> int:
    """Map numeric bond to bucket key (left edge)."""
    for i in range(len(DISTRIBUTION_BOUNDS) - 1):
        if DISTRIBUTION_BOUNDS[i] <= bond_num < DISTRIBUTION_BOUNDS[i + 1]:
            return DISTRIBUTION_BOUNDS[i]
    return 50000


def get_distribution_by_category(date_range: str) -> list:
    """
    Bail distribution grouped by crime category. Returns list of
    { category, count, histogram: [ { range, count } ] } in CATEGORY_ORDER.
    Uses crime_committed (or crime) and bond; categorizes in Python.
    """
    bound_to_label = {
        0: "$0-2K", 2000: "$2K-5K", 5000: "$5K-10K",
        10000: "$10K-25K", 25000: "$25K-50K", 50000: "$50K+",
    }
    bucket_keys = [0, 2000, 5000, 10000, 25000, 50000]
    try:
        days_map = {"30d": 30, "90d": 90, "6m": 180, "1y": 365, "2y": 730, "all": None}
        days = days_map.get(date_range, 30)
        match = _date_range_filter(days)
        pipeline = [{"$match": match}] if match else []
        pipeline.extend([
            {"$addFields": {
                "bondNum": {"$convert": {"input": "$bond", "to": "double", "onError": 0, "onNull": 0}},
                "crime": {"$ifNull": ["$crime_committed", {"$ifNull": ["$crime", ""]}]},
            }},
            {"$match": {"bondNum": {"$gte": 0}}},
            {"$project": {"crime": 1, "bondNum": 1}},
        ])
        # by_category[cat] = { "count": n, "buckets": { 0: n0, 2000: n1, ... } }
        by_category = {}
        for doc in bail_collection.aggregate(pipeline):
            crime = (doc.get("crime") or "").strip()
            bond = doc.get("bondNum", 0)
            cat = categorize(crime)
            if cat not in by_category:
                by_category[cat] = {"count": 0, "buckets": {k: 0 for k in bucket_keys}}
            by_category[cat]["count"] += 1
            b = _bond_to_bucket(bond)
            by_category[cat]["buckets"][b] = by_category[cat]["buckets"].get(b, 0) + 1
        out = []
        for cat in CATEGORY_ORDER:
            data = by_category.get(cat, {"count": 0, "buckets": {k: 0 for k in bucket_keys}})
            out.append({
                "category": cat,
                "count": data["count"],
                "histogram": [{"range": bound_to_label[k], "count": data["buckets"].get(k, 0)} for k in bucket_keys],
            })
        return out
    except Exception as e:
        logger.exception("get_distribution_by_category failed: %s", e)
        return [{"category": c, "count": 0, "histogram": [{"range": bound_to_label[b], "count": 0} for b in bucket_keys]} for c in CATEGORY_ORDER]


def get_judges_list():
    """Distinct judge names, sorted. Returns empty list on error or if no judges."""
    try:
        pipeline = [
            {"$match": {"judge": {"$exists": True, "$nin": [None, ""]}}},
            {"$group": {"_id": "$judge"}},
            {"$sort": {"_id": 1}},
            {"$project": {"_id": 0, "name": "$_id"}},
        ]
        names = []
        for r in bail_collection.aggregate(pipeline):
            n = r.get("name") or r.get("_id")
            if n and str(n).strip():
                names.append(n if isinstance(n, str) else str(n))
        return names
    except Exception:
        logger.exception("get_judges_list failed")
        return []


def _norm(s: str) -> str:
    """Normalize for comparison: strip and collapse internal whitespace."""
    if s is None:
        return ""
    return " ".join(str(s).strip().split())


def get_judge_stats(judge: str):
    """
    For one judge: median bail by crime (your), court median by crime (court_avg),
    and peer median (other judges' median for same crime). Returns structure for JudgeDashboard.
    """
    if not judge or not str(judge).strip():
        return {"bailComparison": [], "trendData": [], "judge": judge or ""}
    judge = str(judge).strip()
    judge_norm = _norm(judge)
    try:
        # Normalize crime field (DB may use crime_committed or crime)
        pipeline = [
            {"$match": {"judge": {"$exists": True, "$nin": [None, ""]}, "bond": {"$exists": True}}},
            {"$addFields": {"_crime": {"$ifNull": ["$crime_committed", {"$ifNull": ["$crime", ""]}]}}},
            {"$match": {"_crime": {"$nin": [None, ""]}}},
            {"$group": {
                "_id": {"crime": "$_crime", "judge": "$judge"},
                "bonds": {"$push": "$bond"},
            }},
        ]
        cur = bail_collection.aggregate(pipeline)
        # (crime, judge) -> list of bonds; compare using normalized judge name
        by_crime_judge = {}
        for r in cur:
            c, j = r["_id"].get("crime"), r["_id"].get("judge")
            if c is None and j is None:
                continue
            if c not in by_crime_judge:
                by_crime_judge[c] = {}
            by_crime_judge[c][j] = r["bonds"]

        def med(bonds):
            nums = _numeric_bonds(bonds) if bonds else []
            return round(statistics.median(nums), 2) if nums else 0

        crime_judge_median = {}
        for crime, judges in by_crime_judge.items():
            for j, bonds in judges.items():
                crime_judge_median[(crime, j)] = med(bonds)

        court_median_by_crime = {}
        for crime, judges in by_crime_judge.items():
            all_bonds = []
            for bonds in judges.values():
                all_bonds.extend(bonds)
            court_median_by_crime[crime] = med(all_bonds)

        your_by_crime = {}
        peers_by_crime = {}
        for (c, j), m in crime_judge_median.items():
            court_m = court_median_by_crime.get(c, 0)
            if _norm(j) == judge_norm:
                your_by_crime[c] = {"your": m, "court_avg": court_m}
            else:
                if c not in peers_by_crime:
                    peers_by_crime[c] = []
                peers_by_crime[c].append(m)

        def peer_med(crime):
            arr = peers_by_crime.get(crime, [])
            return round(statistics.median(arr), 2) if len(arr) > 0 else court_median_by_crime.get(crime, 0)

        # Only show charges this judge has actually decided (your_by_crime)
        categories = sorted(your_by_crime.keys())
        bail_comparison = []
        for crime in categories[:8]:
            your = your_by_crime[crime]["your"]
            court_avg = court_median_by_crime.get(crime, 0)
            peers = peer_med(crime)
            label = (crime[:40] + "…") if crime and len(crime) > 40 else (crime or "Unknown")
            bail_comparison.append({
                "category": label,
                "your": your,
                "peers": peers,
                "courtAvg": court_avg,
            })

        # If no per-crime data (e.g. no crime_committed in DB), fall back to overall judge vs court median
        if not bail_comparison and (your_by_crime or court_median_by_crime or by_crime_judge):
            all_bonds_judge = []
            all_bonds_court = []
            for judges in by_crime_judge.values():
                for j, bonds in judges.items():
                    all_bonds_court.extend(bonds)
                    if _norm(j) == judge_norm:
                        all_bonds_judge.extend(bonds)
            if all_bonds_judge or all_bonds_court:
                bail_comparison = [{
                    "category": "All charges",
                    "your": med(all_bonds_judge) if all_bonds_judge else 0,
                    "peers": med(all_bonds_court) if all_bonds_court else 0,
                    "courtAvg": med(all_bonds_court) if all_bonds_court else 0,
                }]
        elif not bail_comparison:
            # Still empty: try simple group by judge only (no crime)
            try:
                pipe_judge = [{"$match": {"judge": {"$exists": True}}}, {"$group": {"_id": "$judge", "bonds": {"$push": "$bond"}}}]
                for r in bail_collection.aggregate(pipe_judge):
                    j = r.get("_id")
                    if j and _norm(j) == judge_norm:
                        bonds = _numeric_bonds(r.get("bonds") or [])
                        pipe_court = [{"$match": {"bond": {"$exists": True}}}, {"$group": {"_id": None, "bonds": {"$push": "$bond"}}}]
                        court_doc = next(bail_collection.aggregate(pipe_court), None)
                        court_bonds = _numeric_bonds(court_doc.get("bonds", []) or []) if court_doc else []
                        bail_comparison = [{
                            "category": "All charges",
                            "your": round(statistics.median(bonds), 2) if bonds else 0,
                            "peers": round(statistics.median(court_bonds), 2) if court_bonds else 0,
                            "courtAvg": round(statistics.median(court_bonds), 2) if court_bonds else 0,
                        }]
                        break
            except Exception:
                pass

        # Use exact judge string as stored in DB for trend (in case of spacing differences)
        judge_db = next((j for (c, j) in crime_judge_median if _norm(j) == judge_norm), judge)
        pipeline_trend = [
            {"$match": {"judge": judge_db, "file_date": {"$exists": True}}},
            {"$addFields": {"month": {"$substr": ["$file_date", 0, 7]}}},
            {"$group": {"_id": "$month", "bonds": {"$push": "$bond"}}},
            {"$sort": {"_id": 1}},
            {"$limit": 12},
        ]
        your_trend = {}
        for r in bail_collection.aggregate(pipeline_trend):
            nums = _numeric_bonds(r.get("bonds") or [])
            your_trend[r["_id"]] = round(statistics.median(nums), 2) if nums else 0

        pipeline_court = [
            {"$match": {"file_date": {"$exists": True}}},
            {"$addFields": {"month": {"$substr": ["$file_date", 0, 7]}}},
            {"$group": {"_id": "$month", "bonds": {"$push": "$bond"}}},
            {"$sort": {"_id": 1}},
        ]
        court_trend = {}
        for r in bail_collection.aggregate(pipeline_court):
            nums = _numeric_bonds(r.get("bonds") or [])
            court_trend[r["_id"]] = round(statistics.median(nums), 2) if nums else 0

        months = sorted(set(your_trend) | set(court_trend))[-12:]
        trend_data = [
            {
                "label": m[5:7] if len(m) >= 7 else m,
                "your": your_trend.get(m, 0),
                "peers": court_trend.get(m, 0),
            }
            for m in months
        ]

        return {
            "bailComparison": bail_comparison,
            "trendData": trend_data,
            "judge": judge,
        }
    except Exception:
        logger.exception("get_judge_stats failed")
        return {"bailComparison": [], "trendData": [], "judge": judge}
