"""
VaayuLens AI — Model Training

Trains gradient boosted tree regressors to predict PM2.5 at t+24h, t+48h, t+72h.
Uses sklearn's HistGradientBoostingRegressor (no libomp dependency required).
Falls back to this when LightGBM/XGBoost can't load on macOS without libomp.

Time-based train/test split (last 14 days = test set).
Saves models + feature names to ml/models/ directory.
Prints RMSE vs naive persistence baseline for benchmarking.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Try LightGBM first, fall back to sklearn
try:
    import lightgbm as lgb
    MODEL_TYPE = "LightGBM"
    print("🟢 Using LightGBM")
except Exception:
    try:
        import xgboost as xgb
        MODEL_TYPE = "XGBoost"
        print("🟡 LightGBM unavailable, using XGBoost")
    except Exception:
        MODEL_TYPE = "HistGBM"
        print("🟠 LightGBM/XGBoost unavailable, using sklearn HistGradientBoosting")

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from ml.features import build_features, FEATURE_COLUMNS, TARGET_COLUMNS


# ── Paths ──────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_FILE = os.path.join(BASE_DIR, "..", "data", "raw", "historical_data.csv")

# Test set: last 14 days
TEST_DAYS = 14


def create_model():
    """Create the appropriate model based on available libraries."""
    if MODEL_TYPE == "LightGBM":
        return lgb.LGBMRegressor(
            objective="regression",
            num_leaves=63,
            learning_rate=0.05,
            n_estimators=300,
            subsample=0.8,
            colsample_bytree=0.8,
            verbose=-1,
            random_state=42,
        )
    elif MODEL_TYPE == "XGBoost":
        return xgb.XGBRegressor(
            objective="reg:squarederror",
            max_depth=8,
            learning_rate=0.05,
            n_estimators=300,
            subsample=0.8,
            colsample_bytree=0.8,
            verbosity=0,
            random_state=42,
        )
    else:
        from sklearn.ensemble import HistGradientBoostingRegressor
        return HistGradientBoostingRegressor(
            max_depth=8,
            learning_rate=0.05,
            max_iter=300,
            min_samples_leaf=20,
            random_state=42,
        )


def train_models():
    """Train and save models for each forecast horizon."""
    
    # ── Load and prepare data ──────────────────────────────────────────
    print("📊 Loading data...")
    df = pd.read_csv(DATA_FILE)
    print(f"   Raw data: {len(df):,} rows")

    print("🔧 Building features...")
    df_feat = build_features(df)

    # ── Time-based train/test split ────────────────────────────────────
    df_feat["timestamp"] = pd.to_datetime(df_feat["timestamp"])
    max_date = df_feat["timestamp"].max()
    split_date = max_date - pd.Timedelta(days=TEST_DAYS)

    train = df_feat[df_feat["timestamp"] <= split_date]
    test = df_feat[df_feat["timestamp"] > split_date]

    print(f"\n📅 Train/Test split:")
    print(f"   Train: {len(train):,} rows (until {split_date.date()})")
    print(f"   Test:  {len(test):,} rows (last {TEST_DAYS} days)")

    X_train = train[FEATURE_COLUMNS]
    X_test = test[FEATURE_COLUMNS]

    os.makedirs(MODELS_DIR, exist_ok=True)
    results = {}

    for target in TARGET_COLUMNS:
        horizon = target.replace("pm25_t+", "")
        print(f"\n{'='*60}")
        print(f"🚀 Training {MODEL_TYPE} for {target} ({horizon}h forecast)")
        print(f"{'='*60}")

        y_train = train[target]
        y_test = test[target]

        # ── Train model ───────────────────────────────────────────────
        model = create_model()
        
        if MODEL_TYPE == "LightGBM":
            model.fit(X_train, y_train, eval_set=[(X_test, y_test)])
        elif MODEL_TYPE == "XGBoost":
            model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
        else:
            model.fit(X_train, y_train)

        # ── Evaluate ──────────────────────────────────────────────────
        y_pred = model.predict(X_test)

        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)

        # Naive baseline: persistence (yesterday's value = today's forecast)
        y_naive = test["pm25_lag_24h"].values
        rmse_naive = np.sqrt(mean_squared_error(y_test, y_naive))
        mae_naive = mean_absolute_error(y_test, y_naive)

        improvement = ((rmse_naive - rmse) / rmse_naive) * 100

        print(f"\n   📈 Results ({horizon}h):")
        print(f"   {MODEL_TYPE}  RMSE: {rmse:.2f}  MAE: {mae:.2f}")
        print(f"   Naive     RMSE: {rmse_naive:.2f}  MAE: {mae_naive:.2f}")
        print(f"   Improvement: {improvement:.1f}% over naive baseline")

        # ── Feature importance ─────────────────────────────────────────
        if hasattr(model, 'feature_importances_'):
            importance = dict(zip(FEATURE_COLUMNS, model.feature_importances_))
            top5 = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:5]
            print(f"\n   Top 5 features:")
            for feat, imp in top5:
                print(f"     {feat}: {imp:.4f}")

        # ── Save model ────────────────────────────────────────────────
        model_path = os.path.join(MODELS_DIR, f"model_{horizon}h.joblib")
        joblib.dump(model, model_path)
        print(f"   💾 Saved: {model_path}")

        results[horizon] = {
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
            "rmse_naive": round(rmse_naive, 2),
            "improvement_pct": round(improvement, 1),
        }

    # ── Save feature list and metadata ─────────────────────────────────
    meta = {
        "model_type": MODEL_TYPE,
        "features": FEATURE_COLUMNS,
        "targets": TARGET_COLUMNS,
        "results": results,
        "train_size": len(train),
        "test_size": len(test),
    }
    meta_path = os.path.join(MODELS_DIR, "model_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"\n💾 Metadata saved: {meta_path}")

    print(f"\n✅ All {MODEL_TYPE} models trained and saved successfully!")
    return results


if __name__ == "__main__":
    train_models()
