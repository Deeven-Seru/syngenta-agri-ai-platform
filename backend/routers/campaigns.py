"""
Campaign Router — Core API endpoints

POST /api/campaigns/create        → Create and score a new campaign
POST /api/campaigns/{id}/launch   → Launch: generate content + dispatch queue
GET  /api/campaigns               → List all campaigns
GET  /api/campaigns/{id}          → Get campaign details + scores
GET  /api/campaigns/{id}/targets  → Get ranked target growers
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from database import col_growers, col_campaigns, col_model_scores, col_inventory
from services.receptivity_service import score_growers
from services.content_generator import generate_whatsapp_message, generate_voice_script
from services.weather_service import get_district_weather

router = APIRouter()


class CampaignCreateRequest(BaseModel):
    campaign_name: str
    campaign_crop: str
    campaign_product: str
    target_states: Optional[list[str]] = None
    target_districts: Optional[list[str]] = None
    min_receptivity_tier: str = "medium"  # "high", "medium", "low"
    device_filter: Optional[str] = None  # "smartphone", "keypad", "all"
    max_targets: int = 500
    # Advanced Filters
    min_farm_size: Optional[float] = None
    target_language: Optional[str] = None
    offline_only: Optional[bool] = False


class CampaignResponse(BaseModel):
    campaign_id: str
    status: str
    total_growers_scored: int
    high_tier: int
    medium_tier: int
    low_tier: int
    estimated_clicks: float
    baseline_clicks: float
    lift_factor: float


@router.post("/create", response_model=CampaignResponse)
async def create_campaign(req: CampaignCreateRequest, background_tasks: BackgroundTasks):
    """
    1. Filter growers by crop, state, device
    2. Score all of them with XGBoost model
    3. Store scores in MongoDB
    4. Return campaign summary with predicted lift
    """
    # Build query filter
    query = {}
    if req.campaign_crop:
        query["primary_crop"] = req.campaign_crop
    if req.target_states:
        query["state"] = {"$in": req.target_states}
    if req.target_districts:
        query["district"] = {"$in": req.target_districts}
    if req.device_filter and req.device_filter != "all":
        query["device_type"] = req.device_filter
    
    # Advanced Filter logic
    if req.min_farm_size is not None:
        query["farm_size_acres"] = {"$gte": req.min_farm_size}
    if req.target_language:
        query["language"] = req.target_language
    if req.offline_only:
        query["offline_campaign_attended"] = False

    # Fetch matching growers
    grower_cursor = col_growers().find(query).limit(req.max_targets * 3)
    growers = await grower_cursor.to_list(length=req.max_targets * 3)

    if not growers:
        raise HTTPException(status_code=404, detail="No growers found for given filters")

    # Score growers
    scored = score_growers(growers, req.campaign_product, req.campaign_crop)

    # Filter by tier
    tier_order = {"high": 3, "medium": 2, "low": 1}
    min_tier_val = tier_order.get(req.min_receptivity_tier, 2)
    filtered = [
        g for g in scored
        if tier_order.get(g.get("receptivity_tier", "low"), 1) >= min_tier_val
    ][:req.max_targets]

    # Campaign ID
    campaign_id = f"CMP_{datetime.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:8].upper()}"

    # Tier counts
    high = sum(1 for g in filtered if g["receptivity_tier"] == "high")
    medium = sum(1 for g in filtered if g["receptivity_tier"] == "medium")
    low = sum(1 for g in filtered if g["receptivity_tier"] == "low")

    # Estimated clicks
    estimated_clicks = sum(g["receptivity_score"] for g in filtered)
    baseline_clicks = len(filtered) * 0.05
    lift = estimated_clicks / baseline_clicks if baseline_clicks > 0 else 1.0

    # Store campaign in MongoDB
    campaign_doc = {
        "_id": campaign_id,
        "name": req.campaign_name,
        "crop": req.campaign_crop,
        "product": req.campaign_product,
        "status": "scored",
        "created_at": datetime.utcnow().isoformat(),
        "total_targets": len(filtered),
        "high_tier": high,
        "medium_tier": medium,
        "low_tier": low,
        "estimated_clicks": round(estimated_clicks, 1),
        "baseline_clicks": round(baseline_clicks, 1),
        "lift_factor": round(lift, 2),
        "filters": req.dict(),
    }
    await col_campaigns().insert_one(campaign_doc)

    # Store scores
    if filtered:
        score_docs = [{
            "campaign_id": campaign_id,
            "grower_id": g.get("_id") or g.get("grower_id"),
            "receptivity_score": g["receptivity_score"],
            "receptivity_tier": g["receptivity_tier"],
            "rank": g["rank"],
            "device_type": g.get("device_type"),
            "language": g.get("language"),
            "district": g.get("district"),
            "state": g.get("state"),
        } for g in filtered]
        await col_model_scores().insert_many(score_docs)

    return CampaignResponse(
        campaign_id=campaign_id,
        status="scored",
        total_growers_scored=len(filtered),
        high_tier=high,
        medium_tier=medium,
        low_tier=low,
        estimated_clicks=round(estimated_clicks, 1),
        baseline_clicks=round(baseline_clicks, 1),
        lift_factor=round(lift, 2),
    )


@router.get("/{campaign_id}/targets")
async def get_campaign_targets(campaign_id: str, limit: int = 50):
    """Get the top scored growers for a campaign."""
    cursor = col_model_scores().find(
        {"campaign_id": campaign_id},
        sort=[("receptivity_score", -1)],
        limit=limit,
    )
    targets = await cursor.to_list(length=limit)

    # Strip MongoDB _id for JSON
    for t in targets:
        t.pop("_id", None)

    return {"campaign_id": campaign_id, "targets": targets, "count": len(targets)}


@router.post("/{campaign_id}/generate-content")
async def generate_campaign_content(campaign_id: str, sample_size: int = 10):
    """
    Generate personalized messages for top N targets.
    Returns sample messages across all languages in the target list.
    """
    # Get top targets
    cursor = col_model_scores().find(
        {"campaign_id": campaign_id},
        sort=[("receptivity_score", -1)],
        limit=sample_size,
    )
    targets = await cursor.to_list(length=sample_size)

    if not targets:
        raise HTTPException(status_code=404, detail="Campaign not found or no targets")

    # Get campaign details
    campaign = await col_campaigns().find_one({"_id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Generate messages (deduplicated by language + device)
    messages = []
    seen_keys = set()

    for target in targets:
        lang = target.get("language", "Hindi")
        device = target.get("device_type", "smartphone")
        key = f"{lang}:{device}"
        
        if key in seen_keys:
            continue
        seen_keys.add(key)

        # Get weather for district
        district = target.get("district", "Delhi")
        weather = await get_district_weather(district)
        weather_ctx = weather.get("weather_context", "")

        # Look up actual device from DB if not in target
        device = target.get("device_type")
        if not device:
            g_doc = await col_growers().find_one({"_id": target.get("grower_id")})
            device = g_doc.get("device_type", "smartphone") if g_doc else "smartphone"
            
        if device == "smartphone":
            msg = await generate_whatsapp_message(
                grower_language=lang,
                crop=campaign["crop"],
                product=campaign["product"],
                weather_context=weather_ctx,
            )
            messages.append({
                "channel": "whatsapp",
                "language": lang,
                "sample_grower_id": target.get("grower_id"),
                "district": district,
                **msg,
            })
        else:
            script = await generate_voice_script(
                grower_language=lang,
                crop=campaign["crop"],
                product=campaign["product"],
                weather_context=weather_ctx,
            )
            messages.append({
                "channel": "voice",
                "language": lang,
                "sample_grower_id": target.get("grower_id"),
                "district": district,
                "message_native": script,
                "message_english": "Voice call script generated",
                "character_count": len(script),
            })

    return {
        "campaign_id": campaign_id,
        "messages_generated": len(messages),
        "languages_covered": list(set([m["language"] for m in messages])),
        "messages": messages,
    }


@router.get("")
async def list_campaigns(limit: int = 20):
    """List all campaigns."""
    cursor = col_campaigns().find({}, sort=[("created_at", -1)], limit=limit)
    campaigns = await cursor.to_list(length=limit)
    for c in campaigns:
        c["id"] = c.pop("_id")
    return {"campaigns": campaigns, "count": len(campaigns)}


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign details."""
    campaign = await col_campaigns().find_one({"_id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign["id"] = campaign.pop("_id")
    return campaign


@router.post("/{campaign_id}/launch")
async def launch_campaign(campaign_id: str):
    """
    Launch: actually dispatch the queue via Twilio.
    """
    from twilio.rest import Client
    from config import get_settings
    settings = get_settings()
    
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise HTTPException(status_code=500, detail="Twilio credentials not configured")
        
    twilio_client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    
    campaign = await col_campaigns().find_one({"_id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get scored targets
    targets = await col_model_scores().find({"campaign_id": campaign_id}).to_list(length=100)
    
    # We also need grower phone numbers which might be in the growers collection
    # but for demo we check if grower_id is a phone or look it up
    
    sent_count = 0
    errors = 0

    for target in targets:
        grower_id = target.get("grower_id")
        g_doc = await col_growers().find_one({"_id": grower_id})
        phone = g_doc.get("phone") if g_doc else None
        
        if not phone:
            # Skip if no phone
            continue

        device = target.get("device_type", "smartphone")
        # Ensure we have content (this usually would be pre-generated or generated here)
        # For simplicity we generate a quick one if missing
        msg_text = target.get("message_native") 
        if not msg_text:
            msg_text = f"Greetings from Syngenta. Check your {campaign['crop']} crop."

        try:
            if device == "smartphone":
                # Send WhatsApp
                twilio_client.messages.create(
                    from_=settings.twilio_whatsapp_from,
                    body=msg_text,
                    to=f"whatsapp:{phone}"
                )
            else:
                # Initiate automated call
                twilio_client.calls.create(
                    from_=settings.twilio_phone_number,
                    to=phone,
                    twiml=f'<Response><Say language="hi-IN">{msg_text}</Say></Response>'
                )
            sent_count += 1
        except Exception as e:
            errors += 1

    await col_campaigns().update_one(
        {"_id": campaign_id},
        {"$set": {
            "status": "launched", 
            "launched_at": datetime.utcnow().isoformat(),
            "sent_count": sent_count,
            "error_count": errors
        }}
    )

    return {
        "campaign_id": campaign_id,
        "status": "launched",
        "sent_successfully": sent_count,
        "failed": errors
    }
