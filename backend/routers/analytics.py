"""Analytics Router — Dashboard metrics and insights"""
from fastapi import APIRouter
from database import (
    col_growers, col_whatsapp_log, col_funnel,
    col_retailer_pos, col_inventory, col_campaigns
)

router = APIRouter()


@router.get("/overview")
async def get_overview():
    """Platform KPIs for the main dashboard."""
    # Grower counts
    total_growers = await col_growers().count_documents({})
    smartphone_growers = await col_growers().count_documents({"device_type": "smartphone"})

    # WhatsApp engagement
    total_messages = await col_whatsapp_log().count_documents({})
    opened = await col_whatsapp_log().count_documents({"opened": True})
    clicked = await col_whatsapp_log().count_documents({"clicked": True})

    # Campaign count
    total_campaigns = await col_campaigns().count_documents({})

    # Language breakdown
    lang_pipeline = [
        {"$group": {"_id": "$language", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    lang_results = await col_growers().aggregate(lang_pipeline).to_list(length=20)

    # State breakdown
    state_pipeline = [
        {"$group": {"_id": "$state", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    state_results = await col_growers().aggregate(state_pipeline).to_list(length=20)

    return {
        "growers": {
            "total": total_growers,
            "smartphone": smartphone_growers,
            "smartphone_pct": round(100 * smartphone_growers / total_growers, 1) if total_growers else 0,
        },
        "whatsapp": {
            "total_messages": total_messages,
            "open_rate": round(100 * opened / total_messages, 1) if total_messages else 0,
            "click_rate": round(100 * clicked / total_messages, 1) if total_messages else 0,
        },
        "campaigns": {"total": total_campaigns},
        "language_breakdown": [{"language": r["_id"], "count": r["count"]} for r in lang_results],
        "state_breakdown": [{"state": r["_id"], "count": r["count"]} for r in state_results],
    }


@router.get("/engagement-by-crop")
async def engagement_by_crop():
    """WhatsApp open + click rates segmented by crop."""
    pipeline = [
        {
            "$group": {
                "_id": "$campaign_crop",
                "total": {"$sum": 1},
                "opened": {"$sum": {"$cond": ["$opened", 1, 0]}},
                "clicked": {"$sum": {"$cond": ["$clicked", 1, 0]}},
            }
        },
        {"$sort": {"total": -1}},
    ]
    results = await col_whatsapp_log().aggregate(pipeline).to_list(length=20)
    return {
        "data": [
            {
                "crop": r["_id"],
                "total": r["total"],
                "open_rate": round(100 * r["opened"] / r["total"], 1) if r["total"] else 0,
                "click_rate": round(100 * r["clicked"] / r["total"], 1) if r["total"] else 0,
            }
            for r in results
        ]
    }


@router.get("/engagement-by-language")
async def engagement_by_language():
    """WhatsApp engagement rates by grower language."""
    # Join whatsapp_log with growers to get language
    pipeline = [
        {
            "$lookup": {
                "from": "growers",
                "localField": "grower_id",
                "foreignField": "_id",
                "as": "grower",
            }
        },
        {"$unwind": "$grower"},
        {
            "$group": {
                "_id": "$grower.language",
                "total": {"$sum": 1},
                "opened": {"$sum": {"$cond": ["$opened", 1, 0]}},
                "clicked": {"$sum": {"$cond": ["$clicked", 1, 0]}},
            }
        },
        {"$sort": {"total": -1}},
    ]
    results = await col_whatsapp_log().aggregate(pipeline).to_list(length=20)
    return {
        "data": [
            {
                "language": r["_id"],
                "total": r["total"],
                "open_rate": round(100 * r["opened"] / r["total"], 1) if r["total"] else 0,
                "click_rate": round(100 * r["clicked"] / r["total"], 1) if r["total"] else 0,
            }
            for r in results
        ]
    }


@router.get("/funnel")
async def get_funnel():
    """Digital campaign funnel: impressions → visits → leads by campaign."""
    pipeline = [
        {
            "$group": {
                "_id": "$campaign_id",
                "campaign_crop": {"$first": "$campaign_crop"},
                "campaign_product": {"$first": "$campaign_product"},
                "total_impressions": {"$sum": "$impressions"},
                "total_visits": {"$sum": "$visits"},
                "total_leads": {"$sum": "$leads"},
            }
        }
    ]
    results = await col_funnel().aggregate(pipeline).to_list(length=20)
    return {
        "data": [
            {
                "campaign_id": r["_id"],
                "crop": r["campaign_crop"],
                "product": r["campaign_product"],
                "impressions": r["total_impressions"],
                "visits": r["total_visits"],
                "leads": r["total_leads"],
                "ctr": round(100 * r["total_visits"] / r["total_impressions"], 2) if r["total_impressions"] else 0,
                "lead_cvr": round(100 * r["total_leads"] / r["total_visits"], 2) if r["total_visits"] else 0,
            }
            for r in results
        ]
    }


@router.get("/top-products")
async def get_top_products(limit: int = 8):
    """Top selling products by revenue from POS data."""
    pipeline = [
        {
            "$group": {
                "_id": "$sku_name",
                "total_qty": {"$sum": "$qty"},
                "total_revenue": {"$sum": "$revenue"},
                "transactions": {"$sum": 1},
            }
        },
        {"$sort": {"total_revenue": -1}},
        {"$limit": limit},
    ]
    results = await col_retailer_pos().aggregate(pipeline).to_list(length=limit)
    return {
        "data": [
            {
                "product": r["_id"],
                "total_qty": r["total_qty"],
                "total_revenue": round(r["total_revenue"], 0),
                "transactions": r["transactions"],
            }
            for r in results
        ]
    }


@router.get("/district-heatmap")
async def get_district_heatmap():
    """Grower density by district for map visualization."""
    pipeline = [
        {
            "$group": {
                "_id": {"state": "$state", "district": "$district"},
                "grower_count": {"$sum": 1},
                "smartphone_count": {
                    "$sum": {"$cond": [{"$eq": ["$device_type", "smartphone"]}, 1, 0]}
                },
                "crops": {"$addToSet": "$primary_crop"},
            }
        },
        {"$sort": {"grower_count": -1}},
    ]
    results = await col_growers().aggregate(pipeline).to_list(length=200)
    return {
        "districts": [
            {
                "state": r["_id"]["state"],
                "district": r["_id"]["district"],
                "grower_count": r["grower_count"],
                "smartphone_count": r["smartphone_count"],
                "smartphone_pct": round(100 * r["smartphone_count"] / r["grower_count"], 1),
                "crops": r["crops"],
            }
            for r in results
        ]
    }


@router.get("/map-data")
async def get_map_data():
    """Raw grower locations for 3D Deck.gl visualization."""
    pipeline = [
        {
            "$group": {
                "_id": "$district",
                "count": {"$sum": 1},
                "avg_farm_size": {"$avg": "$farm_size_acres"},
                "state": {"$first": "$state"}
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 500}
    ]
    results = await col_growers().aggregate(pipeline).to_list(length=500)
    return {
        "data": [
            {
                "district": r["_id"],
                "count": r["count"],
                "farm_size": round(r["avg_farm_size"] or 0, 2),
                "state": r["state"]
            }
            for r in results
        ]
    }
