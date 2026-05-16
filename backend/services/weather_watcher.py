"""
Weather Watcher Service — Proactive Anomaly Detection
- Scans districts for weather anomalies (Heat, Pest risk, Frost)
- Triggers autonomous campaigns when thresholds are breached
"""
import asyncio
from datetime import datetime, timezone, timedelta
import structlog
import uuid

from database import col_weather_history, col_autonomous_campaigns, col_growers
from services.weather_service import get_bulk_district_weather, DISTRICT_COORDS
from services.content_generator import generate_whatsapp_message, generate_voice_script
from routers.campaigns import dispatch_twilio_messages
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
    
    for district, data in weather_map.items():
        if "error" in data:
            continue
            
        # Store in history
        history_doc = {
            "district": district,
            "timestamp": now,
            "temp": data.get("temperature_c"),
            "humidity": data.get("humidity_pct"),
            "precip": data.get("precipitation_mm")
        }
        await col_weather_history().insert_one(history_doc)
        
        # Check for Frost (Immediate)
        if data.get("temperature_c") is not None and data.get("temperature_c") < THRESHOLDS["FROST_TEMP"]:
            await trigger_autonomous_campaign(district, "Frost Warning", data)
            continue
            
        # Check for Pest Risk (simplified for demo: current check + look back 24h if exists)
        if (data.get("humidity_pct", 0) > THRESHOLDS["PEST_HUMIDITY"] and 
            THRESHOLDS["PEST_TEMP_MIN"] <= data.get("temperature_c", 0) <= THRESHOLDS["PEST_TEMP_MAX"]):
            await trigger_autonomous_campaign(district, "Pest Alert", data)
            continue
            
        # Check for Heat Stress
        if data.get("temperature_c", 0) > THRESHOLDS["HEAT_STRESS_TEMP"]:
            await trigger_autonomous_campaign(district, "Heat Stress", data)
            continue

    logger.info("✅ Weather Watcher scan complete.")

async def trigger_autonomous_campaign(district: str, anomaly_type: str, weather_data: dict):
    """
    Identify growers, generate content, and dispatch.
    """
    # Check if we already triggered this today for this district
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await col_autonomous_campaigns().find_one({
        "district": district,
        "anomaly_type": anomaly_type,
        "triggered_at": {"$gte": today_start}
    })
    
    if existing:
        logger.info("Skip: Anomaly already handled today", district=district, type=anomaly_type)
        return

    logger.info("🚨 Triggering Autonomous Campaign!", district=district, type=anomaly_type)
    
    # 1. Identify Growers in District
    growers_cursor = col_growers().find({"district": district})
    growers = await growers_cursor.to_list(length=1000) # Safety limit
    
    if not growers:
        logger.warning("No growers found in district", district=district)
        return

    # 2. Record Campaign
    campaign_id = f"AUTO_{anomaly_type.replace(' ', '_').upper()}_{datetime.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:4]}"
    
    campaign_doc = {
        "_id": campaign_id,
        "district": district,
        "anomaly_type": anomaly_type,
        "triggered_at": datetime.now(timezone.utc),
        "status": "launching",
        "target_count": len(growers),
        "weather_snapshot": {
            "temp": weather_data.get("temperature_c"),
            "humidity": weather_data.get("humidity_pct")
        }
    }
    await col_autonomous_campaigns().insert_one(campaign_doc)

    # 3. Dispatch (reuse existing logic)
    # We need to map growers to the format expected by dispatch_twilio_messages
    # For autonomous campaigns, we use a fixed crop/product based on anomaly
    crop = "General"
    product = "Syngenta Protective Solutions"
    
    if anomaly_type == "Pest Alert":
        product = "Syngenta Fungicide/Pesticide"
    elif anomaly_type == "Heat Stress":
        product = "Syngenta Stress Management"
    elif anomaly_type == "Frost Warning":
        product = "Syngenta Frost Protection"

    # Prepare targets
    targets = []
    for g in growers:
        targets.append({
            "grower_id": g["_id"],
            "device_type": g.get("device_type", "smartphone"),
            "language": g.get("language", "Hindi"),
            "district": district
        })

    # Add to a temporary model_scores collection for dispatch logic consistency
    # Actually, dispatch_twilio_messages reads from col_model_scores() based on campaign_id
    from database import col_model_scores
    score_docs = [{
        "campaign_id": campaign_id,
        "grower_id": t["grower_id"],
        "receptivity_score": 1.0, # High priority
        "receptivity_tier": "high",
        "device_type": t["device_type"],
        "language": t["language"],
        "district": t["district"]
    } for t in targets]
    
    await col_model_scores().insert_many(score_docs)

    settings = get_settings()
    # Offload to background
    asyncio.create_task(dispatch_twilio_messages(campaign_id, crop, settings))
    
    logger.info("🚀 Autonomous Campaign Dispatched", id=campaign_id)
