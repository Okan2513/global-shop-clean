from fastapi import FastAPI, APIRouter, HTTPException, Query, Header, UploadFile, File, BackgroundTasks, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import FileResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import hashlib
import secrets
import json
import httpx
import csv
import io
import xml.etree.ElementTree as ET
import asyncio
import re  # ✅ küçük ek: regex helper için

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'global_db')]

# Create the main app
app = FastAPI(title="GLOBAL API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBasic()

# Admin credentials - stored securely
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "Yusuf")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "2012")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============== AUTHENTICATION ===============

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials using HTTP Basic Auth"""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# =============== MODELS ===============

class ImportRequest(BaseModel):
    url: str
    category: Optional[str] = "General"

class PlatformPrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    platform: str
    price: float
    original_price: Optional[float] = None
    currency: str = "USD"
    affiliate_url: Optional[str] = None
    url: Optional[str] = None
    in_stock: bool = True
    last_updated: Optional[str] = None

    def get_url(self):
        return self.affiliate_url or self.url or "#"

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_tr: Optional[str] = None
    description: Optional[str] = ""
    description_tr: Optional[str] = None
    image: Optional[str] = ""
    images: List[str] = []
    category: Optional[str] = "General"
    category_slug: Optional[str] = "general"
    prices: List[dict] = []
    best_price: Optional[float] = 0
    best_platform: Optional[str] = ""
    discount_percent: Optional[int] = None
    rating: Optional[float] = 4.5
    reviews_count: Optional[int] = 0
    sku: Optional[str] = None
    brand: Optional[str] = None
    attributes: Dict[str, Any] = {}
    source_ids: Dict[str, str] = {}
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_tr: Optional[str] = None
    slug: str
    image: str
    product_count: int = 0

class FeedImport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str
    filename: str
    status: str = "pending"
    products_imported: int = 0
    products_updated: int = 0
    errors: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

class SyncLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str
    sync_type: str
    status: str = "running"
    products_synced: int = 0
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    error_message: Optional[str] = None

class APISettings(BaseModel):
    aliexpress_app_key: Optional[str] = None
    aliexpress_app_secret: Optional[str] = None
    aliexpress_tracking_id: Optional[str] = None
    amazon_tag: Optional[str] = None
    temu_affiliate_id: Optional[str] = None
    temu_api_key: Optional[str] = None
    shein_affiliate_id: Optional[str] = None
    shein_api_key: Optional[str] = None

class SiteSettings(BaseModel):
    contact_email: Optional[str] = None
    site_name: Optional[str] = "GLOBAL"
    footer_text: Optional[str] = None

class FeedConfig(BaseModel):
    platform: str
    feed_url: Optional[str] = None
    feed_type: str = "csv"
    enabled: bool = True
    last_sync: Optional[str] = None

# =============== ALIEXPRESS API SERVICE ===============

class AliExpressAPI:
    BASE_URL = "https://api-sg.aliexpress.com/sync"

    def __init__(self, app_key: str, app_secret: str, tracking_id: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.tracking_id = tracking_id

    def _sign_request(self, params: dict) -> str:
        sorted_params = sorted(params.items())
        sign_str = self.app_secret
        for k, v in sorted_params:
            sign_str += f"{k}{v}"
        sign_str += self.app_secret
        return hashlib.md5(sign_str.encode('utf-8')).hexdigest().upper()

    async def _make_request(self, method: str, params: dict) -> dict:
        base_params = {
            "app_key": self.app_key,
            "method": method,
            "sign_method": "md5",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "format": "json",
            "v": "2.0",
        }
        base_params.update(params)
        base_params["sign"] = self._sign_request(base_params)

        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.post(self.BASE_URL, data=base_params)
            return response.json()

    async def get_product_details(self, product_id: str) -> Optional[dict]:
        """Ürün ID'si ile AliExpress'ten detaylı bilgi çeker (Fiyat dahil)"""
        params = {
            "product_id": product_id,
            "target_currency": "EUR",
            "target_language": "FR",
            "tracking_id": self.tracking_id
        }
        result = await self._make_request("aliexpress.affiliate.product.detail.get", params)
        if "aliexpress_affiliate_product_detail_get_response" in result:
            resp = result["aliexpress_affiliate_product_detail_get_response"]["resp_result"]
            if resp.get("resp_code") == 200:
                return resp.get("result", {})
        return None

    async def search_products(self, keywords: str, category_id: str = None,
                             min_price: float = None, max_price: float = None,
                             page: int = 1, page_size: int = 50) -> List[dict]:
        params = {
            "keywords": keywords,
            "target_currency": "EUR",
            "target_language": "FR",
            "tracking_id": self.tracking_id,
            "page_no": str(page),
            "page_size": str(min(page_size, 50)),
        }

        if category_id:
            params["category_ids"] = category_id
        if min_price:
            params["min_sale_price"] = str(int(min_price * 100))
        if max_price:
            params["max_sale_price"] = str(int(max_price * 100))

        result = await self._make_request("aliexpress.affiliate.product.query", params)

        if "aliexpress_affiliate_product_query_response" in result:
            resp = result["aliexpress_affiliate_product_query_response"]["resp_result"]
            if resp.get("resp_code") == 200:
                products = resp.get("result", {}).get("products", {}).get("product", [])
                return products if isinstance(products, list) else [products]

        return []

    async def get_hot_products(self, category_id: str = None, page: int = 1) -> List[dict]:
        params = {
            "target_currency": "EUR",
            "target_language": "FR",
            "tracking_id": self.tracking_id,
            "page_no": str(page),
            "page_size": "50",
        }

        if category_id:
            params["category_ids"] = category_id

        result = await self._make_request("aliexpress.affiliate.hotproduct.query", params)

        if "aliexpress_affiliate_hotproduct_query_response" in result:
            resp = result["aliexpress_affiliate_hotproduct_query_response"]["resp_result"]
            if resp.get("resp_code") == 200:
                products = resp.get("result", {}).get("products", {}).get("product", [])
                return products if isinstance(products, list) else [products]

        return []

def transform_aliexpress_product(ae_product: dict) -> dict:
    # Fiyat çekme mantığı EUR ve Choice uyumlu hale getirildi
    price_val = ae_product.get("target_sale_price") or ae_product.get("sale_price") or "0"
    orig_val = ae_product.get("target_original_price") or ae_product.get("original_price") or price_val

    price = float(str(price_val).replace(",", ""))
    original_price = float(str(orig_val).replace(",", ""))

    discount = 0
    if original_price > 0 and price < original_price:
        discount = int(((original_price - price) / original_price) * 100)

    return {
        "external_id": ae_product.get("product_id"),
        "name": ae_product.get("product_title", ""),
        "description": ae_product.get("product_title", ""),
        "image": ae_product.get("product_main_image_url", ""),
        "images": ae_product.get("product_small_image_urls", {}).get("string", []),
        "price": price,
        "original_price": original_price,
        "discount_percent": discount,
        "affiliate_url": ae_product.get("promotion_link", ""),
        "category": ae_product.get("second_level_category_name", "General"),
        "rating": float(str(ae_product.get("evaluate_rate", "0")).replace("%", "")) / 20 if ae_product.get("evaluate_rate") else 4.5,
        "reviews_count": int(ae_product.get("lastest_volume", 0)),
    }

# ✅ küçük ek: fiyat string temizleyici
def _to_float_safe(val: Any) -> float:
    try:
        if val is None:
            return 0.0
        s = str(val)
        s = s.replace(",", "").replace("€", "").replace("$", "").replace("EUR", "").replace("USD", "").strip()
        return float(s) if s else 0.0
    except Exception:
        return 0.0

# ✅ küçük ek: AliExpress URL’den ürün ID bul (redirect dahil)
async def extract_aliexpress_product_id(url: str) -> Optional[str]:
    # Direkt URL içinde item/ID.html
    m = re.search(r"/item/(\d+)\.html", url)
    if m:
        return m.group(1)

    # Bazı linkler parametre içinde id taşır
    m2 = re.search(r"(?:product_id=|productId=|id=)(\d{6,})", url)
    if m2:
        return m2.group(1)

    # Redirect takip et (s.click.aliexpress vb)
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as http_client:
            r = await http_client.get(url)
            final_url = str(r.url)
            m3 = re.search(r"/item/(\d+)\.html", final_url)
            if m3:
                return m3.group(1)
            m4 = re.search(r"(?:product_id=|productId=|id=)(\d{6,})", final_url)
            if m4:
                return m4.group(1)
    except Exception:
        pass

    return None

# =============== FEED IMPORT SERVICE ===============

async def parse_csv_feed(content: str, platform: str) -> List[dict]:
    products = []
    reader = csv.DictReader(io.StringIO(content))

    for row in reader:
        try:
            product = {
                "external_id": row.get("product_id") or row.get("sku") or row.get("id"),
                "name": row.get("product_name") or row.get("title") or row.get("name"),
                "description": row.get("description") or row.get("product_description") or "",
                "image": row.get("image_url") or row.get("image") or row.get("image_link"),
                "price": float(row.get("price") or row.get("sale_price") or "0"),
                "original_price": float(row.get("original_price") or row.get("retail_price") or "0"),
                "affiliate_url": row.get("affiliate_url") or row.get("deep_link") or row.get("link"),
                "category": row.get("category") or row.get("product_type") or "General",
                "brand": row.get("brand") or row.get("manufacturer"),
                "in_stock": row.get("availability", "in stock").lower() == "in stock",
                "group_id": row.get("group_id") or row.get("group") or row.get("groupId"),  # ✅ küçük ek: varsa al
            }

            if product["external_id"] and product["name"]:
                products.append(product)
        except Exception as e:
            logger.error(f"Error parsing row: {e}")
            continue

    return products

async def parse_xml_feed(content: str, platform: str) -> List[dict]:
    products = []

    try:
        root = ET.fromstring(content)
        items = root.findall(".//item") or root.findall(".//product") or root.findall(".//entry")

        for item in items:
            try:
                def get_text(elem, tags):
                    for tag in tags:
                        el = elem.find(tag)
                        if el is not None and el.text:
                            return el.text.strip()
                    return ""

                price_text = get_text(item, ["g:price", "price", "sale_price"]).replace("USD", "").replace("EUR", "").replace("$", "").replace("€", "").strip()
                orig_price_text = get_text(item, ["g:sale_price", "original_price"]).replace("USD", "").replace("EUR", "").replace("$", "").replace("€", "").strip()

                product = {
                    "external_id": get_text(item, ["g:id", "id", "sku", "product_id"]),
                    "name": get_text(item, ["g:title", "title", "name", "product_name"]),
                    "description": get_text(item, ["g:description", "description"]),
                    "image": get_text(item, ["g:image_link", "image_url", "image"]),
                    "price": float(price_text) if price_text else 0,
                    "original_price": float(orig_price_text) if orig_price_text else 0,
                    "affiliate_url": get_text(item, ["g:link", "link", "affiliate_url", "url"]),
                    "category": get_text(item, ["g:product_type", "category", "product_type"]),
                    "brand": get_text(item, ["g:brand", "brand"]),
                }

                if product["external_id"] and product["name"]:
                    products.append(product)
            except Exception as e:
                logger.error(f"Error parsing XML item: {e}")
                continue
    except ET.ParseError as e:
        logger.error(f"XML Parse error: {e}")

    return products

async def fetch_feed_from_url(url: str, feed_type: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        response = await http_client.get(url)
        response.raise_for_status()
        return response.text

async def import_feed_products(feed_products: List[dict], platform: str) -> tuple:
    imported = 0
    updated = 0

    for fp in feed_products:
        try:
            existing = await db.products.find_one({f"source_ids.{platform}": fp["external_id"]}, {"_id": 0})

            price_entry = PlatformPrice(
                platform=platform,
                price=fp["price"],
                original_price=fp.get("original_price"),
                currency="EUR" if platform in ["aliexpress", "amazon"] else "USD",
                affiliate_url=fp["affiliate_url"],
                in_stock=fp.get("in_stock", True),
                last_updated=datetime.now(timezone.utc).isoformat()
            )

            if existing:
                prices = existing.get("prices", [])
                prices = [p for p in prices if p["platform"] != platform]
                prices.append(price_entry.model_dump())

                best_price = min(p["price"] for p in prices if p["price"] > 0) if any(p["price"] > 0 for p in prices) else fp["price"]
                best_platform = next((p["platform"] for p in prices if p["price"] == best_price), platform)

                update_doc = {
                    "prices": prices,
                    "best_price": best_price,
                    "best_platform": best_platform,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                # ✅ küçük ek: group_id varsa sakla
                if fp.get("group_id"):
                    update_doc["attributes.group_id"] = fp.get("group_id")

                await db.products.update_one(
                    {"id": existing["id"]},
                    {"$set": update_doc}
                )
                updated += 1
            else:
                category_slug = fp.get("category", "general").lower().replace(" ", "-").replace("&", "and")
                orig_price = fp.get("original_price") or fp["price"]
                discount = int(((orig_price - fp["price"]) / orig_price) * 100) if orig_price > fp["price"] else None

                attrs = {}
                # ✅ küçük ek: group_id varsa attributes içine koy
                if fp.get("group_id"):
                    attrs["group_id"] = fp.get("group_id")

                product = Product(
                    name=fp["name"],
                    description=fp.get("description", fp["name"]),
                    image=fp["image"],
                    images=[fp["image"]] if fp["image"] else [],
                    category=fp.get("category", "General"),
                    category_slug=category_slug,
                    prices=[price_entry.model_dump()],
                    best_price=fp["price"],
                    best_platform=platform,
                    discount_percent=discount,
                    brand=fp.get("brand"),
                    attributes=attrs,  # ✅ küçük ek
                    source_ids={platform: fp["external_id"]},
                    created_at=datetime.now(timezone.utc).isoformat(),
                    updated_at=datetime.now(timezone.utc).isoformat()
                )

                await db.products.insert_one(product.model_dump())
                imported += 1

        except Exception as e:
            logger.error(f"Error importing product: {e}")
            continue

    return imported, updated

# =============== AUTOMATED SYNC SERVICE ===============

async def sync_aliexpress_products(keywords_list: List[str] = None):
    settings = await db.settings.find_one({"type": "api"}, {"_id": 0})

    if not settings or not settings.get("aliexpress_app_key"):
        logger.warning("AliExpress API not configured")
        return {"success": False, "error": "AliExpress API not configured"}

    api = AliExpressAPI(
        app_key=settings["aliexpress_app_key"],
        app_secret=settings["aliexpress_app_secret"],
        tracking_id=settings["aliexpress_tracking_id"]
    )

    sync_log = SyncLog(platform="aliexpress", sync_type="auto")
    await db.sync_logs.insert_one(sync_log.model_dump())

    total_synced = 0

    try:
        # Sync hot products
        ae_products = await api.get_hot_products()
        feed_products = [transform_aliexpress_product(p) for p in ae_products]
        imported, updated = await import_feed_products(feed_products, "aliexpress")
        total_synced += imported + updated

        # Sync by keywords if provided
        if keywords_list:
            for keyword in keywords_list:
                ae_products = await api.search_products(keyword)
                feed_products = [transform_aliexpress_product(p) for p in ae_products]
                imported, updated = await import_feed_products(feed_products, "aliexpress")
                total_synced += imported + updated

        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {
                "status": "completed",
                "products_synced": total_synced,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )

        await update_category_counts()

        return {"success": True, "products_synced": total_synced}

    except Exception as e:
        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": False, "error": str(e)}

async def sync_feed_from_url(platform: str, feed_url: str, feed_type: str = "csv"):
    sync_log = SyncLog(platform=platform, sync_type="feed_url")
    await db.sync_logs.insert_one(sync_log.model_dump())

    try:
        content = await fetch_feed_from_url(feed_url, feed_type)

        if feed_type == "csv":
            products = await parse_csv_feed(content, platform)
        else:
            products = await parse_xml_feed(content, platform)

        imported, updated = await import_feed_products(products, platform)

        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {
                "status": "completed",
                "products_synced": imported + updated,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )

        await db.feed_configs.update_one(
            {"platform": platform},
            {"$set": {"last_sync": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )

        await update_category_counts()

        return {"success": True, "imported": imported, "updated": updated}

    except Exception as e:
        await db.sync_logs.update_one(
            {"id": sync_log.id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": False, "error": str(e)}

async def run_all_syncs():
    results = {}
    results["aliexpress"] = await sync_aliexpress_products()
    feed_configs = await db.feed_configs.find({"enabled": True}, {"_id": 0}).to_list(10)
    for config in feed_configs:
        if config.get("feed_url"):
            results[config["platform"]] = await sync_feed_from_url(
                config["platform"],
                config["feed_url"],
                config.get("feed_type", "csv")
            )
    return results

# =============== SEARCH HELPER FUNCTIONS ===============

def normalize_search_term(search: str) -> str:
    normalized = " ".join(search.lower().split())
    normalized = normalized.replace("-", " ").replace("_", " ")
    return normalized

def get_category_keywords() -> dict:
    return {
        "electronics": ["phone", "laptop", "computer", "tablet", "watch", "earbuds", "headphone", "speaker", "charger", "cable", "power bank", "bluetooth", "wireless", "smart", "gadget", "electronic"],
        "fashion": ["dress", "shirt", "pants", "jeans", "jacket", "coat", "shoes", "sneaker", "boot", "clothing", "wear", "outfit", "fashion", "style", "men", "women", "kid"],
        "home-garden": ["lamp", "light", "furniture", "decor", "kitchen", "garden", "home", "house", "bed", "sofa", "chair", "table", "storage", "organizer"],
        "beauty": ["makeup", "skincare", "cosmetic", "lipstick", "cream", "lotion", "perfume", "beauty", "hair", "nail", "face", "skin"],
        "sports": ["fitness", "gym", "exercise", "sport", "yoga", "running", "cycling", "outdoor", "camping", "hiking"],
        "bags": ["bag", "backpack", "purse", "wallet", "handbag", "luggage", "tote", "messenger", "shoulder bag"],
        "toys": ["toy", "game", "puzzle", "doll", "lego", "kids", "children", "play"],
        "jewelry": ["ring", "necklace", "bracelet", "earring", "pendant", "gold", "silver", "jewelry", "jewel"]
    }

def detect_category_from_search(search: str) -> Optional[str]:
    search_lower = search.lower()
    category_keywords = get_category_keywords()
    max_matches = 0
    best_category = None
    for category, keywords in category_keywords.items():
        matches = sum(1 for kw in keywords if kw in search_lower)
        if matches > max_matches:
            max_matches = matches
            best_category = category
    return best_category if max_matches > 0 else None

# =============== ROUTES ===============

@api_router.get("/")
async def root():
    return {"message": "GLOBAL API - Price Comparison Platform", "version": "2.0.0"}

# ✅ küçük ek: health (api prefixsiz)
@app.get("/")
async def health_root():
    return {"status": "ok", "service": "GLOBAL API", "version": "2.0.0"}

@api_router.get("/redirect/{product_id}/{platform}")
async def redirect_to_store(product_id: str, platform: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    prices = product.get("prices", [])
    target = next((p for p in prices if (p.get("platform") or "").lower() == platform.lower()), None)
    if not target:
        raise HTTPException(status_code=404, detail=f"No price entry for platform: {platform}")
    url = target.get("affiliate_url") or target.get("url")
    if not url or url == "#":
        raise HTTPException(status_code=400, detail="Store URL not available")
    return RedirectResponse(url=url, status_code=302)

# ✅ Import
@api_router.post("/import")
async def import_single_product(request: ImportRequest, admin: str = Depends(verify_admin)):
    url = request.url
    category = request.category
    platform = "general"

    if "amazon" in url.lower(): platform = "amazon"
    elif "aliexpress.com" in url.lower() or "s.click.aliexpress" in url.lower(): platform = "aliexpress"
    elif "shein.com" in url.lower(): platform = "shein"
    elif "temu.com" in url.lower(): platform = "temu"

    logger.info(f"Import işlemi başlatıldı: {platform.upper()} - URL: {url}")

    # Varsayılan değerler
    p_name = f"Yeni {platform.capitalize()} Ürünü"
    p_price = 0.0
    p_image = "https://via.placeholder.com/400"
    p_id = str(uuid.uuid4())
    p_affiliate_url = url

    # ALIEXPRESS İÇİN GERÇEK VERİ ÇEKME MANTIĞI
    if platform == "aliexpress":
        settings = await db.settings.find_one({"type": "api"})
        if settings and settings.get("aliexpress_app_key"):
            api = AliExpressAPI(
                app_key=settings["aliexpress_app_key"],
                app_secret=settings["aliexpress_app_secret"],
                tracking_id=settings["aliexpress_tracking_id"]
            )

            # ✅ DÜZELTİLDİ: URL'den ürün ID'sini doğru çıkar + redirect takip et
            ae_id = await extract_aliexpress_product_id(url)
            if ae_id:
                details = await api.get_product_details(ae_id)
                if details:
                    p_name = details.get("product_title", p_name)

                    # Bazı alanlar "12.34" gibi string gelebilir
                    p_price = _to_float_safe(details.get("target_sale_price") or details.get("sale_price") or 0)

                    p_image = details.get("product_main_image_url", p_image)
                    p_affiliate_url = details.get("promotion_link", url)

    elif platform == "amazon":
        p_name = "Amazon Ürünü (Fiyat Güncelleniyor...)"
        p_price = 0.0

    new_product = {
        "id": p_id,
        "name": p_name,
        "description": f"{platform.upper()} üzerinden sisteme aktarıldı.",
        "image": p_image,
        "images": [p_image],
        "category": category,
        "category_slug": category.lower().replace(" ", "-").replace("&", "and"),
        "prices": [
            {
                "platform": platform,
                "price": p_price,
                "currency": "EUR" if platform in ["aliexpress", "amazon"] else "USD",
                "affiliate_url": p_affiliate_url,
                "url": url,
                "in_stock": True,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
        ],
        "best_price": p_price,
        "best_platform": platform,
        "source_ids": {platform: "manual_" + str(int(datetime.now().timestamp()))},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    try:
        await db.products.insert_one(new_product)
        await update_category_counts()
        return {"success": True, "message": f"{platform.upper()} ürünü başarıyla eklendi!", "id": p_id}
    except Exception as e:
        logger.error(f"Import hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ✅✅ EKLENDİ: CSV DOSYASI YÜKLEME (TÜM PLATFORMLAR) — AUTH ZORUNLU
@api_router.post("/admin/import/csv")
async def import_products_from_csv(
    platform: str = Query(..., description="aliexpress | temu | shein | amazon"),
    file: UploadFile = File(...),
    admin: str = Depends(verify_admin)
):
    p = (platform or "").strip().lower()
    allowed = {"aliexpress", "temu", "shein", "amazon"}
    if p not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid platform. Allowed: {', '.join(sorted(allowed))}")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    try:
        raw = await file.read()
        # utf-8-sig BOM olursa sorun çıkmasın
        content = raw.decode("utf-8-sig", errors="ignore")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read CSV file (encoding issue)")

    # CSV parse + import
    try:
        feed_products = await parse_csv_feed(content, p)
        imported, updated = await import_feed_products(feed_products, p)
        await update_category_counts()
        return {
            "success": True,
            "platform": p,
            "filename": file.filename,
            "rows_parsed": len(feed_products),
            "imported": imported,
            "updated": updated
        }
    except Exception as e:
        logger.error(f"CSV import error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Ürün ve Kategori Rotaları ---

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    platform: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "popular",
    limit: int = Query(default=50, le=100),
    skip: int = 0,
    lang: str = "en"
):
    query = {}
    if category: query["category_slug"] = category
    if search:
        normalized_search = normalize_search_term(search)
        query["$or"] = [
            {"name": {"$regex": normalized_search, "$options": "i"}},
            {"description": {"$regex": normalized_search, "$options": "i"}}
        ]
    if platform: query["prices.platform"] = platform
    if min_price is not None: query["best_price"] = {"$gte": min_price}
    if max_price is not None:
        if "best_price" in query: query["best_price"]["$lte"] = max_price
        else: query["best_price"] = {"$lte": max_price}

    sort_options = {
        "price_asc": [("best_price", 1)],
        "price_desc": [("best_price", -1)],
        "newest": [("created_at", -1)]
    }
    sort_by = sort_options.get(sort, [("reviews_count", -1)])

    products = await db.products.find(query, {"_id": 0}).sort(sort_by).skip(skip).limit(limit).to_list(limit)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, lang: str = "en"):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/categories", response_model=List[Category])
async def get_categories(lang: str = "en"):
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    if not categories: categories = await seed_categories()
    return categories

# --- Admin ve Ayar Rotaları ---

@api_router.get("/admin/settings")
async def get_settings(admin: str = Depends(verify_admin)):
    settings = await db.settings.find_one({"type": "api"}, {"_id": 0})
    return settings or {}

@api_router.post("/admin/settings")
async def update_settings(settings: APISettings, admin: str = Depends(verify_admin)):
    settings_dict = settings.model_dump(exclude_none=True)
    settings_dict["type"] = "api"
    await db.settings.update_one({"type": "api"}, {"$set": settings_dict}, upsert=True)
    return {"success": True}

@api_router.get("/admin/stats")
async def get_stats(admin: str = Depends(verify_admin)):
    total = await db.products.count_documents({})
    return {"total_products": total}

# ✅ küçük ek: Admin endpoint alias (api prefixsiz) — 404 riskini azaltır
@app.get("/admin/settings")
async def get_settings_alias(admin: str = Depends(verify_admin)):
    settings = await db.settings.find_one({"type": "api"}, {"_id": 0})
    return settings or {}

@app.post("/admin/settings")
async def update_settings_alias(settings: APISettings, admin: str = Depends(verify_admin)):
    settings_dict = settings.model_dump(exclude_none=True)
    settings_dict["type"] = "api"
    await db.settings.update_one({"type": "api"}, {"$set": settings_dict}, upsert=True)
    return {"success": True}

@app.get("/admin/stats")
async def get_stats_alias(admin: str = Depends(verify_admin)):
    total = await db.products.count_documents({})
    return {"total_products": total}

async def update_category_counts():
    pipeline = [{"$group": {"_id": "$category_slug", "count": {"$sum": 1}}}]
    counts = await db.products.aggregate(pipeline).to_list(100)
    for c in counts:
        await db.categories.update_one({"slug": c["_id"]}, {"$set": {"product_count": c["count"]}})

async def seed_categories():
    categories = [
        {"id": "cat-1", "name": "Electronics", "slug": "electronics", "image": "https://images.unsplash.com/photo-1738920424218-3d28b951740a?w=400", "product_count": 0},
        {"id": "cat-2", "name": "Fashion", "slug": "fashion", "image": "https://images.unsplash.com/photo-1763551229518-4a529c865e00?w=400", "product_count": 0}
    ]
    await db.categories.insert_many(categories)
    return categories

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
