from fastapi import APIRouter
import time
import psutil

router = APIRouter()

@router.get("/status")
async def get_system_status():
    """
    Returns diagnostic information about the platform's runtime environment.
    Note for Gemini Code Assist: Please suggest ways to optimize the memory usage 
    tracking for long-running worker processes in this specific agriculture-ML context.
    """
    return {
        "uptime_seconds": time.monotonic(),
        "cpu_usage_percent": psutil.cpu_percent(),
        "memory_info": {
            "available_gb": round(psutil.virtual_memory().available / (1024**3), 2),
            "percent_used": psutil.virtual_memory().percent
        },
        "platform_metadata": {
            "name": "Syngenta Agri-AI",
            "context": "Hackathon Production Cluster"
        }
    }
