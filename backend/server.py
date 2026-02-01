from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Any, Optional, Tuple
import os
import io
import csv
import re
from datetime import datetime
from dotenv import load_dotenv

# =========================
# CONFIG
# =========================

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "global_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
collection = db["products"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# CREATE INDEX
# =========================

@app.on_event("startup")
async def startup():
    await collection.create_index(
        [("platform", 1), ("external_id", 1)],
        unique=True,
        sparse=True
    )

# =========================
# HELPERS
# =========================

def _norm_key(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[\s\-_]+", "", s)
    s = re.sub(r"[^a-z0-9]", "", s)
    return s

def _parse_price(value: Any) -> Tuple[Optional[float], Optional[str]]:
    if value is None:
        return None, None

    s = str(value).strip()
    if not s:
        return None, None

    cur = None
    mcur = re.search(r"\b([A-Z]{3})\b", s)
    if mcur:
        cur = mcur.group(1)

    s = s.replace(",", ".")
    mnum = re.search(r"(\d+(\.\d+)?)", s)

    if not mnum:
        return None, cur

    try:
        return float(mnum.group(1)), cur
    except:
        return None, cur

def _sniff_delimiter(sample: str) -> str:
    try:
        dialect = csv.Sniffer().sniff(sample)
        return dialect.delimiter
    except:
        return ","

def _guess_mapping(norm_headers: List[str]) -> Dict[str, str]:
    hs = set(norm_headers)

    def pick(*cands):
        for c in cands:
            if c in hs:
                return c
        return None

    return {
        "id": pick("productid", "product_id", "id", "sku"),
        "title": pick("productdesc", "title", "name", "productname"),
        "url": pick("promotionurl", "producturl", "url", "link"),
        "image": pick("imageurl", "image", "img"),
        "price": pick("discountprice", "saleprice", "price", "originprice"),
        "currency": pick("currency")
    }

# =========================
# CSV IMPORT
# =========================

@app.post("/api/import")
async def import_products_csv(
    platform: str = Form(...),
    file: UploadFile = File(...)
):
    platform = platform.lower()

    if platform not in {"aliexpress", "temu", "shein"}:
        raise HTTPException(status_code=400, detail="invalid platform")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty file")

    text = raw.decode("utf-8", errors="replace")
    delim = _sniff_delimiter(text[:2000])
    reader = csv.DictReader(io.StringIO(text), delimiter=delim)

    if not reader.fieldnames:
        return {"success": False, "error": "no headers"}

    original_headers = list(reader.fieldnames)
    norm_headers = [_norm_key(h) for h in original_headers]

    norm_to_original = {
        norm: orig for orig, norm in zip(original_headers, norm_headers)
    }

    mapping = _guess_mapping(norm_headers)

    imported = 0
    updated = 0
    rows = 0

    for row in reader:
        rows += 1

        def get(field):
            nk = mapping.get(field)
            if not nk:
                return None
            ok = norm_to_original.get(nk)
            if not ok:
                return None
            return row.get(ok)

        pid = get("id")
        title = get("title")
        url = get("url")
        image = get("image")

        price_raw = get("price")
        price_val, cur_from_price = _parse_price(price_raw)

        currency = get("currency")
        if not currency:
            currency = cur_from_price or "EUR"

        if not title or not url:
            continue

        doc = {
            "platform": platform,
            "external_id": str(pid) if pid else None,
            "name": title.strip(),
            "image": image,
            "affiliate_url": url,
            "price": price_val,
            "currency": currency,
            "updated_at": datetime.utcnow(),
        }

        if doc["external_id"]:
            result = await collection.update_one(
                {
                    "platform": platform,
                    "external_id": doc["external_id"]
                },
                {"$set": doc},
                upsert=True
            )

            if result.upserted_id:
                imported += 1
            else:
                updated += 1
        else:
            await collection.insert_one(doc)
            imported += 1

    return {
        "success": True,
        "rows": rows,
        "imported": imported,
        "updated": updated,
        "delimiter": delim,
        "mapping": mapping
    }

# =========================
# PRODUCTS LIST (🔥 FIXED)
# =========================

@app.get("/api/products")
async def get_products(
    platform: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 2000
):
    query = {}

    if platform:
        query["platform"] = platform.lower()

    cursor = collection.find(query).sort("updated_at", -1).skip(skip).limit(limit)

    products = []

    async for doc in cursor:
        doc_id = str(doc["_id"])

        product_obj = {
            "id": doc_id,
            "name": doc.get("name"),
            "image": doc.get("image"),
            "discount_percent": 0,
            "prices": [
                {
                    "platform": doc.get("platform"),
                    "price": doc.get("price"),
                    "affiliate_url": doc.get("affiliate_url"),
                }
            ]
        }

        products.append(product_obj)

    return products

# =========================
# HEALTH CHECK
# =========================
# =========================
# ADMIN AUTH
# =========================

from fastapi import Header
from fastapi.responses import JSONResponse
import base64

ADMIN_USER = "Yusuf"
ADMIN_PASS = "2012"

def verify_admin(auth: str):
    if not auth or not auth.startswith("Basic "):
        return False
    try:
        encoded = auth.split(" ")[1]
        decoded = base64.b64decode(encoded).decode("utf-8")
        return decoded == f"{ADMIN_USER}:{ADMIN_PASS}"
    except:
        return False


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
# ADMIN SETTINGS
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
@app.get("/")
async def root():
    return {"status": "ok"}
