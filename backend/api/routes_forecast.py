"""
VaayuLens AI — Forecast Routes
GET /api/forecast/all      — current + 72h forecast for every ward (for map)
GET /api/forecast/{ward_id} — detailed forecast trend for one ward
"""

from fastapi import APIRouter, HTTPException
from db.mongo_client import get_db

router = APIRouter()


@router.get("/forecast/all")
async def get_all_forecasts(city: str | None = None):
    """Return latest forecast summary for wards, optionally filtered by city."""
    db = await get_db()
    query = {}
    if city:
        query["city"] = city
    forecasts = await db.forecasts.find(query, {"_id": 0}).to_list(length=100)
    return {"forecasts": forecasts}


@router.get("/forecast/{ward_id}")
async def get_ward_forecast(ward_id: str):
    """Return detailed 72h forecast trend for a specific ward."""
    db = await get_db()
    forecast = await db.forecasts.find_one({"ward_id": ward_id}, {"_id": 0})
    if not forecast:
        raise HTTPException(status_code=404, detail=f"No forecast found for ward '{ward_id}'")
    return forecast
