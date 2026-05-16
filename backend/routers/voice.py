"""
Twilio Voice Router — Inbound AI IVR
"""
from fastapi import APIRouter, Request, Response, HTTPException
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.request_validator import RequestValidator
from services.rag_service import generate_grounded_answer
from database import col_growers
from config import get_settings
import structlog

logger = structlog.get_logger()
router = APIRouter()

async def validate_twilio_request(request: Request):
    settings = get_settings()
    validator = RequestValidator(settings.twilio_auth_token)
    
    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    
    # In production/cloud run, request.url might be http but Twilio sees https
    if settings.environment == "production":
        url = url.replace("http://", "https://")
        
    form_data = await request.form()
    
    if not validator.validate(url, form_data, signature):
        logger.error("Invalid Twilio signature", url=url)
        if settings.environment == "production":
            raise HTTPException(status_code=403, detail="Invalid signature")

@router.post("/incoming")
async def handle_voice_incoming(request: Request):
    """
    Initial greeting and start gathering speech.
    """
    await validate_twilio_request(request)
    form_data = await request.form()
    caller_phone = form_data.get("From", "").replace("+", "")
    
    # Determine language from grower profile
    grower = await col_growers().find_one({"_id": caller_phone}) or await col_growers().find_one({"phone": caller_phone})
    lang = grower.get("language", "Hindi") if grower else "Hindi"
    
    # Map to Twilio codes
    gather_lang = "hi-IN" if lang == "Hindi" else "mr-IN" if lang == "Marathi" else "en-IN"
    
    response = VoiceResponse()
    
    # Localized greetings
    greetings = {
        "Hindi": "नमस्ते, सिनजेंटा एग्री-एआई हेल्पलाइन में आपका स्वागत है। मैं आपकी कैसे मदद कर सकता हूँ?",
        "Marathi": "नमस्कार, सिनजेंटा एग्री-एआय हेल्पलाइनवर आपले स्वागत आहे. मी तुम्हाला कशी मदत करू शकतो?",
        "English": "Hello, welcome to the Syngenta Agri-AI helpline. How can I help you today?"
    }
    
    msg = greetings.get(lang, greetings["Hindi"])
    
    gather = Gather(input='speech', action='/api/voice/process', timeout=5, language=gather_lang)
    gather.say(msg, language=gather_lang)
    response.append(gather)
    
    # Fallback
    fallback_msg = "I didn't hear anything. Please call back." if lang == "English" else "क्षमा करें, मुझे आपकी आवाज़ नहीं सुनाई दी।"
    response.say(fallback_msg, language=gather_lang)
    
    return Response(content=str(response), media_type="application/xml")

@router.post("/process")
async def handle_voice_process(request: Request):
    """
    Process transcribed speech from Twilio.
    """
    await validate_twilio_request(request)
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult")
    caller_phone = form_data.get("From")
    
    # Get grower language for TTS
    clean_phone = caller_phone.replace("+", "")
    grower = await col_growers().find_one({"_id": clean_phone}) or await col_growers().find_one({"phone": clean_phone})
    lang = grower.get("language", "Hindi") if grower else "Hindi"
    voice_lang = "hi-IN" if lang == "Hindi" else "mr-IN" if lang == "Marathi" else "en-IN"
    
    response = VoiceResponse()
    
    if not speech_result:
        error_msg = "Sorry, I didn't understand that." if lang == "English" else "क्षमा करें, मैं समझ नहीं पाया।"
        response.say(error_msg, language=voice_lang)
        response.redirect('/api/voice/incoming')
        return Response(content=str(response), media_type="application/xml")
    
    logger.info("Voice query received", phone=caller_phone, query=speech_result)
    
    # Generate grounded answer via RAG + Groq
    answer = await generate_grounded_answer(caller_phone, speech_result)
    
    # Speak answer
    response.say(answer, language=voice_lang)
    
    # Allow follow-up
    followup_msg = "Do you have any more questions?" if lang == "English" else "क्या आप कुछ और पूछना चाहते हैं?"
    gather = Gather(input='speech', action='/api/voice/process', timeout=5, language=voice_lang)
    gather.say(followup_msg, language=voice_lang)
    response.append(gather)
    
    return Response(content=str(response), media_type="application/xml")
