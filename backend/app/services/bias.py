import pandas as pd
from app.db import bail_collection

def compute_bias_metrics():
    """
    Compute median bond amounts by crime type and judge.
    Converts NaN to 0 for JSON compliance.
    """
    data = list(bail_collection.find({}, {"_id": 0}))

    if not data:
        return {"message": "No data found in the database."}

    df = pd.DataFrame(data)

    # Ensure required columns exist
    required_columns = ["crime_committed", "judge", "bond"]
    for col in required_columns:
        if col not in df.columns:
            return {"error": f"Column '{col}' not found in the data."}

    # Compute median bond by crime and judge
    summary = (
        df.groupby(["crime_committed", "judge"])["bond"]
        .median()
        .reset_index()
        .rename(columns={"bond": "median_bond"})
    )

    # Fill NaN values with 0
    summary["median_bond"] = summary["median_bond"].fillna(0)

    return summary.to_dict(orient="records")