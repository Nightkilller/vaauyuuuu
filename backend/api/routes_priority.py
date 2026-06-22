"""
VaayuLens AI — Priority Ranking Routes
GET /api/priority-ranking — wards sorted by (forecasted severity × population)
"""

from fastapi import APIRouter
from db.mongo_client import get_db

router = APIRouter()


@router.get("/priority-ranking")
async def get_priority_ranking(city: str | None = None):
    """Return wards sorted by enforcement priority score, optionally filtered by city."""
    db = await get_db()
    query = {}
    if city:
        query["city"] = city
    rankings = await db.priorities.find(query, {"_id": 0}).sort("priority_score", -1).to_list(length=100)
    return {"rankings": rankings}
