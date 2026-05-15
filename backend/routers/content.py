"""Content Generation Router"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.content_generator import generate_whatsapp_message

router = APIRouter()


class ContentRequest(BaseModel):
    language: str
    crop: str
    product: str
    crop_stage: Optional[str] = None
    weather_context: Optional[str] = None


@router.post("/generate")
async def generate_content(req: ContentRequest):
    """Generate a personalized WhatsApp message for a given farmer profile."""
    msg = await generate_whatsapp_message(
        grower_language=req.language,
        crop=req.crop,
        product=req.product,
        crop_stage=req.crop_stage,
        weather_context=req.weather_context,
    )
    return msg
