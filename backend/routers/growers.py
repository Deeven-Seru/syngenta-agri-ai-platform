"""Growers Router"""
from fastapi import APIRouter, Query
from database import col_growers

router = APIRouter()


@router.get("")
async def list_growers(
    state: str = None,
    district: str = None,
    crop: str = None,
    language: str = None,
    device_type: str = None,
    limit: int = Query(50, le=500),
):
    query = {}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    if crop:
        query["primary_crop"] = crop
    if language:
        query["language"] = language
    if device_type:
        query["device_type"] = device_type

    cursor = col_growers().find(query, limit=limit)
    growers = await cursor.to_list(length=limit)
    for g in growers:
        g["grower_id"] = g.pop("_id")
    return {"growers": growers, "count": len(growers)}


@router.get("/segments")
async def get_segments():
    """Grower segments by crop × language × device."""
    pipeline = [
        {
            "$group": {
                "_id": {
                    "crop": "$primary_crop",
                    "language": "$language",
                    "device": "$device_type",
                },
                "count": {"$sum": 1},
                "avg_farm_size": {"$avg": "$farm_size_acres"},
                "product_scan_rate": {"$avg": {"$cond": ["$product_scan", 1, 0]}},
                "offline_rate": {"$avg": {"$cond": ["$offline_campaign_attended", 1, 0]}},
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 50},
    ]
    results = await col_growers().aggregate(pipeline).to_list(length=50)
    return {
        "segments": [
            {
                "crop": r["_id"]["crop"],
                "language": r["_id"]["language"],
                "device": r["_id"]["device"],
                "count": r["count"],
                "avg_farm_size": round(r["avg_farm_size"] or 0, 1),
                "product_scan_rate": round(100 * (r["product_scan_rate"] or 0), 1),
                "offline_rate": round(100 * (r["offline_rate"] or 0), 1),
            }
            for r in results
        ]
    }


@router.get("/{grower_id}")
async def get_grower(grower_id: str):
    g = await col_growers().find_one({"_id": grower_id})
    if not g:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Grower not found")
    g["grower_id"] = g.pop("_id")
    return g
