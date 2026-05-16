"""
Weather Watcher Service — Proactive Anomaly Detection
- Scans districts for weather anomalies (Heat, Pest risk, Frost)
- Triggers autonomous campaigns when thresholds are breached
"""
import asyncio
from datetime import datetime, timezone, timedelta
import structlog
import uuid

from database import col_weather_history, col_autonomous_campaigns, col_growers, col_model_scores, col_campaigns
from services.weather_service import get_bulk_district_weather, DISTRICT_COORDS
from services.campaign_service import dispatch_twilio_messages
from services.receptivity_service import score_growers
from config import get_settings

logger = structlog.get_logger()

# Anomaly Thresholds (as per Issue #13)
THRESHOLDS = {
    "PEST_HUMIDITY": 85.0,    # %
    "PEST_TEMP_MIN": 20.0,    # °C
    "PEST_TEMP_MAX": 30.0,    # °C
    "HEAT_STRESS_TEMP": 42.0, # °C
    "FROST_TEMP": 4.0,        # °C
}

async def check_pest_anomaly(district: str, current_data: dict) -> bool:
    """Check if Pest Alert criteria met consistently over last 48 hours."""
    now = datetime.now(timezone.utc)
    lookback = (now - timedelta(hours=48)).isoformat()
    
    # Criteria: Humidity > 85 and Temp 20-30
    if not (current_data.get("humidity_pct", 0) > THRESHOLDS["PEST_HUMIDITY"] and 
            THRESHOLDS["PEST_TEMP_MIN"] <= current_data.get("temperature_c", 0) <= THRESHOLDS["PEST_TEMP_MAX"]):
        return False
        
    # Check history: Are there any breaches of the condition in the last 48h?
    history_cursor = col_weather_history().find({
        "district": district,
        "timestamp": {"$gte": lookback},
        "$or": [
            {"humidity": {"$lte": THRESHOLDS["PEST_HUMIDITY"]}},
            {"temp": {"$lt": THRESHOLDS["PEST_TEMP_MIN"]}},
            {"temp": {"$gt": THRESHOLDS["PEST_TEMP_MAX"]}}
        ]
    })
    fails = await history_cursor.to_list(length=1)
    if fails:
        return False

    # Ensure at least one historical record exists to confirm the 48h trend
    has_history = await col_weather_history().find_one({
        "district": district,
        "timestamp": {"$gte": lookback, "$lt": (now - timedelta(minutes=15)).isoformat()}
    })
    return has_history is not None

async def check_heat_anomaly(district: str, current_data: dict) -> bool:
    """Check if Heat Stress criteria met consistently over last 3 days."""
    now = datetime.now(timezone.utc)
    lookback = (now - timedelta(days=3)).isoformat()
    
    if current_data.get("temperature_c", 0) <= THRESHOLDS["HEAT_STRESS_TEMP"]:
        return False
        
    # Are there any records in the last 3 days where temp was NOT > 42?
    history_cursor = col_weather_history().find({
        "district": district,
        "timestamp": {"$gte": lookback},
        "temp": {"$lte": THRESHOLDS["HEAT_STRESS_TEMP"]}
    })
    fails = await history_cursor.to_list(length=1)
    if fails:
        return False

    # Ensure at least one historical record exists to confirm the 3-day trend
    has_history = await col_weather_history().find_one({
        "district": district,
        "timestamp": {"$gte": lookback, "$lt": (now - timedelta(minutes=15)).isoformat()}
    })
    return has_history is not None

async def scan_for_anomalies():
    """
    1. Fetch current weather for all districts
    2. Store in history
    3. Check for anomalies
    4. Trigger campaigns if needed
    """
    logger.info("🌤 Starting Weather Watcher scan...")
    all_districts = list(DISTRICT_COORDS.keys())
    weather_map = await get_bulk_district_weather(all_districts)
    
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    history_docs = []
    
    for district, data in weather_map.items():
        if "error" in data:
            continue
            
        # Prepare history doc
        history_docs.append({
            "district": district,
            "timestamp": now_iso,
            "temp": data.get("temperature_c"),
            "humidity": data.get("humidity_pct"),
            "precip": data.get("precipitation_mm")
        })

    if history_docs:
        await col_weather_history().insert_many(history_docs)

    # Check anomalies for all districts concurrently with exception handling
    tasks = [process_district_anomalies(district, data) for district, data in weather_map.items() if "error" not in data]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for district, res in zip(weather_map.keys(), results):
        if isinstance(res, Exception):
            logger.error("District anomaly processing failed", district=district, error=str(res))

    logger.info("✅ Weather Watcher scan complete.")

async def process_district_anomalies(district: str, data: dict):
    """Check all anomalies for a single district without masking."""
    # Check for Frost (Immediate)
    if data.get("temperature_c") is not None and data.get("temperature_c") < THRESHOLDS["FROST_TEMP"]:
        await trigger_autonomous_campaign(district, "Frost Warning", data)
        
    # Check for Pest Risk (48h lookback)
    if await check_pest_anomaly(district, data):
        await trigger_autonomous_campaign(district, "Pest Alert", data)
        
    # Check for Heat Stress (3 days lookback)
    if await check_heat_anomaly(district, data):
        await trigger_autonomous_campaign(district, "Heat Stress", data)

async def trigger_autonomous_campaign(district: str, anomaly_type: str, weather_data: dict):
    """
    Identify growers, generate content, and dispatch.
    """
    # Check if we already triggered this today for this district
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await col_autonomous_campaigns().find_one({
        "district": district,
        "anomaly_type": anomaly_type,
        "triggered_at": {"$gte": today_start.isoformat()}
    })
    
    if existing:
        logger.info("Skip: Anomaly already handled today", district=district, type=anomaly_type)
        return

    logger.info("🚨 Triggering Autonomous Campaign!", district=district, type=anomaly_type)
    
    # 1. Identify Growers in District
    grower_count = await col_growers().count_documents({"district": district})
    if grower_count == 0:
        logger.warning("No growers found in district", district=district)
        return

    # 2. Record Campaign (Consistent UTC ID and Timestamp)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    campaign_id = f"AUTO_{anomaly_type.replace(' ', '_').upper()}_{now.strftime('%Y%m%d')}_{str(uuid.uuid4())[:8]}"
    
    # Determine anomaly-specific metadata
    crop = "General"
    product = "Syngenta Protective Solutions"
    
    if anomaly_type == "Pest Alert":
        product = "Syngenta Fungicide/Pesticide"
    elif anomaly_type == "Heat Stress":
        product = "Syngenta Stress Management"
    elif anomaly_type == "Frost Warning":
        product = "Syngenta Frost Protection"

    # Create record in col_campaigns so dispatch logic works correctly (ISO string)
    campaign_doc = {
        "_id": campaign_id,
        "name": f"Autonomous: {anomaly_type} ({district})",
        "crop": crop,
        "product": product,
        "status": "launching",
        "created_at": now_iso,
        "total_targets": grower_count,
        "is_autonomous": True
    }
    await col_campaigns().insert_one(campaign_doc)

    # Record in autonomous summary
    auto_doc = {
        "_id": campaign_id,
        "district": district,
        "anomaly_type": anomaly_type,
        "triggered_at": now_iso,
        "status": "launching",
        "target_count": grower_count,
        "product": product,
        "weather_snapshot": {
            "temp": weather_data.get("temperature_c"),
            "humidity": weather_data.get("humidity_pct")
        }
    }
    await col_autonomous_campaigns().insert_one(auto_doc)

    # 3. Prepare targets and dispatch (Reuse AI Scoring in Batches)
    growers_cursor = col_growers().find({"district": district})
    
    # Process and score in chunks to balance memory and event loop responsiveness
    batch_size = 2000
    chunk = []
    async for g in growers_cursor:
        chunk.append(g)
        if len(chunk) >= batch_size:
            await _score_and_insert_batch(campaign_id, chunk, product, crop, district)
            chunk = []
            
    if chunk:
        await _score_and_insert_batch(campaign_id, chunk, product, crop, district)

    settings = get_settings()
    # Offload to background with error logging
    dispatch_task = asyncio.create_task(dispatch_twilio_messages(campaign_id, crop, settings))
    
    def on_task_done(t):
        try:
            t.result()
        except Exception as e:
            logger.error("Autonomous dispatch task failed", campaign_id=campaign_id, error=str(e))
            
    dispatch_task.add_done_callback(on_task_done)
    
    logger.info("🚀 Autonomous Campaign Dispatched", id=campaign_id, targets=grower_count)

async def _score_and_insert_batch(campaign_id: str, growers: list, product: str, crop: str, district: str):
    """Offload scoring to a thread pool and batch insert results."""
    # Score growers (CPU intensive, offload to thread)
    scored_growers = await asyncio.to_thread(score_growers, growers, product, crop)
    
    score_docs = [{
        "campaign_id": campaign_id,
        "grower_id": g["_id"],
        "receptivity_score": g["receptivity_score"], 
        "receptivity_tier": g["receptivity_tier"],
        "device_type": g.get("device_type", "smartphone"),
        "language": g.get("language", "Hindi"),
        "district": district
    } for g in scored_growers]
    
    if score_docs:
        await col_model_scores().insert_many(score_docs)
