"""
VaayuLens AI — Attribution Routes
GET /api/attribution/{ward_id} — SHAP factor breakdown for one ward
"""

from fastapi import APIRouter, HTTPException
from db.mongo_client import get_db

router = APIRouter()


@router.get("/attribution/{ward_id}")
async def get_ward_attribution(ward_id: str):
    """Return SHAP-based attribution factors for a specific ward's forecast."""
    db = await get_db()
    attribution = await db.attributions.find_one({"ward_id": ward_id}, {"_id": 0})
    if not attribution:
        raise HTTPException(status_code=404, detail=f"No attribution found for ward '{ward_id}'")
    return attribution
