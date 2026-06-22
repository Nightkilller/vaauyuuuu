"""
VaayuLens AI — Synthetic Data Generator

Generates 90 days × 24 hours × 18 wards of realistic air quality + weather data
for Delhi, Mumbai, and Bengaluru. Encodes realistic city-specific patterns:

  - Delhi: Severe winter inversions (2-3x), stubble burning (Oct-Nov), extreme temperatures
  - Mumbai: Coastal land-sea breeze dispersion, high year-round humidity, milder winters
  - Bengaluru: Moderate plateau climate, lower baseline spikes, stable wind patterns

Output: backend/data/raw/historical_data.csv
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ── Configuration ──────────────────────────────────────────────────────
DAYS = 90
HOURS_PER_DAY = 24
SEED = 42

# Where to output
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "raw")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "historical_data.csv")
WARDS_FILE = os.path.join(BASE_DIR, "wards.json")

# Ward-specific PM2.5 base levels (µg/m³ annual avg proxy)
WARD_BASELINES = {
    # Delhi (Severe)
    "anand_vihar":    85,
    "rk_puram":       60,
    "dwarka_sec8":    55,
    "rohini":         62,
    "ito":            70,
    "wazirpur":       80,
    # Mumbai (Moderate/Coastal)
    "colaba":         30,
    "bandra":         42,
    "mazagaon":       45,
    "sion":           55,
    "kurla":          52,
    "borivali":       35,
    # Bengaluru (Clean/Moderate)
    "hsr_layout":      35,
    "peenya":          50,
    "silk_board":      48,
    "whitefield":      44,
    "hebbal":          38,
    "city_railway":    40,
}


def generate_synthetic_data():
    """Generate the full multi-city synthetic dataset."""
    np.random.seed(SEED)

    # Load ward definitions
    with open(WARDS_FILE, "r") as f:
        ward_data = json.load(f)
    wards = ward_data["wards"]

    # Start date: 90 days back from a reference winter date (Nov 15)
    start_date = datetime(2024, 9, 1, 0, 0, 0)
    
    records = []
    
    for ward in wards:
        ward_id = ward["ward_id"]
        ward_name = ward["name"]
        city = ward.get("city", "Delhi")
        near_ncr = ward.get("near_ncr_border", False)
        base_pm25 = WARD_BASELINES.get(ward_id, 45)

        for day in range(DAYS):
            current_date = start_date + timedelta(days=day)
            day_of_year = current_date.timetuple().tm_yday
            month = current_date.month
            day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday
            is_weekend = 1 if day_of_week >= 5 else 0

            for hour in range(HOURS_PER_DAY):
                timestamp = current_date + timedelta(hours=hour)

                # ── Seasonal multiplier (City specific) ────────────────
                if city == "Delhi":
                    if month in [10, 11, 12, 1]:
                        seasonal_mult = (2.5 if month in [11, 12] else 1.8) + np.random.normal(0, 0.25)
                    elif month in [2, 3]:
                        seasonal_mult = 1.3 + np.random.normal(0, 0.15)
                    elif month in [7, 8]:
                        seasonal_mult = 0.5 + np.random.normal(0, 0.1)
                    else:
                        seasonal_mult = 1.0 + np.random.normal(0, 0.1)
                elif city == "Mumbai":
                    # Mumbai has milder winters, clean monsoons (washout)
                    if month in [11, 12, 1]:
                        seasonal_mult = 1.4 + np.random.normal(0, 0.15)
                    elif month in [6, 7, 8, 9]:  # Heavy monsoon washout
                        seasonal_mult = 0.35 + np.random.normal(0, 0.08)
                    else:
                        seasonal_mult = 0.9 + np.random.normal(0, 0.1)
                else:  # Bengaluru (stable year-round climate)
                    if month in [12, 1]:
                        seasonal_mult = 1.25 + np.random.normal(0, 0.1)
                    elif month in [6, 7, 8]:
                        seasonal_mult = 0.6 + np.random.normal(0, 0.08)
                    else:
                        seasonal_mult = 0.95 + np.random.normal(0, 0.08)
                
                seasonal_mult = max(0.2, seasonal_mult)

                # ── Diurnal traffic pattern ────────────────────────────
                # Morning rush (7-10 AM), evening rush (6-9 PM)
                if 7 <= hour <= 10:
                    traffic_mult = 1.3 + 0.15 * np.sin((hour - 7) / 3 * np.pi)
                elif 18 <= hour <= 21:
                    traffic_mult = 1.4 + 0.15 * np.sin((hour - 18) / 3 * np.pi)
                elif 2 <= hour <= 5:
                    traffic_mult = 0.7
                else:
                    traffic_mult = 1.0
                traffic_mult += np.random.normal(0, 0.05)

                # ── Weekend effect ─────────────────────────────────────
                weekend_mult = 0.85 if is_weekend else 1.0

                # ── Stubble burning (Oct 1 – Nov 15, Delhi NCR border wards only)
                stubble_season = 0
                stubble_mult = 1.0
                if city == "Delhi" and (month == 10 or (month == 11 and current_date.day <= 15)):
                    stubble_season = 1
                    if near_ncr:
                        stubble_mult = 1.45 + np.random.normal(0, 0.15)
                    else:
                        stubble_mult = 1.15 + np.random.normal(0, 0.05)

                # ── Weather generation (City specific) ─────────────────
                if city == "Delhi":
                    # Temperature
                    temp_base = 14 + np.random.normal(0, 2) if month in [11, 12, 1, 2] else (38 + np.random.normal(0, 3) if month in [5, 6, 7] else 28 + np.random.normal(0, 3))
                    temp_diurnal = 6 * np.sin((hour - 6) / 24 * 2 * np.pi)
                    temperature = temp_base + temp_diurnal
                    # Humidity
                    humidity_base = 65 if month in [11, 12, 1, 2] else 45
                    humidity = np.clip(humidity_base + np.random.normal(0, 10) - 0.35 * temp_diurnal, 20, 95)
                    # Wind
                    wind_base = 3 if month in [11, 12, 1] else 6
                    wind_speed = max(0.5, wind_base + np.random.exponential(1.5))
                    wind_direction = np.random.uniform(0, 360)
                    if stubble_season and near_ncr:
                        wind_direction = (315 + np.random.normal(0, 25)) % 360

                elif city == "Mumbai":
                    # Stable coastal temperature: mild winter (22-26C), summer (30-34C)
                    temp_base = 24 + np.random.normal(0, 1.5) if month in [11, 12, 1, 2] else 32 + np.random.normal(0, 1.5)
                    temp_diurnal = 3 * np.sin((hour - 6) / 24 * 2 * np.pi)
                    temperature = temp_base + temp_diurnal
                    # High coastal humidity year-round
                    humidity = np.clip(75 + np.random.normal(0, 7) - 0.15 * temp_diurnal, 45, 95)
                    # Higher wind speed due to sea breezes
                    wind_speed = max(2.5, 9 + np.random.normal(0, 3))
                    # Sea breeze/land breeze cycle (NW/W in afternoon, SE/E at night)
                    wind_direction = (270 + np.random.normal(0, 30)) % 360 if (11 <= hour <= 19) else (90 + np.random.normal(0, 30)) % 360

                else:  # Bengaluru (stable high-altitude plateau)
                    # Moderate year-round (17-21C winter, 28-32C summer)
                    temp_base = 19 + np.random.normal(0, 1.5) if month in [11, 12, 1, 2] else 29 + np.random.normal(0, 2)
                    temp_diurnal = 4.5 * np.sin((hour - 6) / 24 * 2 * np.pi)
                    temperature = temp_base + temp_diurnal
                    # Moderate humidity
                    humidity = np.clip(55 + np.random.normal(0, 8) - 0.25 * temp_diurnal, 30, 90)
                    # Moderate winds
                    wind_speed = max(1.5, 6 + np.random.normal(0, 2))
                    wind_direction = (240 + np.random.normal(0, 45)) % 360

                # ── Meteorological dispersion impact on PM2.5 ─────────
                # Coastal winds disperse Mumbai pollution more effectively
                dispersion_factor = 0.08 if city == "Mumbai" else (0.05 if city == "Bengaluru" else 0.08)
                wind_effect = max(0.4, 1.4 - dispersion_factor * wind_speed)
                
                # Winter thermal inversion in Delhi/Bengaluru
                if city in ["Delhi", "Bengaluru"] and month in [11, 12, 1, 2] and humidity > 60:
                    humidity_effect = 1.0 + 0.006 * (humidity - 60)
                else:
                    humidity_effect = 1.0

                # ── Final PM2.5 calculation ────────────────────────────
                pm25 = (
                    base_pm25
                    * seasonal_mult
                    * traffic_mult
                    * weekend_mult
                    * stubble_mult
                    * wind_effect
                    * humidity_effect
                    + np.random.normal(0, base_pm25 * 0.08)  # noise
                )
                pm25 = max(5, round(pm25, 1))  # floor at 5 µg/m³

                # ── Other pollutants ───────────────────────────────────
                pm10 = pm25 * (1.5 + np.random.normal(0, 0.12))
                pm10 = max(10, round(pm10, 1))

                no2 = 15 + pm25 * 0.25 + np.random.normal(0, 4)
                no2 = max(4, round(no2, 1))

                so2 = 6 + pm25 * 0.06 + np.random.normal(0, 1.5)
                so2 = max(1, round(so2, 1))

                co = 0.4 + pm25 * 0.007 + np.random.normal(0, 0.08)
                co = max(0.1, round(co, 2))

                records.append({
                    "timestamp": timestamp.isoformat(),
                    "ward_id": ward_id,
                    "ward_name": ward_name,
                    "pm25": pm25,
                    "pm10": pm10,
                    "no2": no2,
                    "so2": so2,
                    "co": co,
                    "temperature": round(temperature, 1),
                    "humidity": round(humidity, 1),
                    "wind_speed": round(wind_speed, 1),
                    "wind_direction": round(wind_direction, 1),
                    "is_weekend": is_weekend,
                    "day_of_year": day_of_year,
                    "stubble_season": stubble_season,
                })

    df = pd.DataFrame(records)

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Save to CSV
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"✅ Generated {len(df):,} records")
    print(f"   Wards: {df['ward_id'].nunique()}")
    print(f"   Date range: {df['timestamp'].min()} → {df['timestamp'].max()}")
    print(f"   PM2.5 range: {df['pm25'].min()} — {df['pm25'].max()} µg/m³")
    print(f"   Output: {OUTPUT_FILE}")

    return df


if __name__ == "__main__":
    generate_synthetic_data()
