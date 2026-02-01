# =========================
# ADMIN AUTH
# =========================

from fastapi import Header
from fastapi.responses import JSONResponse
import base64

ADMIN_USER = "globaladmin"
ADMIN_PASS = "Gl0b4l$ecure2024!"

def verify_admin(auth: str):
    if not auth or not auth.startswith("Basic "):
        return False
    encoded = auth.split(" ")[1]
    decoded = base64.b64decode(encoded).decode("utf-8")
    return decoded == f"{ADMIN_USER}:{ADMIN_PASS}"


# =========================
# ADMIN STATS
# =========================

@app.get("/api/admin/stats")
async def admin_stats(Authorization: str = Header(None)):
    if not verify_admin(Authorization):
        return JSONResponse(status_code=401, content={"error": "unauthorized"})

    total_products = await collection.count_documents({})
    pipeline = [
        {"$group": {"_id": "$platform", "count": {"$sum": 1}}}
    ]
    result = collection.aggregate(pipeline)

    products_by_platform = {}
    async for r in result:
        products_by_platform[r["_id"]] = r["count"]

    return {
        "total_products": total_products,
        "products_by_platform": products_by_platform
    }


# =========================
# ADMIN SETTINGS (BASIC)
# =========================

settings_collection = db["settings"]

@app.get("/api/admin/settings")
async def get_settings(Authorization: str = Header(None)):
    if not verify_admin(Authorization):
        return JSONResponse(status_code=401, content={"error": "unauthorized"})

    settings = await settings_collection.find_one({})
    if not settings:
        return {}
    settings["_id"] = str(settings["_id"])
    return settings


@app.post("/api/admin/settings")
async def save_settings(data: dict, Authorization: str = Header(None)):
    if not verify_admin(Authorization):
        return JSONResponse(status_code=401, content={"error": "unauthorized"})

    await settings_collection.delete_many({})
    await settings_collection.insert_one(data)
    return {"success": True}
