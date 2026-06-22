"""
VaayuLens AI — Live Data Fetcher & Predictor

This module demonstrates how to connect real-time APIs to the prediction pipeline.
In live mode, it:
1. Fetches current weather from OpenWeatherMap (OWM).
2. Fetches current PM2.5 + pollutants from WAQI (which mirrors CPCB CAAQMS stations).
3. Queries the local DB/files to retrieve past 7 days of readings to build lags & rolling statistics.
4. Combines everything into the required feature vector format.
5. Runs the models to yield live 24h/48h/72h forecasts.
"""

import os
import time
import requests
import numpy as np
import pandas as pd
import joblib

# Add parent path to import modules
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import OWM_API_KEY, DATA_DIR, MODELS_DIR
from ml.features import FEATURE_COLUMNS
from ml.forecast import pm25_to_aqi

# Free WAQI token (request yours at: https://aqicn.org/data-platform/token/)
WAQI_TOKEN = os.getenv("WAQI_TOKEN", "demo")  # fallback to demo token

def fetch_live_aqi(lat: float, lon: float) -> dict:
    """
    Fetch current PM2.5, PM10, NO2, SO2, CO from WAQI API.
    Points to real-time ground stations reporting to CPCB.
    """
    url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        if data.get("status") == "ok":
            iaqi = data["data"].get("iaqi", {})
            return {
                "pm25": float(iaqi.get("pm25", {}).get("v", 120.0)),
                "pm10": float(iaqi.get("pm10", {}).get("v", 220.0)),
                "no2": float(iaqi.get("no2", {}).get("v", 45.0)),
                "so2": float(iaqi.get("so2", {}).get("v", 15.0)),
                "co": float(iaqi.get("co", {}).get("v", 1.2)),
            }
    except Exception as e:
        print(f"⚠️ Failed to fetch live AQI: {e}")
    # Return mock live fallback if token is invalid or request fails
    return {"pm25": 140.0, "pm10": 250.0, "no2": 50.0, "so2": 18.0, "co": 1.4}


def fetch_live_weather(lat: float, lon: float) -> dict:
    """
    Fetch current weather features from OpenWeatherMap.
    """
    if not OWM_API_KEY:
        print("⚠️ OWM_API_KEY missing. Returning baseline weather features.")
        return {"temperature": 28.0, "humidity": 60.0, "wind_speed": 4.5, "wind_direction": 220.0}

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OWM_API_KEY}&units=metric"
    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        return {
            "temperature": float(data["main"]["temp"]),
            "humidity": float(data["main"]["humidity"]),
            "wind_speed": float(data["wind"]["speed"]) * 3.6, # Convert m/s to km/h
            "wind_direction": float(data["wind"].get("deg", 180.0)),
        }
    except Exception as e:
        print(f"⚠️ Failed to fetch live weather: {e}")
    return {"temperature": 28.0, "humidity": 60.0, "wind_speed": 4.5, "wind_direction": 220.0}


def fetch_historical_series_from_db(ward_id: str, limit_hours: int = 168) -> list[float]:
    """
    Retrieve historical PM2.5 readings for the ward to compute rolling windows and lags.
    In production, this queries your MongoDB 'historical_readings' collection.
    For this demo, we read the last N hours of our synthetic historical data.
    """
    try:
        csv_path = os.path.join(DATA_DIR, "raw", "historical_data.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            ward_df = df[df["ward_id"] == ward_id].sort_values("timestamp")
            return list(ward_df["pm25"].tail(limit_hours).values)
    except Exception as e:
        print(f"⚠️ Failed to load history: {e}")
    
    # Return placeholder series if no file exists
    return [110.0] * limit_hours


def generate_live_features(ward_meta: dict, current_aqi: dict, current_weather: dict) -> pd.DataFrame:
    """
    Assembles current metrics + historical lags into the exact FEATURE_COLUMNS structure.
    """
    history_pm25 = fetch_historical_series_from_db(ward_meta["ward_id"], limit_hours=168)
    
    # Append current live reading
    history_pm25.append(current_aqi["pm25"])
    
    # Extract values
    pm25_1h_ago = history_pm25[-2]
    pm25_6h_ago = history_pm25[-7]
    pm25_24h_ago = history_pm25[-25]
    pm25_168h_ago = history_pm25[0]
    
    roll_24h = history_pm25[-24:]
    roll_24h_mean = np.mean(roll_24h)
    roll_24h_std = np.std(roll_24h) if len(roll_24h) > 1 else 0
    roll_7d_mean = np.mean(history_pm25)
    
    # Time encodings
    now = pd.Timestamp.now()
    hour_sin = np.sin(2 * np.pi * now.hour / 24)
    hour_cos = np.cos(2 * np.pi * now.hour / 24)
    day_of_week = now.dayofweek
    month = now.month
    is_weekend = 1 if day_of_week >= 5 else 0
    
    # Seasonal stubble signal
    stubble_season = 1 if (month == 10 or (month == 11 and now.day <= 15)) and ward_meta.get("near_ncr_border") else 0
    
    # Wind decomposition
    wind_rad = np.deg2rad(current_weather["wind_direction"])
    wind_dir_sin = np.sin(wind_rad)
    wind_dir_cos = np.cos(wind_rad)
    
    # Build vector dictionary
    feat_dict = {
        "pm25_lag_1h": pm25_1h_ago,
        "pm25_lag_6h": pm25_6h_ago,
        "pm25_lag_24h": pm25_24h_ago,
        "pm25_lag_168h": pm25_168h_ago,
        "pm25_roll_24h_mean": roll_24h_mean,
        "pm25_roll_24h_std": roll_24h_std,
        "pm25_roll_7d_mean": roll_7d_mean,
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
        "day_of_week": day_of_week,
        "month": month,
        "is_weekend": is_weekend,
        "stubble_season": stubble_season,
        "temperature": current_weather["temperature"],
        "humidity": current_weather["humidity"],
        "wind_speed": current_weather["wind_speed"],
        "wind_direction_sin": wind_dir_sin,
        "wind_direction_cos": wind_dir_cos,
    }
    
    # Return as DataFrame matching ML columns order
    return pd.DataFrame([feat_dict])[FEATURE_COLUMNS]


def run_live_inference_for_ward(ward_meta: dict) -> dict:
    """
    End-to-end live inference for one ward coordinates.
    """
    lat, lon = ward_meta["lat"], ward_meta["lon"]
    
    # 1. Fetch live metrics
    live_aqi = fetch_live_aqi(lat, lon)
    live_weather = fetch_live_weather(lat, lon)
    
    # 2. Build feature matrix
    df_features = generate_live_features(ward_meta, live_aqi, live_weather)
    
    # 3. Load trained model regressors
    models = {}
    for h in ["24", "48", "72"]:
        models[h] = joblib.load(os.path.join(MODELS_DIR, f"model_{h}h.joblib"))
        
    # 4. Predict horizons
    preds = {}
    for h, model in models.items():
        val = float(model.predict(df_features.values)[0])
        val = max(10, val) # floor
        preds[f"pm25_{h}h"] = round(val, 1)
        preds[f"aqi_{h}h"] = pm25_to_aqi(val)
        
    # 5. Format forecast package
    return {
        "ward_id": ward_meta["ward_id"],
        "current_pm25": live_aqi["pm25"],
        "current_aqi": pm25_to_aqi(live_aqi["pm25"]),
        "forecast_pm25_24h": preds["pm25_24h"],
        "forecast_pm25_48h": preds["pm25_48h"],
        "forecast_pm25_72h": preds["pm25_72h"],
        "forecast_aqi_24h": preds["aqi_24h"],
        "forecast_aqi_48h": preds["aqi_48h"],
        "forecast_aqi_72h": preds["aqi_72h"],
        "weather": live_weather,
        "pollutants": {
            "pm10": live_aqi["pm10"],
            "no2": live_aqi["no2"],
            "so2": live_aqi["so2"],
            "co": live_aqi["co"],
        },
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

if __name__ == "__main__":
    # Test live prediction for Anand Vihar ground station
    anand_vihar = {
        "ward_id": "anand_vihar",
        "name": "Anand Vihar",
        "lat": 28.6468,
        "lon": 77.3162,
        "near_ncr_border": True
    }
    print("🚀 Running live API fetch and ML inference for Anand Vihar...")
    forecast_pkg = run_live_inference_for_ward(anand_vihar)
    print("\n📦 Live Forecast Output package:")
    import json
    print(json.dumps(forecast_pkg, indent=2))
