"""
VaayuLens AI — Forecast Engine

Loads trained LightGBM models and generates PM2.5 forecasts per ward.
Converts PM2.5 to AQI using CPCB breakpoints.
"""

import os
import joblib
import numpy as np
import pandas as pd

# ── Paths ──────────────────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def pm25_to_aqi(pm25: float) -> float:
    """
    Convert PM2.5 concentration (µg/m³) to AQI using CPCB breakpoints.
    Simplified sub-index calculation for PM2.5 (24-hr avg).
    """
    # CPCB PM2.5 breakpoints: (C_low, C_high, I_low, I_high)
    breakpoints = [
        (0,    30,    0,   50),
        (31,   60,   51,  100),
        (61,   90,  101,  200),
        (91,  120,  201,  300),
        (121, 250,  301,  400),
        (251, 500,  401,  500),
    ]
    
    pm25 = max(0, pm25)
    for c_low, c_high, i_low, i_high in breakpoints:
        if pm25 <= c_high:
            aqi = ((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low
            return round(aqi, 1)
    
    return 500.0  # Above scale


def load_models():
    """Load all trained LightGBM models."""
    models = {}
    for horizon in ["24", "48", "72"]:
        path = os.path.join(MODELS_DIR, f"model_{horizon}h.joblib")
        if os.path.exists(path):
            models[horizon] = joblib.load(path)
    return models


def generate_forecast(model_dict: dict, features_row: np.ndarray) -> dict:
    """
    Generate PM2.5 forecast for a single ward at a single timestamp.
    
    Args:
        model_dict: dict of {"24": model, "48": model, "72": model}
        features_row: 1D array or 2D (1, n_features) feature vector
    
    Returns:
        dict with forecast values and AQI conversions
    """
    if features_row.ndim == 1:
        features_row = features_row.reshape(1, -1)

    forecast = {}
    for horizon, model in model_dict.items():
        pm25_pred = float(model.predict(features_row)[0])
        pm25_pred = max(10, pm25_pred)  # floor
        forecast[f"pm25_{horizon}h"] = round(pm25_pred, 1)
        forecast[f"aqi_{horizon}h"] = pm25_to_aqi(pm25_pred)

    return forecast


def generate_all_ward_forecasts(df_features: pd.DataFrame, feature_cols: list) -> list:
    """
    Generate forecasts for all wards using their latest feature vectors.
    """
    import json
    from config import WARDS_FILE
    
    models = load_models()
    if not models:
        raise FileNotFoundError("No trained models found. Run train_model.py first.")

    # Load city lookup
    with open(WARDS_FILE, "r") as f:
        ward_data = json.load(f)
    ward_to_city = {w["ward_id"]: w.get("city", "Delhi") for w in ward_data["wards"]}

    # Get latest timestamp per ward
    df_features["timestamp"] = pd.to_datetime(df_features["timestamp"])
    latest = df_features.sort_values("timestamp").groupby("ward_id").last().reset_index()

    forecasts = []
    for _, row in latest.iterrows():
        features = row[feature_cols].values.astype(float)
        fc = generate_forecast(models, features)
        
        # Build forecast trend data for the chart
        current_pm25 = float(row["pm25"]) if "pm25" in row else float(row.get("pm25_lag_1h", 0))
        current_aqi = pm25_to_aqi(current_pm25)
        
        trend = [
            {"label": "Now", "pm25": current_pm25, "aqi": current_aqi, "hours": 0},
            {"label": "+24h", "pm25": fc["pm25_24h"], "aqi": fc["aqi_24h"], "hours": 24},
            {"label": "+48h", "pm25": fc["pm25_48h"], "aqi": fc["aqi_48h"], "hours": 48},
            {"label": "+72h", "pm25": fc["pm25_72h"], "aqi": fc["aqi_72h"], "hours": 72},
        ]

        forecasts.append({
            "ward_id": row["ward_id"],
            "city": ward_to_city.get(row["ward_id"], "Delhi"),
            "current_pm25": current_pm25,
            "current_aqi": current_aqi,
            "forecast_pm25_24h": fc["pm25_24h"],
            "forecast_pm25_48h": fc["pm25_48h"],
            "forecast_pm25_72h": fc["pm25_72h"],
            "forecast_aqi_24h": fc["aqi_24h"],
            "forecast_aqi_48h": fc["aqi_48h"],
            "forecast_aqi_72h": fc["aqi_72h"],
            "weather": {
                "temperature": round(float(row["temperature"]), 1) if "temperature" in row else 25.0,
                "humidity": round(float(row["humidity"]), 1) if "humidity" in row else 55.0,
                "wind_speed": round(float(row["wind_speed"]), 1) if "wind_speed" in row else 5.0,
                "wind_direction": round(float(row["wind_direction"]), 1) if "wind_direction" in row else 180.0,
            },
            "pollutants": {
                "pm10": round(float(row["pm10"]), 1) if "pm10" in row else None,
                "no2": round(float(row["no2"]), 1) if "no2" in row else None,
                "so2": round(float(row["so2"]), 1) if "so2" in row else None,
                "co": round(float(row["co"]), 1) if "co" in row else None,
            },
            "trend": trend,
            "generated_at": str(row["timestamp"]),
        })

    print(f"✅ Generated forecasts for {len(forecasts)} wards")
    return forecasts
