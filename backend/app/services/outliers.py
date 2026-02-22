import pandas as pd
from app.db import bail_collection

def detect_judge_outliers():
    """
    Detect judges whose bond amounts are high outliers.
    A judge is flagged if their median bond for a crime
    is 1.5x higher than the court median for that crime.
    """
    data = list(bail_collection.find({}, {"_id": 0}))

    if not data:
        return {"message": "No data found in the database."}

    df = pd.DataFrame(data)

    # We'll group by crime type to get the court median
    grouped = df.groupby("crime_committed")
    outliers = []

    for crime, group in grouped:
        court_median = group["bond"].median()
        judge_groups = group.groupby("judge")

        for judge, jgroup in judge_groups:
            judge_median = jgroup["bond"].median()

            if judge_median > 1.5 * court_median:
                outliers.append({
                    "judge": judge,
                    "crime_committed": crime,
                    "judge_median": judge_median,
                    "court_median": court_median,
                    "status": "High Outlier"
                })

    return outliers