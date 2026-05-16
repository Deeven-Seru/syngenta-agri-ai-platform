"""
Twilio Voice Router — Inbound AI IVR
"""
from fastapi import APIRouter, Request, Response
from twilio.twiml.voice_response import VoiceResponse, Gather
from services.rag_service import generate_grounded_answer
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.post("/incoming")
async def handle_voice_incoming(request: Request):
    """
    Initial greeting and start gathering speech.
    """
    response = VoiceResponse()
    
    # Welcome message
    gather = Gather(input='speech', action='/api/voice/process', timeout=5, language='hi-IN')
    gather.say("नमस्ते, सिनजेंटा एग्री-एआई हेल्पलाइन में आपका स्वागत है। मैं आपकी कैसे मदद कर सकता हूँ?", language='hi-IN')
    
    response.append(gather)
    
    # Fallback if no input
    response.say("क्षमा करें, मुझे आपकी आवाज़ नहीं सुनाई दी। कृपया फिर से कॉल करें।", language='hi-IN')
    
    return Response(content=str(response), media_type="application/xml")

@router.post("/process")
async def handle_voice_process(request: Request):
    """
    Process transcribed speech from Twilio.
    """
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult")
    caller_phone = form_data.get("From")
    
    response = VoiceResponse()
    
    if not speech_result:
        response.say("क्षमा करें, मैं समझ नहीं पाया।", language='hi-IN')
        response.redirect('/api/voice/incoming')
        return Response(content=str(response), media_type="application/xml")
    
    logger.info("Voice query received", phone=caller_phone, query=speech_result)
    
    # Generate grounded answer via RAG + Groq
    answer = await generate_grounded_answer(caller_phone, speech_result)
    
    # Speak answer
    response.say(answer, language='hi-IN')
    
    # Allow follow-up
    gather = Gather(input='speech', action='/api/voice/process', timeout=5, language='hi-IN')
    gather.say("क्या आप कुछ और पूछना चाहते हैं?", language='hi-IN')
    response.append(gather)
    
    return Response(content=str(response), media_type="application/xml")
