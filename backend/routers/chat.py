"""
Chat Router — Grounded Q&A Interface
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag_service import generate_grounded_answer

router = APIRouter()


class ChatRequest(BaseModel):
    phone_number: str
    message: str


class ChatResponse(BaseModel):
    response: str


@router.post("", response_model=ChatResponse)
async def chat_message(req: ChatRequest):
    if not req.phone_number:
        raise HTTPException(status_code=400, detail="Phone number is required for grounding context.")
    if not req.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    try:
        response_text = await generate_grounded_answer(req.phone_number, req.message)
        return ChatResponse(response=response_text)
    except Exception as e:
        import logging
        logging.getLogger("chat").error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the chat message.")
