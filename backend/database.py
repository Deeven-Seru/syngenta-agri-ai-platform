"""
MongoDB Atlas — async connection and collection accessors
"""
import motor.motor_asyncio
import certifi
from config import get_settings
from typing import Optional

_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None


async def connect_db():
    global _client
    settings = get_settings()
    _client = motor.motor_asyncio.AsyncIOMotorClient(
        settings.mongodb_uri,
        tlsCAFile=certifi.where(),
    )
    # Ping to verify
    await _client.admin.command("ping")
    print("✅ MongoDB Atlas connected")


async def close_db():
    global _client
    if _client:
        _client.close()
        print("MongoDB connection closed")


def get_db():
    settings = get_settings()
    return _client[settings.mongodb_db_name]


# Collection accessors
def col_growers():
    return get_db()["growers"]

def col_retailers():
    return get_db()["retailers"]

def col_retailer_pos():
    return get_db()["retailer_pos"]

def col_inventory():
    return get_db()["retailer_inventory"]

def col_visit_log():
    return get_db()["visit_log"]

def col_reps():
    return get_db()["reps_territory"]

def col_campaigns():
    return get_db()["campaigns"]

def col_whatsapp_log():
    return get_db()["whatsapp_log"]

def col_funnel():
    return get_db()["digital_funnel"]

def col_model_scores():
    return get_db()["model_scores"]

def col_knowledge_vectors():
    return get_db()["knowledge_vectors"]
