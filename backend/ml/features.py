"""
VaayuLens AI — Feature Engineering

Builds features for LightGBM forecasting model from raw hourly pollution + weather data.
Features include:
  - Lag features: PM2.5 at t-1, t-6, t-24, t-168 (1 week)
  - Rolling statistics: 24h mean, 24h std, 7-day mean
  - Time encodings: hour_sin, hour_cos, day_of_week, month, is_weekend
  - Stubble season flag: binary (Oct 1 – Nov 15)
  - Meteorological features: temperature, humidity, wind_speed, wind_direction

Target columns: pm25 at t+24, t+48, t+72
"""

import numpy as np
import pandas as pd


# Feature columns used by the model (in order)
FEATURE_COLUMNS = [
    # Lag features
    "pm25_lag_1h",
    "pm25_lag_6h",
    "pm25_lag_24h",
    "pm25_lag_168h",
    # Rolling stats
    "pm25_roll_24h_mean",
    "pm25_roll_24h_std",
    "pm25_roll_7d_mean",
    # Time features
    "hour_sin",
    "hour_cos",
    "day_of_week",
    "month",
    "is_weekend",
    # Seasonal
    "stubble_season",
    # Meteorological
    "temperature",
    "humidity",
    "wind_speed",
    "wind_direction_sin",
    "wind_direction_cos",
]

# Target columns
TARGET_COLUMNS = ["pm25_t+24", "pm25_t+48", "pm25_t+72"]

# Human-readable labels for SHAP explanation
FACTOR_LABELS = {
    "pm25_lag_1h":         "Recent pollution level (1h ago)",
    "pm25_lag_6h":         "Pollution trend (6h ago)",
    "pm25_lag_24h":        "Persistent pollution trend (24h)",
    "pm25_lag_168h":       "Weekly pollution pattern",
    "pm25_roll_24h_mean":  "24-hour average pollution",
    "pm25_roll_24h_std":   "Pollution variability (24h)",
    "pm25_roll_7d_mean":   "7-day pollution trend",
    "hour_sin":            "Time of day (traffic pattern)",
    "hour_cos":            "Time of day (traffic pattern)",
    "day_of_week":         "Day of week effect",
    "month":               "Seasonal factor",
    "is_weekend":          "Weekend effect",
    "stubble_season":      "Stubble-burning season signal",
    "temperature":         "Temperature effect",
    "humidity":            "Atmospheric moisture (inversion)",
    "wind_speed":          "Wind dispersion effect",
    "wind_direction_sin":  "Wind direction (N-S component)",
    "wind_direction_cos":  "Wind direction (E-W component)",
}


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build feature matrix from raw hourly data.
    
    Args:
        df: DataFrame with columns: timestamp, ward_id, pm25, temperature,
            humidity, wind_speed, wind_direction, is_weekend, stubble_season, etc.
    
    Returns:
        DataFrame with feature columns + target columns, NaN rows dropped.
    """
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(["ward_id", "timestamp"]).reset_index(drop=True)

    # Group by ward for lag/rolling calculations
    grouped = df.groupby("ward_id")

    # ── Lag features ───────────────────────────────────────────────────
    df["pm25_lag_1h"] = grouped["pm25"].shift(1)
    df["pm25_lag_6h"] = grouped["pm25"].shift(6)
    df["pm25_lag_24h"] = grouped["pm25"].shift(24)
    df["pm25_lag_168h"] = grouped["pm25"].shift(168)  # 1 week

    # ── Rolling statistics ─────────────────────────────────────────────
    df["pm25_roll_24h_mean"] = grouped["pm25"].transform(
        lambda x: x.rolling(window=24, min_periods=12).mean()
    )
    df["pm25_roll_24h_std"] = grouped["pm25"].transform(
        lambda x: x.rolling(window=24, min_periods=12).std()
    )
    df["pm25_roll_7d_mean"] = grouped["pm25"].transform(
        lambda x: x.rolling(window=168, min_periods=72).mean()
    )

    # ── Time encodings ─────────────────────────────────────────────────
    hour = df["timestamp"].dt.hour
    df["hour_sin"] = np.sin(2 * np.pi * hour / 24)
    df["hour_cos"] = np.cos(2 * np.pi * hour / 24)
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["month"] = df["timestamp"].dt.month

    # ── Wind direction encoding (circular) ─────────────────────────────
    wind_rad = np.deg2rad(df["wind_direction"])
    df["wind_direction_sin"] = np.sin(wind_rad)
    df["wind_direction_cos"] = np.cos(wind_rad)

    # ── Target columns (future PM2.5) ─────────────────────────────────
    df["pm25_t+24"] = grouped["pm25"].shift(-24)
    df["pm25_t+48"] = grouped["pm25"].shift(-48)
    df["pm25_t+72"] = grouped["pm25"].shift(-72)

    # ── Drop rows with NaN (from lags/shifts) ──────────────────────────
    all_cols = FEATURE_COLUMNS + TARGET_COLUMNS
    df_features = df.dropna(subset=all_cols).reset_index(drop=True)

    print(f"✅ Feature engineering complete")
    print(f"   Input rows: {len(df):,}")
    print(f"   Output rows (after lag/target NaN drop): {len(df_features):,}")
    print(f"   Features: {len(FEATURE_COLUMNS)}")
    print(f"   Targets: {TARGET_COLUMNS}")

    return df_features


if __name__ == "__main__":
    # Quick test: load synthetic data and build features
    import os
    DATA_DIR = os.path.join(os.path.dirname(__file__), "raw", "historical_data.csv")
    if os.path.exists(DATA_DIR):
        df = pd.read_csv(DATA_DIR)
        result = build_features(df)
        print(f"\n   Sample features:\n{result[FEATURE_COLUMNS].describe().round(2)}")
    else:
        print("❌ No data file found. Run generate_synthetic_data.py first.")
