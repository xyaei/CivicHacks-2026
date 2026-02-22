"""
Map raw crime_committed strings to intuitive groupings for bail distribution charts.
Order of rules matters: more specific (e.g. Sexual) before general (Assault).
"""
import re

# Display order for charts
CATEGORY_ORDER = [
    "Assault",
    "Sexual assault",
    "Burglary",
    "Financial / Theft",
    "Drugs",
    "Motor vehicle",
    "Property",
    "Fugitive / Warrant",
    "Other",
]

# (pattern, category) — first match wins; case-insensitive
_CATEGORY_RULES = [
    (r"INDECENT|SEXUAL|RAPE|LEWD|c272\s*§\s*16|c272\s*§\s*4", "Sexual assault"),
    (r"A&B|ASSAULT|BATTERY|c265\s*§\s*13|c265\s*§\s*15", "Assault"),
    (r"B&E|BURGLAR|BREAKING|c266\s*§\s*16", "Burglary"),
    (r"LARCENY|SHOPLIFT|THEFT|FRAUD|FORGERY|EMBEZZLE|c266\s*§\s*30|c266\s*§\s*28", "Financial / Theft"),
    (r"DRUG|c94C", "Drugs"),
    (r"MOTOR\s*VEH|LICENSE\s*SUSPENDED|RECKLESS\s*OP|NEGLIGENT\s*OP|c90\s*§|OUI|DUI|OPERAT", "Motor vehicle"),
    (r"VANDAL|TRESPASS|MALICIOUS|c266\s*§\s*126|c266\s*§\s*120|c266\s*§\s*127", "Property"),
    (r"FUGITIVE|WARRANT|c276\s*§\s*20", "Fugitive / Warrant"),
]

_COMPILED = [(re.compile(p, re.I), cat) for p, cat in _CATEGORY_RULES]


def categorize(crime: str) -> str:
    """Return category for a crime_committed string. Returns 'Other' if no rule matches."""
    if not crime or not str(crime).strip():
        return "Other"
    text = str(crime).strip()
    for pattern, category in _COMPILED:
        if pattern.search(text):
            return category
    return "Other"
