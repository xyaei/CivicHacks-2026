"""
Heatmap data from query_result_cleaned.csv with cleaned, consistent court → county
and court → Boston neighborhood mapping. Supports date_range filtering (30d, 90d, 6m, 1y, 2y, all).
"""
import csv
import statistics
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

from app.services.crime_categories import categorize, CATEGORY_ORDER

# Canonical court_division (normalized) → Massachusetts county
COURT_TO_COUNTY = {
    "northern berkshire district court": "Berkshire",
    "southern berkshire district court": "Berkshire",
    "pittsfield district court": "Berkshire",
    "greenfield district court": "Franklin",
    "orange district court": "Franklin",
    "eastern hampshire district court": "Hampshire",
    "northampton district court": "Hampshire",
    "palmer district court": "Hampden",
    "springfield district court": "Hampden",
    "chicopee district court": "Hampden",
    "holyoke district court": "Hampden",
    "westfield district court": "Hampden",
    "worcester district court": "Worcester",
    "fitchburg district court": "Worcester",
    "dudley district court": "Worcester",
    "westborough district court": "Worcester",
    "milford district court": "Worcester",
    "winchendon district court": "Worcester",
    "leominster district court": "Worcester",
    "east brookfield district court": "Worcester",
    "clinton district court": "Worcester",
    "gardner district court": "Worcester",
    "uxbridge district court": "Worcester",
    "lowell district court": "Middlesex",
    "cambridge district court": "Middlesex",
    "woburn district court": "Middlesex",
    "framingham district court": "Middlesex",
    "somerville district court": "Middlesex",
    "marlborough district court": "Middlesex",
    "natick district court": "Middlesex",
    "malden district court": "Middlesex",
    "waltham district court": "Middlesex",
    "newton district court": "Middlesex",
    "ayer district court": "Middlesex",
    "salem district court": "Essex",
    "lynn district court": "Essex",
    "newburyport district court": "Essex",
    "lawrence district court": "Essex",
    "peabody district court": "Essex",
    "gloucester district court": "Essex",
    "ipswich district court": "Essex",
    "chelsea district court": "Suffolk",
    "dedham district court": "Norfolk",
    "quincy district court": "Norfolk",
    "stoughton district court": "Norfolk",
    "wrentham district court": "Norfolk",
    "brookline district court": "Norfolk",
    "hingham district court": "Norfolk",
    "fall river district court": "Bristol",
    "new bedford district court": "Bristol",
    "taunton district court": "Bristol",
    "attleboro district court": "Bristol",
    "wareham district court": "Plymouth",
    "brockton district court": "Plymouth",
    "plymouth district court": "Plymouth",
    "barnstable district court": "Barnstable",
    "orleans district court": "Barnstable",
    "falmouth district court": "Barnstable",
    "edgartown district court": "Dukes",
    "nantucket district court": "Nantucket",
}

# BMC courts → Boston neighborhood (display names matching BostonMapInteractive)
COURT_TO_BOSTON = {
    "bmc brighton": "Allston-Brighton",
    "bmc central": "Central",
    "bmc charlestown": "Charlestown",
    "bmc dorchester": "North Dorchester",
    "bmc east boston": "East Boston",
    "bmc roxbury": "Roxbury",
    "bmc south boston": "South Boston",
    "bmc west roxbury": "West Roxbury",
}

# MA counties in display order
COUNTIES_ORDER = [
    "Berkshire", "Franklin", "Hampshire", "Hampden", "Worcester",
    "Middlesex", "Essex", "Suffolk", "Norfolk", "Bristol", "Plymouth",
    "Barnstable", "Dukes", "Nantucket",
]

# Boston neighborhoods in display order (for consistent response)
BOSTON_ORDER = [
    "Allston-Brighton", "Central", "Charlestown", "East Boston", "Roxbury",
    "North Dorchester", "South Boston", "West Roxbury",
]


def _normalize(s: str) -> str:
    return (s or "").strip().lower()


def _parse_date(s: str):
    if not s:
        return None
    s = s.strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(s[:10], fmt)
        except ValueError:
            continue
    return None


def _date_in_range(file_date_str, days: int | None, today: datetime) -> bool:
    if days is None:
        return True
    d = _parse_date(file_date_str)
    if not d:
        return False
    start = (today - timedelta(days=days)).date()
    return d.date() >= start


def _load_csv():
    path = Path(__file__).resolve().parent.parent.parent / "query_result_cleaned.csv"
    if not path.exists():
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def get_recent_record_ids(limit: int = 10) -> list[str]:
    """Return last N record IDs from CSV as MA-{id} for blockchain verify."""
    rows = _load_csv()
    if not rows:
        return []
    tail = rows[-limit:] if len(rows) >= limit else rows
    out = []
    for r in tail:
        raw_id = (r.get("id") or "").strip()
        if raw_id:
            out.append(f"MA-{raw_id}")
    return list(reversed(out))  # oldest of the 10 first, so "last 10" order


# Buckets for distribution (match backend aggregations)
_DIST_BOUNDS = [0, 2000, 5000, 10000, 25000, 50000, 1_000_000]
_DIST_LABELS = {"0": "$0-2K", "2000": "$2K-5K", "5000": "$5K-10K", "10000": "$10K-25K", "25000": "$25K-50K", "50000": "$50K+"}


def _filter_rows_by_date(rows: list, date_range: str) -> list:
    days_map = {"30d": 30, "90d": 90, "6m": 180, "1y": 365, "2y": 730, "all": None}
    days = days_map.get(date_range, None)
    today = datetime.utcnow()
    return [r for r in rows if _date_in_range(r.get("file_date") or r.get("date") or "", days, today)]


def _bond_val(r: dict) -> float | None:
    raw = (r.get("bond") or "").strip()
    if not raw:
        return None
    try:
        v = float(raw)
        return v if v >= 0 else None
    except ValueError:
        return None


def get_summary_from_csv(date_range: str) -> dict:
    """Summary from CSV when MongoDB is unavailable or empty."""
    rows = _load_csv()
    filtered = _filter_rows_by_date(rows, date_range)
    bonds = []
    crimes = []
    for r in filtered:
        b = _bond_val(r)
        if b is not None:
            bonds.append(b)
        c = (r.get("crime_committed") or r.get("crime") or "").strip()
        if c:
            crimes.append(c)
    n = len(bonds)
    if n == 0:
        return {"total_cases": 0, "median_bond": 0, "mean_bond": 0, "most_common_crime": ""}
    median_bond = round(statistics.median(bonds), 2)
    mean_bond = round(statistics.mean(bonds), 2)
    most_common = ""
    if crimes:
        counts = {}
        for c in crimes:
            counts[c] = counts.get(c, 0) + 1
        most_common = max(counts, key=counts.get)
    return {"total_cases": n, "median_bond": median_bond, "mean_bond": mean_bond, "most_common_crime": most_common}


def get_distribution_from_csv(date_range: str) -> list:
    """Bond bucket counts from CSV."""
    rows = _load_csv()
    filtered = _filter_rows_by_date(rows, date_range)
    buckets = {0: 0, 2000: 0, 5000: 0, 10000: 0, 25000: 0, 50000: 0}
    for r in filtered:
        b = _bond_val(r)
        if b is None:
            continue
        for i in range(len(_DIST_BOUNDS) - 1):
            if _DIST_BOUNDS[i] <= b < _DIST_BOUNDS[i + 1]:
                buckets[_DIST_BOUNDS[i]] = buckets.get(_DIST_BOUNDS[i], 0) + 1
                break
        else:
            buckets[50000] = buckets.get(50000, 0) + 1
    return [{"range": _DIST_LABELS[str(k)], "count": buckets[k]} for k in [0, 2000, 5000, 10000, 25000, 50000]]


def _bond_to_bucket(bond_num: float) -> int:
    for i in range(len(_DIST_BOUNDS) - 1):
        if _DIST_BOUNDS[i] <= bond_num < _DIST_BOUNDS[i + 1]:
            return _DIST_BOUNDS[i]
    return 50000


def get_distribution_by_category_from_csv(date_range: str) -> list:
    """Bail distribution by crime category from CSV. Same shape as get_distribution_by_category."""
    bucket_keys = [0, 2000, 5000, 10000, 25000, 50000]
    rows = _load_csv()
    filtered = _filter_rows_by_date(rows, date_range)
    by_category = {}
    for r in filtered:
        b = _bond_val(r)
        if b is None:
            continue
        crime = (r.get("crime_committed") or r.get("crime") or "").strip()
        cat = categorize(crime)
        if cat not in by_category:
            by_category[cat] = {"count": 0, "buckets": {k: 0 for k in bucket_keys}}
        by_category[cat]["count"] += 1
        bk = _bond_to_bucket(b)
        by_category[cat]["buckets"][bk] = by_category[cat]["buckets"].get(bk, 0) + 1
    out = []
    for cat in CATEGORY_ORDER:
        data = by_category.get(cat, {"count": 0, "buckets": {k: 0 for k in bucket_keys}})
        out.append({
            "category": cat,
            "count": data["count"],
            "histogram": [{"range": _DIST_LABELS[str(k)], "count": data["buckets"].get(k, 0)} for k in bucket_keys],
        })
    return out


def get_judges_list_from_csv() -> list:
    """Distinct judges from CSV."""
    rows = _load_csv()
    seen = set()
    out = []
    for r in rows:
        j = (r.get("judge") or "").strip()
        if j and j not in seen:
            seen.add(j)
            out.append(j)
    return sorted(out)


def get_top_judge_from_csv() -> str:
    """Judge with the most cases from CSV. For demo sign-in."""
    rows = _load_csv()
    counts = {}
    for r in rows:
        j = (r.get("judge") or "").strip()
        if j:
            counts[j] = counts.get(j, 0) + 1
    if not counts:
        return ""
    return max(counts, key=counts.get)


def _norm_judge(s: str) -> str:
    return " ".join((s or "").strip().split())


def get_judge_stats_from_csv(judge: str, date_range: str = "all") -> dict:
    """Per-judge bail comparison from CSV when MongoDB is unavailable. date_range: 30d, 90d, 6m, 1y, 2y, all."""
    judge = (judge or "").strip()
    if not judge:
        return {"bailComparison": [], "trendData": [], "judge": judge}
    judge_n = _norm_judge(judge)
    rows = _load_csv()
    rows = _filter_rows_by_date(rows, date_range)
    by_crime_judge = {}
    for r in rows:
        j = (r.get("judge") or "").strip()
        b = _bond_val(r)
        if b is None:
            continue
        c = (r.get("crime_committed") or r.get("crime") or "Unknown").strip() or "Unknown"
        if c not in by_crime_judge:
            by_crime_judge[c] = {}
        if j not in by_crime_judge[c]:
            by_crime_judge[c][j] = []
        by_crime_judge[c][j].append(b)
    your_by_crime = {}
    court_median_by_crime = {}
    for crime, judges in by_crime_judge.items():
        all_bonds = []
        for j, bonds in judges.items():
            all_bonds.extend(bonds)
            if _norm_judge(j) == judge_n:
                your_by_crime[crime] = {"your": round(statistics.median(bonds), 2) if bonds else 0, "court_avg": 0}
        if all_bonds:
            court_median_by_crime[crime] = round(statistics.median(all_bonds), 2)
    for c in your_by_crime:
        your_by_crime[c]["court_avg"] = court_median_by_crime.get(c, 0)
    # Only show charges this judge has actually decided
    bail_comparison = []
    for crime in sorted(your_by_crime.keys())[:8]:
        your = your_by_crime[crime]["your"]
        court_avg = court_median_by_crime.get(crime, 0)
        label = (crime[:40] + "…") if len(crime) > 40 else crime
        bail_comparison.append({"category": label, "your": your, "peers": court_avg, "courtAvg": court_avg})

    # Monthly trend: judge median vs court median by month
    by_month_judge = defaultdict(list)
    by_month_court = defaultdict(list)
    for r in rows:
        b = _bond_val(r)
        if b is None:
            continue
        fd = (r.get("file_date") or r.get("date") or "").strip()
        month = fd[:7] if len(fd) >= 7 else (fd[-4:] + "-" + fd[:2] if fd else "")
        if not month or len(month) != 7:
            continue
        by_month_court[month].append(b)
        if _norm_judge((r.get("judge") or "").strip()) == judge_n:
            by_month_judge[month].append(b)
    months = sorted(set(by_month_judge) | set(by_month_court))[-12:]
    trend_data = [
        {
            "label": m[5:7] if len(m) >= 7 else m,
            "your": round(statistics.median(by_month_judge[m]), 2) if by_month_judge[m] else 0,
            "peers": round(statistics.median(by_month_court[m]), 2) if by_month_court[m] else 0,
        }
        for m in months
    ]
    return {"bailComparison": bail_comparison, "trendData": trend_data, "judge": judge}


def get_heatmap_from_csv(date_range: str) -> dict:
    """
    Returns { "massachusetts": [ { "name": "Suffolk", "medianBail": 5000 }, ... ],
              "boston": [ { "name": "Roxbury", "medianBail": 3000 }, ... ] }
    date_range: "30d" | "90d" | "6m" | "1y" | "2y" | "all"
    """
    days_map = {"30d": 30, "90d": 90, "6m": 180, "1y": 365, "2y": 730, "all": None}
    days = days_map.get(date_range, None)
    today = datetime.utcnow()

    rows = _load_csv()
    by_county = defaultdict(list)
    by_boston = defaultdict(list)

    for r in rows:
        file_date = r.get("file_date") or r.get("date") or ""
        if not _date_in_range(file_date, days, today):
            continue
        raw_bond = (r.get("bond") or "").strip()
        if raw_bond == "":
            continue
        try:
            bond = float(raw_bond)
        except ValueError:
            continue
        if bond < 0:
            continue

        county = (r.get("canonical_county") or "").strip()
        if not county:
            court = _normalize(r.get("court_division") or r.get("court_location") or "")
            if court:
                for key, name in sorted(COURT_TO_COUNTY.items(), key=lambda x: -len(x[0])):
                    if key in court:
                        county = name
                        break
        if county:
            by_county[county].append(bond)

        boston = (r.get("canonical_boston") or "").strip()
        if not boston:
            court = _normalize(r.get("court_division") or r.get("court_location") or "")
            if court:
                for key, name in sorted(COURT_TO_BOSTON.items(), key=lambda x: -len(x[0])):
                    if key in court:
                        boston = name
                        break
        if boston:
            by_boston[boston].append(bond)

    def med(vals):
        return round(statistics.median(vals), 2) if vals else 0

    massachusetts = [
        {"name": c, "medianBail": int(med(by_county.get(c, [])))}
        for c in COUNTIES_ORDER
    ]
    boston = [
        {"name": n, "medianBail": int(med(by_boston.get(n, [])))}
        for n in BOSTON_ORDER
    ]
    return {"massachusetts": massachusetts, "boston": boston}
