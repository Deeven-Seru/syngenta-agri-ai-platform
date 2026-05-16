"""
Twilio WhatsApp Router — Inbound AI Chat
"""
from fastapi import APIRouter, Request, Response
from twilio.twiml.messaging_response import MessagingResponse
from services.rag_service import generate_grounded_answer
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.post("/incoming")
async def handle_whatsapp_incoming(request: Request):
    """
    Handle inbound WhatsApp messages from farmers.
    """
    form_data = await request.form()
    incoming_msg = form_data.get("Body")
    sender_phone = form_data.get("From") # e.g. "whatsapp:+919876543210"
    
    # Strip "whatsapp:" prefix if present for database lookup
    clean_phone = sender_phone.replace("whatsapp:", "")
    
    logger.info("WhatsApp message received", phone=clean_phone, msg=incoming_msg)
    
    # Generate grounded answer via RAG + Groq
    answer = await generate_grounded_answer(clean_phone, incoming_msg)
    
    # Create Twilio XML response
    response = MessagingResponse()
    response.message(answer)
    
    return Response(content=str(response), media_type="application/xml")
