"""Growers Router"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from database import col_growers

router = APIRouter()


class GrowerCreateRequest(BaseModel):
    phone: str
    state: str
    district: str
    tehsil: str
    language: str
    device_type: str = "smartphone"
    grower_age: Optional[int] = None
    gender: Optional[str] = "male"
    primary_crop: str
    current_stage: str = "sowing"
    farm_size_acres: Optional[float] = None
    offline_campaign_attended: Optional[bool] = False
    campaign_attendance_date: Optional[str] = ""
    product_name: Optional[str] = ""



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


@router.post("")
async def create_grower(req: GrowerCreateRequest):
    clean_phone = req.phone.replace("whatsapp:", "").replace("+", "").strip()
    if not clean_phone:
        raise HTTPException(status_code=400, detail="Valid phone number required")
        
    existing = await col_growers().find_one({
        "$or": [
            {"_id": clean_phone},
            {"phone": clean_phone}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Grower with this phone number already registered")
    
    crop_calendar = {
        "crop": req.primary_crop,
        "current_stage": req.current_stage,
        "season": "Kharif_2026",
        "stages": [
            {"stage": req.current_stage, "approx": datetime.utcnow().strftime("%Y-%m-%d")}
        ]
    }
    
    doc = {
        "_id": clean_phone,
        "phone": clean_phone,
        "state": req.state,
        "district": req.district,
        "tehsil": req.tehsil,
        "language": req.language,
        "device_type": req.device_type,
        "grower_age": req.grower_age,
        "gender": req.gender,
        "crop_calendar": crop_calendar,
        "primary_crop": req.primary_crop,
        "product_scan": False,
        "product_name": req.product_name or "",
        "product_scan_datetime": "",
        "farm_size_acres": req.farm_size_acres,
        "offline_campaign_attended": req.offline_campaign_attended or False,
        "campaign_attendance_date": req.campaign_attendance_date or "",
    }
    
    await col_growers().insert_one(doc)
    
    doc["grower_id"] = doc.pop("_id")
    return doc

