# --- CSV IMPORT (robust) ---

import io
import csv
import re
from typing import Dict, Any, List, Optional, Tuple
from fastapi import UploadFile, File, Form, APIRouter, HTTPException

router = APIRouter()

def _norm_key(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[\s\-_]+", "", s)          # spaces, _, - remove
    s = re.sub(r"[^a-z0-9]", "", s)         # other symbols remove
    return s

def _parse_price(value: Any) -> Tuple[Optional[float], Optional[str]]:
    """
    Handles: 'EUR 0.99', '0.99', '€0,99', etc.
    Returns: (price_float, currency_or_none)
    """
    if value is None:
        return None, None
    s = str(value).strip()
    if not s:
        return None, None

    # currency guess (EUR, USD, GBP)
    cur = None
    mcur = re.search(r"\b([A-Z]{3})\b", s)
    if mcur:
        cur = mcur.group(1)

    # replace comma decimals
    s2 = s.replace(",", ".")
    # extract first number
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
        return ","  # default

def _guess_mapping(norm_headers: List[str]) -> Dict[str, str]:
    """
    returns internal_field -> normalized_header_key
    internal fields: id, title, url, image, price, currency
    """
    hs = set(norm_headers)

    def pick(*cands):
        for c in cands:
            if c in hs:
                return c
        return None

    # AliExpress typical headers
    pid = pick("productid", "product_id", "id", "sku", "productcode")
    title = pick("productdesc", "title", "name", "productname", "description")
    url = pick("promotionurl", "producturl", "url", "link", "affiliateurl")
    img = pick("imageurl", "image", "img", "image_link", "pictureurl")

    # prefer discount price if exists
    price = pick("discountprice", "saleprice", "price", "currentprice", "finalprice", "originprice")
    currency = pick("currency", "cur")

    mapping = {}
    if pid: mapping["id"] = pid
    if title: mapping["title"] = title
    if url: mapping["url"] = url
    if img: mapping["image"] = img
    if price: mapping["price"] = price
    if currency: mapping["currency"] = currency
    return mapping

@router.post("/api/import")
async def import_products_csv(
    platform: str = Form(...),
    file: UploadFile = File(...),
):
    platform = (platform or "").strip().lower()
    if platform not in {"aliexpress", "temu", "shein"}:
        raise HTTPException(status_code=400, detail="platform must be one of: aliexpress, temu, shein")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty file")

    # decode safely
    text = raw.decode("utf-8", errors="replace")
    delim = _sniff_delimiter(text[:2000])

    reader = csv.DictReader(io.StringIO(text), delimiter=delim)
    if not reader.fieldnames:
        return {"success": True, "platform": platform, "rows": 0, "imported": 0, "updated": 0}

    # normalize headers
    original_headers = list(reader.fieldnames)
    norm_headers = [_norm_key(h) for h in original_headers]

    # map normalized->original for reading
    norm_to_original = {}
    for orig, norm in zip(original_headers, norm_headers):
        if norm and norm not in norm_to_original:
            norm_to_original[norm] = orig

    mapping = _guess_mapping(norm_headers)

    imported = 0
    updated = 0
    rows = 0
    products_to_save: List[Dict[str, Any]] = []
    skipped_samples: List[Dict[str, Any]] = []

    for row in reader:
        rows += 1

        def get(field: str) -> Any:
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

        # price + currency
        price_raw = get("price")
        price_val, cur_from_price = _parse_price(price_raw)

        cur = get("currency")
        if cur:
            cur = str(cur).strip().upper()
        if not cur and cur_from_price:
            cur = cur_from_price

        # minimal requirements (title + url) OR (title + image)
        if not title or (not url and not image):
            if len(skipped_samples) < 5:
                skipped_samples.append({"reason": "missing_title_or_link", "title": title, "url": url, "image": image})
            continue

        doc = {
            "platform": platform,
            "external_id": str(pid).strip() if pid else None,
            "title": str(title).strip(),
            "url": str(url).strip() if url else None,
            "image": str(image).strip() if image else None,
            "price": price_val,
            "currency": cur or "EUR",
        }

        products_to_save.append(doc)

    # ✅ BURADA: sende DB’ye kayıt hangi fonksiyonla yapılıyorsa onu çağır
    # örnek:
    # result = await save_products(products_to_save)  # -> (imported_count, updated_count)
    #
    # ŞİMDİLİK placeholder:
    # imported, updated = len(products_to_save), 0

    # !!! bunu kendi DB kaydınla değiştir:
    imported = len(products_to_save)
    updated = 0

    return {
        "success": True,
        "platform": platform,
        "rows": rows,
        "imported": imported,
        "updated": updated,
        "detected_delimiter": delim,
        "detected_mapping": mapping,
        "skipped_samples": skipped_samples,
    }
