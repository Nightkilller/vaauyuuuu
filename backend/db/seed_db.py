"""
VaayuLens AI — Database Seeder

Orchestration script that:
1. Generates synthetic data (or loads existing CSV)
2. Engineers features
3. Trains models (or loads existing models)
4. Generates forecasts for all wards
5. Generates SHAP attributions for all wards
6. Computes priority rankings (severity × population)
7. Generates health advisories
8. Seeds everything into MongoDB

Run: python -m db.seed_db
"""

import os
import sys
import json
import asyncio

import pandas as pd
from pymongo import MongoClient

# Add parent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from config import MONGO_URI, MONGO_DB_NAME, WARDS_FILE, RAW_DATA_DIR
from data.generate_synthetic_data import generate_synthetic_data
from ml.features import build_features, FEATURE_COLUMNS
from ml.forecast import generate_all_ward_forecasts, pm25_to_aqi
from ml.explain import generate_all_ward_attributions


def load_wards():
    """Load ward definitions from JSON."""
    with open(WARDS_FILE, "r") as f:
        data = json.load(f)
    return data["wards"]


def generate_priority_rankings(forecasts, wards):
    """
    Compute enforcement priority score = forecasted AQI severity × (population / 100k).
    Higher score = more urgent enforcement action needed.
    """
    ward_lookup = {w["ward_id"]: w for w in wards}
    
    rankings = []
    for fc in forecasts:
        ward = ward_lookup.get(fc["ward_id"], {})
        pop = ward.get("population_approx", 200000)
        
        # Use 24h forecast AQI as the primary severity metric
        forecast_aqi = fc.get("forecast_aqi_24h", fc.get("current_aqi", 100))
        
        # Priority score = AQI × (population / 100,000)
        priority_score = forecast_aqi * (pop / 100000)
        
        rankings.append({
            "ward_id": fc["ward_id"],
            "ward_name": ward.get("name", fc["ward_id"]),
            "city": ward.get("city", "Delhi"),
            "current_aqi": fc["current_aqi"],
            "forecast_aqi_24h": forecast_aqi,
            "population": pop,
            "priority_score": round(priority_score, 1),
            "zone": ward.get("zone", ""),
        })
    
    # Sort by priority score descending
    rankings.sort(key=lambda x: x["priority_score"], reverse=True)
    
    print(f"✅ Generated priority rankings for {len(rankings)} wards")
    top3 = [f"{r['ward_name']} ({r['priority_score']})" for r in rankings[:3]]
    print(f"   Top 3: {', '.join(top3)}")
    return rankings


def generate_advisories(forecasts, wards):
    """
    Generate template-based health advisories per ward.
    Advisory severity based on 24h forecast AQI.
    """
    ward_lookup = {w["ward_id"]: w for w in wards}
    
    # Advisory templates by AQI range
    templates = {
        "good": {
            "risk_level": "low",
            "message": "Air quality in {ward} is expected to be Good (AQI {aqi}). Enjoy outdoor activities freely.",
            "actions": [
                "No precautions needed",
                "Great day for outdoor exercise",
            ],
        },
        "satisfactory": {
            "risk_level": "low",
            "message": "Air quality in {ward} is expected to be Satisfactory (AQI {aqi}). Minor concern for sensitive groups.",
            "actions": [
                "Sensitive individuals may consider limiting prolonged outdoor exertion",
                "Keep windows open for ventilation",
            ],
        },
        "moderate": {
            "risk_level": "moderate",
            "message": "Air quality in {ward} is expected to be Moderate (AQI {aqi}). Sensitive groups should take precautions.",
            "actions": [
                "People with respiratory conditions should limit outdoor exposure",
                "Consider wearing N95 mask during peak traffic hours",
                "Keep indoor air purifiers running",
            ],
        },
        "poor": {
            "risk_level": "high",
            "message": "⚠️ High PM2.5 expected in {ward} (AQI {aqi}). Avoid prolonged outdoor activity, especially 6-9 AM and 6-9 PM.",
            "actions": [
                "Sensitive groups should avoid outdoor activity",
                "Use N95 masks when outdoors",
                "Keep windows closed, use air purifier",
                "Avoid outdoor exercise — use indoor alternatives",
            ],
        },
        "verypoor": {
            "risk_level": "severe",
            "message": "🔴 Very Poor air quality expected in {ward} (AQI {aqi}). All residents should minimize outdoor exposure.",
            "actions": [
                "Everyone should avoid prolonged outdoor activity",
                "N95 masks essential when outdoors",
                "Keep all windows and doors closed",
                "Schools should consider indoor-only activities",
                "Monitor for respiratory symptoms — seek medical help if needed",
            ],
        },
        "severe": {
            "risk_level": "severe",
            "message": "🚨 SEVERE air quality alert for {ward} (AQI {aqi}). Stay indoors. Health emergency conditions.",
            "actions": [
                "Stay indoors as much as possible",
                "N95/N99 masks essential for any outdoor exposure",
                "Seal windows, run air purifiers on max",
                "Avoid all outdoor exercise and labor",
                "Schools and outdoor workers: consider closure/work-from-home",
                "Seek immediate medical attention for breathing difficulty",
            ],
        },
    }
    
    advisories = []
    for fc in forecasts:
        ward = ward_lookup.get(fc["ward_id"], {})
        aqi = fc.get("forecast_aqi_24h", fc["current_aqi"])
        
        # Determine category
        if aqi <= 50:
            cat = "good"
        elif aqi <= 100:
            cat = "satisfactory"
        elif aqi <= 200:
            cat = "moderate"
        elif aqi <= 300:
            cat = "poor"
        elif aqi <= 400:
            cat = "verypoor"
        else:
            cat = "severe"
        
        template = templates[cat]
        ward_name = ward.get("name", fc["ward_id"])
        
        advisories.append({
            "ward_id": fc["ward_id"],
            "ward_name": ward_name,
            "city": ward.get("city", "Delhi"),
            "aqi": round(aqi),
            "category": cat,
            "risk_level": template["risk_level"],
            "message": template["message"].format(ward=ward_name, aqi=round(aqi)),
            "actions": template["actions"],
        })
    
    print(f"✅ Generated advisories for {len(advisories)} wards")
    return advisories


def seed_database():
    """Main seeding pipeline — runs all steps and populates MongoDB."""
    
    print("\n" + "="*70)
    print("🌬️  VaayuLens AI — Database Seeder")
    print("="*70)
    
    # ── Step 1: Load or generate data ─────────────────────────────────
    csv_path = os.path.join(RAW_DATA_DIR, "historical_data.csv")
    if os.path.exists(csv_path):
        print("\n📂 Loading existing synthetic data...")
        df = pd.read_csv(csv_path)
    else:
        print("\n🔧 Generating synthetic data...")
        df = generate_synthetic_data()
    
    # ── Step 2: Feature engineering ───────────────────────────────────
    print("\n🔧 Building features...")
    df_feat = build_features(df)
    
    # ── Step 3: Load wards ────────────────────────────────────────────
    print("\n📍 Loading ward data...")
    wards = load_wards()
    print(f"   {len(wards)} wards loaded")
    
    # ── Step 4: Check/train models ────────────────────────────────────
    models_dir = os.path.join(os.path.dirname(__file__), "..", "ml", "models")
    model_exists = os.path.exists(os.path.join(models_dir, "model_24h.joblib"))
    
    if not model_exists:
        print("\n🚀 No trained models found — training now...")
        from ml.train_model import train_models
        train_models()
    else:
        print("\n✅ Trained models found")
    
    # ── Step 5: Generate forecasts ────────────────────────────────────
    print("\n🔮 Generating forecasts for all wards...")
    forecasts = generate_all_ward_forecasts(df_feat, FEATURE_COLUMNS)
    
    # ── Step 6: Generate attributions ─────────────────────────────────
    print("\n🧠 Generating SHAP attributions...")
    attributions = generate_all_ward_attributions(df_feat, FEATURE_COLUMNS)
    
    # ── Step 7: Compute priority rankings ─────────────────────────────
    print("\n📊 Computing priority rankings...")
    rankings = generate_priority_rankings(forecasts, wards)
    
    # ── Step 8: Generate advisories ───────────────────────────────────
    print("\n💬 Generating health advisories...")
    advisories = generate_advisories(forecasts, wards)
    
    # ── Step 9: Seed MongoDB ──────────────────────────────────────────
    print(f"\n💾 Connecting to MongoDB...")
    print(f"   URI: {MONGO_URI[:30]}...")
    
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Test connection
        client.admin.command('ping')
        db = client[MONGO_DB_NAME]
        print("   ✅ Connected!")
        
        # Clear existing data
        for collection in ["wards", "forecasts", "attributions", "priorities", "advisories"]:
            db[collection].drop()
        
        # Insert data
        db.wards.insert_many(wards)
        print(f"   📍 Inserted {len(wards)} wards")
        
        db.forecasts.insert_many(forecasts)
        print(f"   🔮 Inserted {len(forecasts)} forecasts")
        
        db.attributions.insert_many(attributions)
        print(f"   🧠 Inserted {len(attributions)} attributions")
        
        db.priorities.insert_many(rankings)
        print(f"   📊 Inserted {len(rankings)} priority rankings")
        
        db.advisories.insert_many(advisories)
        print(f"   💬 Inserted {len(advisories)} advisories")
        
        client.close()
        
    except Exception as e:
        print(f"\n   ⚠️  MongoDB connection failed: {e}")
        print("   📁 Saving data as JSON files instead (API will read from these)...")
        
        # Fallback: save as JSON files for file-based serving
        json_dir = os.path.join(os.path.dirname(__file__), "..", "data", "seeded")
        os.makedirs(json_dir, exist_ok=True)
        
        def save_json(data, filename):
            # Remove MongoDB ObjectIds if present
            clean = []
            for item in data:
                item_clean = {k: v for k, v in item.items() if k != "_id"}
                clean.append(item_clean)
            with open(os.path.join(json_dir, filename), "w") as f:
                json.dump(clean, f, indent=2, default=str)
        
        save_json(wards, "wards.json")
        save_json(forecasts, "forecasts.json")
        save_json(attributions, "attributions.json")
        save_json(rankings, "priorities.json")
        save_json(advisories, "advisories.json")
        
        print(f"   ✅ Saved all data to {json_dir}/")
    
    print("\n" + "="*70)
    print("✅ Database seeding complete!")
    print("="*70 + "\n")


if __name__ == "__main__":
    seed_database()
