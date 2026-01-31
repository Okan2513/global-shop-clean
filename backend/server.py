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

    s2 = s.replace(",", ".")
    mnum = re.search(r"(\d+(\.\d+)?)", s2)
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
    text = raw.decode("utf-8", errors="replace")

    delim = _sniff_delimiter(text[:2000])
    reader = csv.DictReader(io.StringIO(text), delimiter=delim)

    if not reader.fieldnames:
        return {"success": False, "error": "no headers"}

    original_headers = list(reader.fieldnames)
    norm_headers = [_norm_key(h) for h in original_headers]

    norm_to_original = {}
    for orig, norm in zip(original_headers, norm_headers):
        norm_to_original[norm] = orig

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
            "created_at": datetime.utcnow(),
        }

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

    return {
        "success": True,
        "rows": rows,
        "imported": imported,
        "updated": updated,
        "delimiter": delim,
        "mapping": mapping
    }

# =========================
# PRODUCTS LIST (FILTER + SCROLL)
# =========================

@app.get("/api/products")
async def get_products(
    platform: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 20
):
    query = {}
    if platform:
        query["platform"] = platform.lower()

    cursor = collection.find(query).skip(skip).limit(limit)

    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)

    return products
