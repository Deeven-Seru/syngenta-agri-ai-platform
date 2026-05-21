"""
ML Pipeline: Campaign Receptivity Model
- Trains XGBoost on historical WhatsApp engagement data
- Predicts click probability for each grower × product combination
- Saves model artifact to disk for API serving

Run: python ml/train_model.py
"""
import asyncio
import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import roc_auc_score, classification_report
import xgboost as xgb
import motor.motor_asyncio
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB = os.getenv("MONGODB_DB_NAME", "syngenta_agri")
MODEL_PATH = Path(__file__).parent / "receptivity_model.pkl"
ENCODER_PATH = Path(__file__).parent / "label_encoders.pkl"


async def load_training_data() -> pd.DataFrame:
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB]

    # Load WhatsApp messages (our labeled dataset)
    wa_cursor = db["whatsapp_log"].find({})
    wa_list = await wa_cursor.to_list(length=None)
    wa_df = pd.DataFrame(wa_list)

    # Load grower features
    grower_cursor = db["growers"].find({})
    grower_list = await grower_cursor.to_list(length=None)
    grower_df = pd.DataFrame(grower_list)
    grower_df.rename(columns={"_id": "grower_id"}, inplace=True)

    # Load visit log: was there a rep visit in territory in last 14 days?
    visit_cursor = db["visit_log"].find({})
    visit_list = await visit_cursor.to_list(length=None)
    visit_df = pd.DataFrame(visit_list) if visit_list else pd.DataFrame()

    # Load reps for territory lookup
    rep_cursor = db["reps_territory"].find({})
    rep_list = await rep_cursor.to_list(length=None)
    rep_df = pd.DataFrame(rep_list)
    rep_df.rename(columns={"_id": "rep_id"}, inplace=True)

    client.close()
    return wa_df, grower_df, visit_df, rep_df


def build_features(wa_df, grower_df, visit_df, rep_df):
    # === Join grower features to WhatsApp messages ===
    df = wa_df.merge(grower_df, on="grower_id", how="left")

    # === Parse message date ===
    df["message_sent_date"] = pd.to_datetime(df["message_sent_date"])
    df["message_week"] = df["message_sent_date"].dt.isocalendar().week.astype(int)
    df["message_month"] = df["message_sent_date"].dt.month
    df["message_dow"] = df["message_sent_date"].dt.dayofweek  # 0=Mon

    # === Crop calendar features ===
    df["crop_stage"] = df["crop_calendar"].apply(
        lambda x: x.get("current_stage", "unknown") if isinstance(x, dict) else "unknown"
    )

    # === Rep visit recency: was tehsil visited in last 30 days? ===
    if not visit_df.empty:
        visit_df["visit_date"] = pd.to_datetime(visit_df["visit_date"])
        # Most recent visit per tehsil
        latest_visit = visit_df.groupby("tehsil")["visit_date"].max().reset_index()
        latest_visit.columns = ["tehsil", "last_rep_visit"]
        df = df.merge(latest_visit, on="tehsil", how="left")
        df["days_since_rep_visit"] = (
            df["message_sent_date"] - df["last_rep_visit"]
        ).dt.days.fillna(999)
        df["rep_visited_recently"] = (df["days_since_rep_visit"] <= 30).astype(int)
    else:
        df["days_since_rep_visit"] = 999
        df["rep_visited_recently"] = 0

    # === Target variable ===
    df["clicked"] = df["clicked"].astype(int)

    return df


CATEGORICAL_COLS = [
    "language",
    "device_type",
    "state",
    "primary_crop",
    "campaign_crop",
    "campaign_product",
    "gender",
    "crop_stage",
]
NUMERIC_COLS = [
    "grower_age",
    "farm_size_acres",
    "message_week",
    "message_month",
    "message_dow",
    "days_since_rep_visit",
    "rep_visited_recently",
    "offline_campaign_attended",
    "product_scan",
]

FEATURE_COLS = CATEGORICAL_COLS + NUMERIC_COLS


def encode_features(df: pd.DataFrame, encoders: dict = None, fit: bool = True):
    df = df.copy()

    # Fill nulls
    for col in CATEGORICAL_COLS:
        if col in df.columns:
            df[col] = df[col].fillna("unknown").astype(str)
    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    if encoders is None:
        encoders = {}

    for col in CATEGORICAL_COLS:
        if col not in df.columns:
            df[col] = 0
            continue
        if fit:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            encoders[col] = le
        else:
            le = encoders.get(col)
            if le:
                # Handle unseen labels
                known = set(le.classes_)
                df[col] = df[col].apply(lambda x: x if x in known else "unknown")
                df[col] = le.transform(df[col])
            else:
                df[col] = 0

    return df, encoders


def train():
    print("🔗 Connecting to MongoDB Atlas...")
    wa_df, grower_df, visit_df, rep_df = asyncio.run(load_training_data())
    print(f"  Loaded: {len(wa_df)} messages | {len(grower_df)} growers")

    print("🔧 Building features...")
    df = build_features(wa_df, grower_df, visit_df, rep_df)

    print(f"  Feature matrix shape: {df.shape}")
    print(f"  Click rate: {df['clicked'].mean():.3f} ({df['clicked'].sum()} clicks)")

    # Encode
    df_enc, encoders = encode_features(df, fit=True)

    X = df_enc[[c for c in FEATURE_COLS if c in df_enc.columns]].values
    y = df_enc["clicked"].values

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"  Training: {len(X_train)} | Test: {len(X_test)}")

    # === XGBoost with scale_pos_weight to handle class imbalance ===
    neg = (y_train == 0).sum()
    pos = (y_train == 1).sum()
    scale_pos = neg / pos if pos > 0 else 1.0

    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        scale_pos_weight=scale_pos,
        use_label_encoder=False,
        eval_metric="auc",
        random_state=42,
        tree_method="hist",
        n_jobs=-1,
    )

    print("🏋️  Training XGBoost...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    # Evaluate
    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_proba >= 0.5).astype(int)
    auc = roc_auc_score(y_test, y_proba)

    print(f"\n📊 Model Performance:")
    print(f"  ROC-AUC: {auc:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['No Click', 'Click'])}")

    # Feature importance
    feat_names = [c for c in FEATURE_COLS if c in df_enc.columns]
    importances = model.feature_importances_
    feat_imp = sorted(zip(feat_names, importances), key=lambda x: -x[1])
    print("🔑 Top Feature Importances:")
    for feat, imp in feat_imp[:10]:
        print(f"  {feat:30s}: {imp:.4f}")

    # Save model and encoders
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({
            "model": model,
            "feature_cols": feat_names,
            "auc": auc,
        }, f)

    with open(ENCODER_PATH, "wb") as f:
        pickle.dump(encoders, f)

    print(f"\n✅ Model saved to {MODEL_PATH}")
    print(f"✅ Encoders saved to {ENCODER_PATH}")


if __name__ == "__main__":
    train()
