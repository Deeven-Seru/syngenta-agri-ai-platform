"""
Autonomous Campaign Router — Triggered by Weather Watcher
"""
from fastapi import APIRouter, BackgroundTasks
from typing import Optional
import structlog

from database import col_autonomous_campaigns, col_weather_history
from services.weather_watcher import scan_for_anomalies

logger = structlog.get_logger()
router = APIRouter()

@router.post("/scan")
async def trigger_weather_scan(background_tasks: BackgroundTasks):
    """
    Manually trigger a weather anomaly scan.
    """
    background_tasks.add_task(scan_for_anomalies)
    return {"status": "scan_triggered", "message": "Weather watcher is scanning districts for anomalies."}

@router.get("/campaigns")
async def list_autonomous_campaigns(limit: int = 20):
    """
    List all autonomous campaigns triggered by weather anomalies.
    """
    cursor = col_autonomous_campaigns().find({}, sort=[("triggered_at", -1)]).limit(limit)
    campaigns = await cursor.to_list(length=limit)
    for c in campaigns:
        c["id"] = str(c.pop("_id"))
    return {"campaigns": campaigns, "count": len(campaigns)}

@router.get("/weather-history")
async def get_weather_history(district: Optional[str] = None, limit: int = 50):
    """
    View recorded weather history for districts.
    """
    query = {}
    if district:
        query["district"] = district
        
    cursor = col_weather_history().find(query, sort=[("timestamp", -1)]).limit(limit)
    history = await cursor.to_list(length=limit)
    for h in history:
        h.pop("_id", None)
    return {"history": history, "count": len(history)}
