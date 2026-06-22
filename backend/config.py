"""
VaayuLens AI — Configuration
Loads environment variables with sensible defaults for development.
"""

import os
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ── Data Mode ──────────────────────────────────────────────────────────
# "synthetic" = use generated realistic data (no API keys needed, safe for demo)
# "live"      = attempt real CPCB + OpenWeatherMap APIs (requires keys below)
DATA_MODE: str = os.getenv("DATA_MODE", "synthetic")

# ── MongoDB ────────────────────────────────────────────────────────────
MONGO_URI: str = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017/vaayulens"  # fallback to local MongoDB
)
MONGO_DB_NAME: str = "vaayulens"

# ── External API Keys (only used when DATA_MODE=live) ─────────────────
OWM_API_KEY: str = os.getenv("OWM_API_KEY", "")
CPCB_API_KEY: str = os.getenv("CPCB_API_KEY", "")

# ── CORS ───────────────────────────────────────────────────────────────
FRONTEND_URLS: list[str] = [
    url.strip()
    for url in os.getenv("FRONTEND_URLS", "http://localhost:5173").split(",")
]

# ── Paths ──────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
RAW_DATA_DIR = os.path.join(DATA_DIR, "raw")
MODELS_DIR = os.path.join(BASE_DIR, "ml", "models")
WARDS_FILE = os.path.join(DATA_DIR, "wards.json")

# Ensure output directories exist
os.makedirs(RAW_DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
