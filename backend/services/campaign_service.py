"""
Campaign Dispatch Service — Twilio Messaging & IVR
- Handles bulk dispatch of messages to growers.
- Uses concurrency limiting to respect Twilio rate limits.
- Generates hyper-local vernacular content on-the-fly.
"""
import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, List
import structlog
from twilio.rest import Client
from database import col_growers, col_campaigns, col_model_scores, col_autonomous_campaigns
from services.content_generator import generate_whatsapp_message, generate_voice_script
from services.weather_service import get_district_weather
from config import get_settings

logger = structlog.get_logger()
settings = get_settings()

# Active WebSocket subscriber queues mapped by campaign_id
dispatch_subscribers: Dict[str, List[asyncio.Queue]] = {}

# Active Redis subscription listener tasks
redis_listeners: Dict[str, asyncio.Task] = {}
redis_available = False
redis_client = None

if settings.redis_url:
    try:
        import redis.asyncio as aioredis
        redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
        redis_available = True
        logger.info("Redis Pub/Sub configured successfully for WebSockets.")
    except Exception as e:
        logger.warning("Failed to initialize Redis client. Falling back to in-memory Pub/Sub", error=str(e))


async def listen_redis_channel(campaign_id: str):
    """Listens to campaign event broadcasts from Redis and distributes to local clients."""
    if not redis_client:
        return
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(f"campaign:{campaign_id}")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    if campaign_id in dispatch_subscribers:
                        for queue in list(dispatch_subscribers[campaign_id]):
                            await queue.put(data)
                except Exception as ex:
                    logger.error("Error decoding or forwarding Redis pub/sub message", error=str(ex))
    except asyncio.CancelledError:
        pass
    except Exception as ex:
        logger.error("Unexpected error in Redis pub/sub listener", error=str(ex))
    finally:
        await pubsub.unsubscribe(f"campaign:{campaign_id}")
        await pubsub.close()


def subscribe_dispatch(campaign_id: str) -> asyncio.Queue:
    queue = asyncio.Queue()
    if campaign_id not in dispatch_subscribers:
        dispatch_subscribers[campaign_id] = []
    dispatch_subscribers[campaign_id].append(queue)
    
    # Start Redis listener task if not already listening
    if redis_available and campaign_id not in redis_listeners:
        task = asyncio.create_task(listen_redis_channel(campaign_id))
        redis_listeners[campaign_id] = task
        
    logger.info("New WebSocket subscriber registered for campaign", campaign_id=campaign_id)
    return queue


def unsubscribe_dispatch(campaign_id: str, queue: asyncio.Queue):
    if campaign_id in dispatch_subscribers:
        if queue in dispatch_subscribers[campaign_id]:
            dispatch_subscribers[campaign_id].remove(queue)
        if not dispatch_subscribers[campaign_id]:
            del dispatch_subscribers[campaign_id]
            # Cancel Redis listener if we have no local subscribers
            if campaign_id in redis_listeners:
                redis_listeners[campaign_id].cancel()
                del redis_listeners[campaign_id]
                
    logger.info("WebSocket subscriber unregistered for campaign", campaign_id=campaign_id)


async def broadcast_dispatch_event(campaign_id: str, event: dict):
    if redis_available and redis_client:
        try:
            await redis_client.publish(f"campaign:{campaign_id}", json.dumps(event))
        except Exception as e:
            logger.error("Failed to publish event to Redis", error=str(e))
    else:
        # Fallback to local in-memory pub/sub
        if campaign_id in dispatch_subscribers:
            for queue in list(dispatch_subscribers[campaign_id]):
                await queue.put(event)


# Global Semaphores to limit Twilio request concurrency across all campaign instances
_global_twilio_semaphore = None
_global_simulation_semaphore = None

def get_twilio_semaphore(is_simulation: bool) -> asyncio.Semaphore:
    global _global_twilio_semaphore, _global_simulation_semaphore
    if is_simulation:
        if _global_simulation_semaphore is None:
            _global_simulation_semaphore = asyncio.Semaphore(2)
        return _global_simulation_semaphore
    else:
        if _global_twilio_semaphore is None:
            _global_twilio_semaphore = asyncio.Semaphore(10)
        return _global_twilio_semaphore


async def dispatch_twilio_messages(campaign_id: str, campaign_crop: str, settings):
    """Background task to send Twilio messages without blocking the API."""
    is_simulation = not settings.twilio_account_sid or not settings.twilio_auth_token
    
    if is_simulation:
        logger.info("Twilio credentials not set. Launching campaign in SIMULATION mode.", campaign_id=campaign_id)
        twilio_client = None
    else:
        twilio_client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    
    # Get campaign details for product name
    campaign = await col_campaigns().find_one({"_id": campaign_id})
    if not campaign:
        logger.error("Campaign not found for dispatch", campaign_id=campaign_id)
        return
    product = campaign.get("product", "Syngenta Solution")
    
    # Concurrency limit to prevent overwhelming thread pool and hitting Twilio rate limits
    semaphore = get_twilio_semaphore(is_simulation)
    
    sent_count = 0
    errors = 0

    # Cache for generated messages to avoid redundant Gemini calls
    message_cache = {}
    
    # Pre-fetch weather for all districts in the campaign to avoid redundant API calls
    weather_cache = {}
    unique_districts = await col_model_scores().distinct("district", {"campaign_id": campaign_id})
    if unique_districts:
        from services.weather_service import get_bulk_district_weather
        weather_cache = await get_bulk_district_weather(unique_districts)

    # Get total targets count for logging and websocket percentage tracking
    total_targets = await col_model_scores().count_documents({"campaign_id": campaign_id})
    await broadcast_dispatch_event(campaign_id, {
        "type": "start",
        "campaign_id": campaign_id,
        "total": total_targets
    })

    # Stream targets to avoid memory limits, sorted by receptivity_score
    cursor = col_model_scores().find({"campaign_id": campaign_id}).sort([("receptivity_score", -1)])
    
    async def send_one(target, grower_map):
        nonlocal sent_count, errors
        async with semaphore:
            grower_id = target.get("grower_id")
            g_doc = grower_map.get(grower_id)
            
            # For testing/demo, if we don't have a phone field, fallback to the grower_id itself
            phone = (g_doc.get("phone") or g_doc.get("_id") or grower_id) if g_doc else grower_id
            
            if not phone:
                return

            device = target.get("device_type", "smartphone")
            lang = (g_doc.get("language") or target.get("language") or "Hindi") if g_doc else "Hindi"
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
                    # Use pre-fetched weather
                    weather = weather_cache.get(district, {})
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
                if is_simulation:
                    # SIMULATION MODE: artificial delay
                    await asyncio.sleep(0.3)
                    sent_count += 1
                    status = "success"
                    log_msg = f"[SIMULATION] Message successfully sent to {phone} ({lang}, {device})"
                else:
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
                    status = "success"
                    log_msg = f"Message sent to {phone} via {'WhatsApp' if device == 'smartphone' else 'Voice Call'}"
            except Exception as e:
                logger.error("Twilio dispatch failed", error=str(e), grower_id=grower_id)
                errors += 1
                status = "error"
                log_msg = f"Failed sending to {phone}: {str(e)}"
            
            # Broadcast progress update to websocket subscribers
            await broadcast_dispatch_event(campaign_id, {
                "type": "progress",
                "campaign_id": campaign_id,
                "sent": sent_count,
                "errors": errors,
                "total": total_targets,
                "phone": phone,
                "grower_id": grower_id,
                "status": status,
                "log": log_msg
            })

    # Process targets in batches of 100 to balance speed and memory
    batch = []
    async for target in cursor:
        batch.append(target)
        if len(batch) >= 100:
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

    # Final updates with ISO string timestamps
    now = datetime.now(timezone.utc).isoformat()
    status_update = {
        "status": "launched", 
        "launched_at": now,
        "sent_count": sent_count,
        "error_count": errors
    }
    
    await col_campaigns().update_one({"_id": campaign_id}, {"$set": status_update})
    
    # Sync update for autonomous tracker if applicable
    if campaign.get("is_autonomous"):
        await col_autonomous_campaigns().update_one({"_id": campaign_id}, {"$set": status_update})

    # Broadcast completed status to websocket subscribers
    await broadcast_dispatch_event(campaign_id, {
        "type": "complete",
        "campaign_id": campaign_id,
        "sent": sent_count,
        "errors": errors,
        "total": total_targets
    })

