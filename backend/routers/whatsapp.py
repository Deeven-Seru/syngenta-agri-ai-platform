"""
Twilio WhatsApp Router — Inbound AI Chat
"""
from fastapi import APIRouter, Request, Response, HTTPException
from twilio.twiml.messaging_response import MessagingResponse
from twilio.request_validator import RequestValidator
from services.rag_service import generate_grounded_answer
from config import get_settings
import structlog

logger = structlog.get_logger()
router = APIRouter()

async def validate_twilio_request(request: Request):
    settings = get_settings()
    validator = RequestValidator(settings.twilio_auth_token)
    
    signature = request.headers.get("X-Twilio-Signature", "")
    
    # Reconstruct the public URL as seen by Twilio
    host = request.headers.get("host", "localhost")
    proto = request.headers.get("x-forwarded-proto", "https")
    path = request.url.path
    query = f"?{request.url.query}" if request.url.query else ""
    
    # In production, ensure we use https and strip internal ports from host if present
    if settings.environment == "production":
        host = host.split(":")[0]
        url = f"https://{host}{path}{query}"
    else:
        url = f"{proto}://{host}{path}{query}"
        
    form_data = await request.form()
    
    if not validator.validate(url, form_data, signature):
        logger.error("Invalid Twilio signature", url=url, host=host, proto=proto)
        if settings.environment == "production":
            raise HTTPException(status_code=403, detail="Invalid signature")

@router.post("/incoming")
async def handle_whatsapp_incoming(request: Request):
    """
    Handle inbound WhatsApp messages from farmers.
    """
    await validate_twilio_request(request)
    form_data = await request.form()
    
    incoming_msg = form_data.get("Body")
    sender_phone = form_data.get("From", "")
    
    if not incoming_msg or not sender_phone:
        logger.warning("Empty WhatsApp payload received")
        return Response(content="", status_code=204)
    
    # Strip "whatsapp:" prefix if present for database lookup
    clean_phone = sender_phone.replace("whatsapp:", "")
    
    logger.info("WhatsApp message received", phone=clean_phone, msg=incoming_msg)
    
    # Generate grounded answer via RAG + Groq
    answer = await generate_grounded_answer(sender_phone, incoming_msg)
    
    # Create Twilio XML response
    response = MessagingResponse()
    response.message(answer)
    
    return Response(content=str(response), media_type="application/xml")
