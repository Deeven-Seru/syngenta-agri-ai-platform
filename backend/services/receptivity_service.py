"""
Campaign Receptivity Scoring Service
- Loads the trained XGBoost model
- Scores individual growers or batches for click probability
- Returns ranked target lists for campaign dispatch
"""
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional
import structlog

logger = structlog.get_logger()

MODEL_PATH = Path(__file__).parent.parent.parent / "ml" / "receptivity_model.pkl"
ENCODER_PATH = Path(__file__).parent.parent.parent / "ml" / "label_encoders.pkl"

_model_cache = None
_encoders_cache = None


def load_model():
    global _model_cache, _encoders_cache
    if _model_cache is None:
        if not MODEL_PATH.exists():
            logger.warning("Model not found — run ml/train_model.py first")
            return None, None
        with open(MODEL_PATH, "rb") as f:
            payload = pickle.load(f)
            _model_cache = payload["model"]
            _feature_cols = payload["feature_cols"]
        with open(ENCODER_PATH, "rb") as f:
            _encoders_cache = pickle.load(f)
        logger.info("Receptivity model loaded", auc=payload.get("auc"))
    return _model_cache, _encoders_cache


CATEGORICAL_COLS = [
    "language", "device_type", "state", "primary_crop",
    "campaign_crop", "campaign_product", "gender", "crop_stage",
]

NUMERIC_COLS = [
    "grower_age", "farm_size_acres", "message_week", "message_month",
    "message_dow", "days_since_rep_visit", "rep_visited_recently",
    "offline_campaign_attended", "product_scan",
]


def score_growers(growers: list[dict], campaign_product: str, campaign_crop: str) -> list[dict]:
    """
    Score a list of grower dicts for campaign receptivity.

    Args:
        growers: List of grower documents (from MongoDB)
        campaign_product: Product to score for
        campaign_crop: Crop the campaign targets

    Returns:
        List of growers with 'receptivity_score' and 'rank' added, sorted desc.
    """
    model, encoders = load_model()

    if model is None:
        # Rule-based fallback if model not trained yet
        return _rule_based_scoring(growers, campaign_product, campaign_crop)

    df = pd.DataFrame(growers)

    # Add campaign context
    df["campaign_product"] = campaign_product
    df["campaign_crop"] = campaign_crop

    # Feature engineering
    df["crop_stage"] = df.get("crop_calendar", pd.Series([{}] * len(df))).apply(
        lambda x: x.get("current_stage", "unknown") if isinstance(x, dict) else "unknown"
    )
    df["days_since_rep_visit"] = df.get("days_since_rep_visit", 999)
    df["rep_visited_recently"] = (df["days_since_rep_visit"] <= 30).astype(int)

    # Use current week
    from datetime import datetime
    now = datetime.now()
    df["message_week"] = now.isocalendar()[1]
    df["message_month"] = now.month
    df["message_dow"] = now.weekday()

    # Encode categoricals
    for col in CATEGORICAL_COLS:
        if col not in df.columns:
            df[col] = "unknown"
        df[col] = df[col].fillna("unknown").astype(str)
        le = encoders.get(col)
        if le:
            known = set(le.classes_)
            df[col] = df[col].apply(lambda x: x if x in known else le.classes_[0])
            df[col] = le.transform(df[col])
        else:
            df[col] = 0

    # Encode numerics
    for col in NUMERIC_COLS:
        if col not in df.columns:
            df[col] = 0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # Score
    feature_cols = [c for c in (CATEGORICAL_COLS + NUMERIC_COLS) if c in df.columns]
    X = df[feature_cols].values
    probas = model.predict_proba(X)[:, 1]

    # Build results
    results = []
    for i, g in enumerate(growers):
        score = float(probas[i])
        tier = "high" if score >= 0.15 else "medium" if score >= 0.07 else "low"
        results.append({
            **g,
            "receptivity_score": round(score, 4),
            "receptivity_tier": tier,
            "campaign_product": campaign_product,
            "campaign_crop": campaign_crop,
        })

    # Sort by score descending
    results.sort(key=lambda x: -x["receptivity_score"])
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return results


def _rule_based_scoring(growers: list[dict], product: str, crop: str) -> list[dict]:
    """
    Fallback: rule-based scoring when model not available.
    Based on insights from EDA.
    """
    results = []
    for g in growers:
        score = 0.05  # baseline click rate

        # Language boost (from EDA)
        lang_boost = {
            "Bengali": 0.02, "Hindi": 0.015, "Punjabi": 0.01,
            "Gujarati": 0.008, "Marathi": 0.006, "Kannada": 0.004,
        }
        score += lang_boost.get(g.get("language", ""), 0)

        # Crop match boost
        if g.get("primary_crop", "") == crop:
            score += 0.03

        # Engagement history
        if g.get("product_scan"):
            score += 0.02
        if g.get("offline_campaign_attended"):
            score += 0.01

        # Device penalty for keypad (can't receive WhatsApp)
        if g.get("device_type") == "keypad":
            score *= 0.3

        tier = "high" if score >= 0.15 else "medium" if score >= 0.07 else "low"
        results.append({
            **g,
            "receptivity_score": round(score, 4),
            "receptivity_tier": tier,
            "campaign_product": product,
            "campaign_crop": crop,
        })

    results.sort(key=lambda x: -x["receptivity_score"])
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return results
