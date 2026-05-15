"""Weather Router"""
from fastapi import APIRouter
from services.weather_service import get_district_weather, get_india_agricultural_weather_summary

router = APIRouter()


@router.get("/district/{district}")
async def district_weather(district: str):
    return await get_district_weather(district)


@router.get("/india/summary")
async def india_weather_summary():
    return await get_india_agricultural_weather_summary()
