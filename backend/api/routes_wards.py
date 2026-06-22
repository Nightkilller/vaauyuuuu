"""
VaayuLens AI — Ward Routes
GET /api/wards — returns all Delhi ward/station data with coordinates
"""

from fastapi import APIRouter
from db.mongo_client import get_db

router = APIRouter()


@router.get("/wards")
async def get_wards(city: str | None = None):
    """Return list of all wards, optionally filtered by city."""
    db = await get_db()
    query = {}
    if city:
        query["city"] = city
    wards = await db.wards.find(query, {"_id": 0}).to_list(length=100)
    return {"wards": wards}
