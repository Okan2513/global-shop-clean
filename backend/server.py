from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Tuple
import uuid
from datetime import datetime, timezone
import secrets
import csv
import io

# =========================
# BOOTSTRAP
# =========================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "global_db")]

app = FastAPI(title="GLOBAL API", version="3.0.0")
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBasic()

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "Yusuf")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "2012")

# =========================
# AUTH
# =========================

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if not (
        secrets.compare_digest(credentials.username, ADMIN_USERNAME)
        and secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# =========================
# MODELS
# =========================

class PlatformPrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    platform: str
    price: float
    original_price: Optional[float] = None
    currency: str = "EUR"
    affiliate_url: Optional[str] = None
    url: Optional[str] = None
    in_stock: bool = True
    last_updated: Optional[str] = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    image: Optional[str] = ""
    images: List[str] = []
    category: Optional[str] = "General"
    category_slug: Optional[str] = "general"
    prices: List[dict] = []
    best_price: Optional[float] = 0
    best_platform: Optional[str] = ""
    brand: Optional[str] = None
    source_ids: Dict[str, str] = {}
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# =========================
# HELPERS
# =========================

def clean_price(val) -> float:
    if val is None:
        return 0.0
    s = str(val).strip()
    if not s:
        return 0.0

    s = s.replace("EUR", "").replace("USD", "").replace("€", "").replace("$", "").strip()

    if "," in s and "." not in s:
        s = s.replace(",", ".")
    else:
        s = s.replace(",", "")

    try:
        return float(s)
    except:
        return 0.0


def detect_platform_from_url(url: str) -> str:
    url = url.lower()
    if "temu." in url:
        return "temu"
    if "aliexpress." in url:
        return "aliexpress"
    if "amazon." in url:
        return "amazon"
    if "shein." in url:
        return "shein"
    return "unknown"


# =========================
# CSV PARSER (AUTO PLATFORM)
# =========================

async def parse_csv_auto(content: str) -> List[dict]:
    products = []
    reader = csv.DictReader(io.StringIO(content))

    for row in reader:
        try:
            url = (
                row.get("url")
                or row.get("affiliate_url")
                or row.get("link")
                or ""
            ).strip()

            if not url:
                continue

            platform = detect_platform_from_url(url)

            name = (
                row.get("name")
                or row.get("title")
                or "Untitled Product"
            ).strip()

            image = (
                row.get("image")
                or row.get("image_url")
                or ""
            ).strip()

            if image.startswith("//"):
                image = "https:" + image

            product = {
                "external_id": url,
                "platform": platform,
                "name": name,
                "description": name,
                "image": image,
                "price": clean_price(row.get("price")),
                "original_price": clean_price(row.get("original_price")),
                "affiliate_url": url,
                "category": (row.get("category") or "General").strip(),
                "brand": (row.get("brand") or "").strip() or None,
            }

            products.append(product)

        except Exception as e:
            logger.error(f"CSV row error: {e}")
            continue

    return products


# =========================
# IMPORT SERVICE
# =========================

async def import_feed_products(feed_products: List[dict]) -> Tuple[int, int]:
    imported = 0
    updated = 0

    for fp in feed_products:
        platform = fp["platform"]

        if platform == "unknown":
            continue

        existing = await db.products.find_one(
            {f"source_ids.{platform}": fp["external_id"]},
            {"_id": 0},
        )

        price_entry = PlatformPrice(
            platform=platform,
            price=fp["price"],
            original_price=fp.get("original_price"),
            affiliate_url=fp.get("affiliate_url"),
            url=fp.get("affiliate_url"),
            last_updated=datetime.now(timezone.utc).isoformat(),
        )

        if existing:
            prices = [p for p in existing.get("prices", []) if p["platform"] != platform]
            prices.append(price_entry.model_dump())

            best = min(prices, key=lambda x: x["price"])

            await db.products.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "prices": prices,
                    "best_price": best["price"],
                    "best_platform": best["platform"],
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
            updated += 1

        else:
            slug = (fp["category"] or "general").lower().replace(" ", "-")

            product = Product(
                name=fp["name"],
                description=fp["description"],
                image=fp["image"],
                images=[fp["image"]] if fp["image"] else [],
                category=fp["category"],
                category_slug=slug,
                prices=[price_entry.model_dump()],
                best_price=fp["price"],
                best_platform=platform,
                brand=fp.get("brand"),
                source_ids={platform: fp["external_id"]},
                created_at=datetime.now(timezone.utc).isoformat(),
                updated_at=datetime.now(timezone.utc).isoformat(),
            )

            await db.products.insert_one(product.model_dump())
            imported += 1

    return imported, updated


# =========================
# ROUTES
# =========================

@api_router.get("/site-settings")
async def site_settings():
    return {
        "site_name": "GLOBAL",
        "currency": "EUR",
        "platforms": ["aliexpress", "temu", "shein", "amazon"]
    }


@api_router.post("/admin/import/csv")
async def import_products_from_csv(
    file: UploadFile = File(...),
    admin: str = Depends(verify_admin),
):
    raw = await file.read()
    content = raw.decode("utf-8-sig", errors="ignore")

    feed_products = await parse_csv_auto(content)
    imported, updated = await import_feed_products(feed_products)

    return {
        "success": True,
        "rows_parsed": len(feed_products),
        "imported": imported,
        "updated": updated,
    }


@api_router.get("/products")
async def get_products(limit: int = Query(default=500, le=700), skip: int = 0):
    return await db.products.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)


app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
