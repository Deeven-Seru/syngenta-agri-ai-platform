"""
Campaign Dispatch Service — Twilio Messaging & IVR
- Handles bulk dispatch of messages to growers.
- Uses concurrency limiting to respect Twilio rate limits.
- Generates hyper-local vernacular content on-the-fly.
"""
import asyncio
from datetime import datetime, timezone
import structlog
from database import col_growers, col_campaigns, col_model_scores, col_autonomous_campaigns
from services.content_generator import generate_whatsapp_message, generate_voice_script
from services.weather_service import get_district_weather

logger = structlog.get_logger()

async def dispatch_twilio_messages(campaign_id: str, campaign_crop: str, settings):
    """Background task to send Twilio messages without blocking the API."""
    from twilio.rest import Client
    twilio_client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    
    # Get campaign details for product name
    campaign = await col_campaigns().find_one({"_id": campaign_id})
    if not campaign:
        logger.error("Campaign not found for dispatch", campaign_id=campaign_id)
        return
    product = campaign.get("product", "Syngenta Solution")
    
    # Concurrency limit to prevent overwhelming thread pool and hitting Twilio rate limits
    semaphore = asyncio.Semaphore(10)
    
    sent_count = 0
    errors = 0

    # Cache for generated messages to avoid redundant Gemini calls
    # Key: (language, device, district)
    message_cache = {}

    # Stream targets to avoid memory limits, sorted by receptivity_score
    cursor = col_model_scores().find({"campaign_id": campaign_id}).sort([("receptivity_score", -1)])
    
    async def send_one(target, grower_map):
        nonlocal sent_count, errors
        async with semaphore:
            grower_id = target.get("grower_id")
            g_doc = grower_map.get(grower_id)
            if not g_doc or not g_doc.get("phone"):
                return

            phone = g_doc["phone"]
            device = target.get("device_type", "smartphone")
            lang = g_doc.get("language", "Hindi")
            district = target.get("district", "Unknown")
            
            # Map DB language to Twilio voice code
            voice_lang_map = {
                "Hindi": "hi-IN",
                "Marathi": "mr-IN",
                "Punjabi": "pa-IN",
                "Gujarati": "gu-IN",
                "Kannada": "kn-IN",
                "Bengali": "bn-IN",
                "Telugu": "te-IN",
                "Tamil": "ta-IN"
            }
            voice_lang = voice_lang_map.get(lang, "hi-IN")
            
            # Check cache or generate message
            cache_key = (lang, device, district)
            msg_text = target.get("message_native")
            
            if not msg_text:
                if cache_key in message_cache:
                    msg_text = message_cache[cache_key]
                else:
                    # Generate on-the-fly
                    weather = await get_district_weather(district)
                    weather_ctx = weather.get("weather_context", "")
                    
                    if device == "smartphone":
                        gen = await generate_whatsapp_message(
                            grower_language=lang,
                            crop=campaign_crop,
                            product=product,
                            weather_context=weather_ctx
                        )
                        msg_text = gen.get("message_native")
                    else:
                        msg_text = await generate_voice_script(
                            grower_language=lang,
                            crop=campaign_crop,
                            product=product,
                            weather_context=weather_ctx
                        )
                    
                    if msg_text:
                        message_cache[cache_key] = msg_text

            if not msg_text:
                msg_text = f"Greetings from Syngenta. Check your {campaign_crop} crop."

            try:
                if device == "smartphone":
                    await asyncio.to_thread(
                        twilio_client.messages.create,
                        from_=settings.twilio_whatsapp_from,
                        body=msg_text,
                        to=f"whatsapp:{phone}"
                    )
                else:
                    await asyncio.to_thread(
                        twilio_client.calls.create,
                        from_=settings.twilio_phone_number,
                        to=phone,
                        twiml=f'<Response><Say language="{voice_lang}">{msg_text}</Say></Response>'
                    )
                sent_count += 1
            except Exception as e:
                logger.error("Twilio dispatch failed", error=str(e), grower_id=grower_id)
                errors += 1

    # Process targets in batches of 100 to balance speed and memory
    batch = []
    async for target in cursor:
        batch.append(target)
        if len(batch) >= 100:
            # Bulk fetch growers for this batch (filtering None)
            batch_grower_ids = list(set(t.get("grower_id") for t in batch if t.get("grower_id")))
            growers = await col_growers().find({"_id": {"$in": batch_grower_ids}}).to_list(length=len(batch_grower_ids))
            batch_grower_map = {g["_id"]: g for g in growers}
            
            await asyncio.gather(*(send_one(t, batch_grower_map) for t in batch))
            batch = []
    
    if batch:
        batch_grower_ids = list(set(t.get("grower_id") for t in batch if t.get("grower_id")))
        growers = await col_growers().find({"_id": {"$in": batch_grower_ids}}).to_list(length=len(batch_grower_ids))
        batch_grower_map = {g["_id"]: g for g in growers}
        await asyncio.gather(*(send_one(t, batch_grower_map) for t in batch))

    # Final updates with Native Datetime
    now = datetime.now(timezone.utc).isoformat()
    status_update = {
        "status": "launched", 
        "launched_at": now,
        "sent_count": sent_count,
        "error_count": errors
    }
    
    await col_campaigns().update_one({"_id": campaign_id}, {"$set": status_update})
    
    # Sync update for autonomous tracker if applicable
    if campaign and campaign.get("is_autonomous"):
        await col_autonomous_campaigns().update_one({"_id": campaign_id}, {"$set": status_update})
