"""
VaayuLens AI — Advisory Routes
GET /api/advisory/{ward_id} — plain-language citizen health advisory for one ward
"""

from fastapi import APIRouter, HTTPException
from db.mongo_client import get_db

router = APIRouter()


@router.get("/advisory/{ward_id}")
async def get_ward_advisory(ward_id: str):
    """Return template-based health advisory for a specific ward."""
    db = await get_db()
    advisory = await db.advisories.find_one({"ward_id": ward_id}, {"_id": 0})
    if not advisory:
        raise HTTPException(status_code=404, detail=f"No advisory found for ward '{ward_id}'")
    return advisory
