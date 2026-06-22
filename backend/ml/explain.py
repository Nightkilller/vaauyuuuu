"""
VaayuLens AI — SHAP Explainability

Wraps trained models with SHAP explainer.
For any ward + timestamp, returns top contributing features mapped to
human-readable factor labels with +/- direction (increasing/decreasing risk).

Supports: LightGBM, XGBoost, and sklearn HistGradientBoostingRegressor.
"""

import os
import joblib
import numpy as np
import pandas as pd

try:
    import shap
    SHAP_AVAILABLE = True
except Exception:
    SHAP_AVAILABLE = False

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from ml.features import FEATURE_COLUMNS, FACTOR_LABELS

# ── Paths ──────────────────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def load_model_and_explainer(horizon: str = "24"):
    """Load model and create SHAP explainer (TreeExplainer or fallback)."""
    model_path = os.path.join(MODELS_DIR, f"model_{horizon}h.joblib")
    model = joblib.load(model_path)
    
    if SHAP_AVAILABLE:
        try:
            explainer = shap.TreeExplainer(model)
        except Exception:
            # Fallback to permutation-based explainer for unsupported model types
            explainer = None
    else:
        explainer = None
    
    return model, explainer


def explain_forecast_shap(explainer, features_row: np.ndarray, top_n: int = 6) -> list:
    """Generate SHAP-based attribution using TreeExplainer."""
    if features_row.ndim == 1:
        features_row = features_row.reshape(1, -1)

    shap_values = explainer.shap_values(features_row)
    
    if isinstance(shap_values, list):
        shap_values = shap_values[0]
    
    sv = shap_values[0] if shap_values.ndim > 1 else shap_values

    factors = []
    for i, feat_name in enumerate(FEATURE_COLUMNS):
        val = float(sv[i])
        human_label = FACTOR_LABELS.get(feat_name, feat_name)
        direction = "increasing" if val > 0 else "decreasing"
        factors.append({
            "feature": feat_name,
            "factor": human_label,
            "shap_value": round(val, 2),
            "abs_shap_value": round(abs(val), 2),
            "direction": direction,
        })

    factors.sort(key=lambda x: x["abs_shap_value"], reverse=True)
    return factors[:top_n]


def explain_forecast_importance(model, features_row: np.ndarray, feature_values: dict, top_n: int = 6) -> list:
    """
    Fallback attribution based on feature importance × feature deviation from mean.
    Used when SHAP TreeExplainer is unavailable.
    """
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    else:
        # Can't explain without importances
        return []

    factors = []
    for i, feat_name in enumerate(FEATURE_COLUMNS):
        imp = float(importances[i]) if i < len(importances) else 0
        feat_val = float(features_row.flat[i]) if features_row.size > i else 0
        
        # Sign heuristic: features that are "high" relative to their typical range
        # push towards "increasing" pollution
        human_label = FACTOR_LABELS.get(feat_name, feat_name)
        
        # For wind_speed, negative impact (high wind = less pollution)
        if "wind_speed" in feat_name:
            direction = "decreasing" if feat_val > 5 else "increasing"
        elif "is_weekend" in feat_name:
            direction = "decreasing" if feat_val == 1 else "increasing"
        else:
            direction = "increasing" if feat_val > 0 else "decreasing"
        
        factors.append({
            "feature": feat_name,
            "factor": human_label,
            "shap_value": round(imp * 100, 2),  # Scaled importance as proxy
            "abs_shap_value": round(imp * 100, 2),
            "direction": direction,
        })

    factors.sort(key=lambda x: x["abs_shap_value"], reverse=True)
    return factors[:top_n]


def generate_all_ward_attributions(
    df_features: pd.DataFrame,
    feature_cols: list,
    horizon: str = "24",
    top_n: int = 6,
) -> list:
    """
    Generate attributions for all wards using their latest feature vectors.
    Uses SHAP TreeExplainer when available, falls back to importance-based attribution.
    """
    model, explainer = load_model_and_explainer(horizon)

    # Get latest timestamp per ward
    df_features["timestamp"] = pd.to_datetime(df_features["timestamp"])
    latest = df_features.sort_values("timestamp").groupby("ward_id").last().reset_index()

    use_shap = explainer is not None
    method = "SHAP TreeExplainer" if use_shap else "Feature Importance (fallback)"
    print(f"   Attribution method: {method}")

    attributions = []
    for _, row in latest.iterrows():
        features = row[feature_cols].values.astype(float)

        if use_shap:
            factors = explain_forecast_shap(explainer, features, top_n=top_n)
            # Safe base_value extraction
            base_value = 0.0
            try:
                ev = explainer.expected_value
                if isinstance(ev, (list, np.ndarray)):
                    while isinstance(ev, (list, np.ndarray)) and len(ev) > 0:
                        ev = ev[0]
                base_value = float(ev.item()) if hasattr(ev, 'item') else float(ev)
            except Exception:
                base_value = 0.0
        else:
            factors = explain_forecast_importance(model, features, {}, top_n=top_n)
            base_value = 0.0

        attributions.append({
            "ward_id": row["ward_id"],
            "horizon": f"{horizon}h",
            "method": method,
            "factors": factors,
            "base_value": round(base_value, 2),
            "generated_at": str(row["timestamp"]),
        })

    print(f"✅ Generated attributions for {len(attributions)} wards ({horizon}h horizon)")
    return attributions
