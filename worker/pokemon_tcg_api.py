#!/usr/bin/env python3
"""
Pokemon TCG API integration for card identification
"""
import requests
import time
from typing import Dict, List, Optional
import io
import base64
from PIL import Image
import easyocr
import difflib
import traceback
import cv2
import re
from imagehash import phash
from PIL import Image as PilImage
from config import get_supabase_client
from urllib.parse import quote
import warnings
import concurrent.futures  # Added for OCR timeout support
warnings.filterwarnings("ignore", "'pin_memory'")

# Initialize supabase client
supabase_client = get_supabase_client()

ALPHA_RE = re.compile(r"[A-Za-z]{3,}")  # ≥3 letters

HASH_KEY_FIELD = "api_id"

def safe_ocr(reader: easyocr.Reader, img_cv, conf: float = 0.20, timeout: int = 15) -> list[str]:
    """Run EasyOCR with a hard timeout (seconds). Returns tokens or [] on timeout/error."""
    # 1️⃣ Pre-process to greyscale
    if img_cv.ndim == 3:
        img_cv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

    def _do_ocr():
        return reader.readtext(
            img_cv,
            detail=0,
            allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-' "
        )

    try:
        # 2️⃣ Run OCR in thread so we can enforce timeout (signal alarm doesn't work on Windows)
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            tokens = ex.submit(_do_ocr).result(timeout=timeout)
    except concurrent.futures.TimeoutError:
        print(f"⚠️  OCR timed-out after {timeout}s – skipping this crop")
        return []
    except Exception as e:
        print(f"⚠️  OCR failed: {e}")
        return []

    # 3️⃣ Post-filter tokens: ≥3 letters, unique, preserve order
    filtered = []
    seen = set()
    for tok in tokens:
        tok = tok.strip()
        if ALPHA_RE.search(tok):
            lower = tok.lower()
            if lower not in seen:
                filtered.append(tok)
                seen.add(lower)
    return filtered

class PokemonTCGAPI:
    def __init__(self, api_key: Optional[str] = None):
        self.base_url = "https://api.pokemontcg.io/v2"
        self.api_key = api_key
        self.headers = {"X-Api-Key": api_key} if api_key else {}
        self.rate_limit_delay = 0.5  # Half second delay to respect rate limits
        self.reader = easyocr.Reader(['en'], gpu=False)  # Initialize OCR reader for English

    def search_cards(self, query: str) -> List[Dict]:
        """Search for cards using query string"""
        try:
            encoded_q = quote(query, safe=':+"* ')
            url = f"{self.base_url}/cards?q={encoded_q}"
            response = requests.get(url, headers=self.headers)

            if response.status_code == 404:
                # 404 == no hits for this query
                return []

            response.raise_for_status()
            time.sleep(self.rate_limit_delay)
            return response.json().get("data", [])

        except requests.exceptions.HTTPError as e:
            print(f"⚠️  API HTTP {e.response.status_code}: {e.response.text[:120]}")
            return []
        except Exception as e:
            print(f"🔥 Unexpected error searching cards: {e}")
            return []

    def get_current_prices(self, card_id: str) -> Dict:
        """Get current market prices for a card"""
        # Note: Actual API might not have direct price endpoint; this assumes integration or separate TCGplayer API
        # For now, mock prices; replace with real if available
        import random
        return {
            "tcgplayer": {
                "market": random.uniform(1.0, 100.0),
                "low": random.uniform(0.5, 50.0),
                "mid": random.uniform(1.0, 80.0),
                "high": random.uniform(2.0, 150.0)
            }
        }

    def identify_card_by_visual_features(self, crop_image_path: str) -> Optional[Dict]:
        """Identify card using OCR on image crop"""
        try:
            img_cv = cv2.imread(crop_image_path)
            h, w = img_cv.shape[:2]
            title_crop = img_cv[0:int(h*0.30), :]

            texts = safe_ocr(self.reader, title_crop)
            if not texts:
                print("⚠️  Title OCR empty – trying full image …")
                texts = safe_ocr(self.reader, img_cv)

            if not texts:
                print("🚫 OCR found nothing usable")
                return None

            import re
            raw_name = texts[0].lower()
            # Remove problematic Lucene characters and stray symbols
            extracted_name = re.sub(r"[^a-z0-9\s]", "", raw_name).strip()
            raw_set = texts[1].lower() if len(texts) > 1 else ""
            extracted_set = re.sub(r"[^a-z0-9\s]", "", raw_set).strip()
            print(f"📝 Clean OCR name: {extracted_name} | set: {extracted_set}")
            
            # Build query with name and set if available
            strict_q = f'name:"{extracted_name}"'
            if extracted_set:
                strict_q += f' set.name:"{extracted_set}"'
            candidates = self.search_cards(strict_q)

            if not candidates:
                # wildcard fallback
                wild_q = f'name:"{extracted_name}*"'
                print(f"🔎 Strict query empty – trying wildcard → {wild_q}")
                candidates = self.search_cards(wild_q)

            if not candidates:
                # --- Fuzzy name search (Levenshtein) ---
                try:
                    if len(extracted_name) >= 3:
                        fuzzy_q = f'name:{extracted_name}~'
                        print(f"🔎 Wildcard empty – trying fuzzy → {fuzzy_q}")
                        candidates = self.search_cards(fuzzy_q)
                        if not candidates and " " in extracted_name:
                            # Try fuzzy on each word to be resilient to multi-word errors
                            parts = extracted_name.split()
                            fuzzy_parts = " ".join([f'name:{p}~' for p in parts if len(p) >= 3])
                            if fuzzy_parts:
                                print(f"🔎 Fuzzy per-word query → {fuzzy_parts}")
                                candidates = self.search_cards(fuzzy_parts)
                except Exception as fuzzy_err:
                    print(f"⚠️ Fuzzy search failed: {fuzzy_err}")

                if not candidates:
                    print("⚠️ No candidates found after all search strategies")
                    return None

                if not candidates:
                    return None

            # Compute crop hash
            crop_img = PilImage.open(crop_image_path)
            crop_hash = phash(crop_img)

            # If candidates from OCR:
            card_data = None  # Ensure defined
            if candidates:
                best_match = None
                best_distance = float('inf')
                for cand in candidates:
                    cand_id = cand['id']
                    hash_res = supabase_client.from_('card_hashes').select('phash').eq(HASH_KEY_FIELD, cand_id).execute()
                    if hash_res.data:
                        cand_hash_str = hash_res.data[0]['phash']
                        cand_hash = imagehash.hex_to_hash(cand_hash_str)
                    else:
                        # Compute and cache
                        img_url = cand['images']['large']
                        img_data = requests.get(img_url).content
                        cand_img = PilImage.open(io.BytesIO(img_data))
                        cand_hash = phash(cand_img)
                        supabase_client.from_('card_hashes').insert({HASH_KEY_FIELD: cand_id, 'phash': str(cand_hash)}).execute()
                    
                    distance = crop_hash - cand_hash
                    if distance < best_distance:
                        best_distance = distance
                        best_match = cand
                
                if best_distance < 10:  # Threshold
                    print(f"✅ Best pHash match: {best_match['name']} (distance: {best_distance})")
                    card_data = best_match
                    card_data['confidence'] = 1 - (best_distance / 64.0)  # Normalize to 0-1
                else:
                    print("⚠️ No good pHash match in candidates")

            # Fallback if no candidates or no good match:
            if not card_data:
                print("🔎 OCR failed - broad query + pHash fallback")
                broad_candidates = self.search_cards('supertype:pokemon')[:50]  # Limit to avoid rate limits
                best_match = None
                best_distance = float('inf')
                for cand in broad_candidates:
                    cand_id = cand['id']
                    hash_res = supabase_client.from_('card_hashes').select('phash').eq(HASH_KEY_FIELD, cand_id).execute()
                    if hash_res.data:
                        cand_hash_str = hash_res.data[0]['phash']
                        cand_hash = imagehash.hex_to_hash(cand_hash_str)
                    else:
                        img_url = cand['images']['large']
                        img_data = requests.get(img_url).content
                        cand_img = PilImage.open(io.BytesIO(img_data))
                        cand_hash = phash(cand_img)
                        supabase_client.from_('card_hashes').insert({HASH_KEY_FIELD: cand_id, 'phash': str(cand_hash)}).execute()
                    
                    distance = crop_hash - cand_hash
                    if distance < best_distance:
                        best_distance = distance
                        best_match = cand
                
                if best_distance < 10:  # Threshold
                    print(f"✅ Best pHash match from broad: {best_match['name']} (distance: {best_distance})")
                    card_data = best_match
                    card_data['confidence'] = 1 - (best_distance / 64.0)  # Normalize to 0-1
                else:
                    print("⚠️ No good pHash match in broad query")

            # Best match based on name similarity
            best_match = None
            best_similarity = 0.0
            
            for candidate in candidates:
                candidate_name = candidate.get('name', '').lower()
                similarity = difflib.SequenceMatcher(None, extracted_name.lower(), candidate_name).ratio()
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = candidate
            
            if best_similarity < 0.4:
                print(f"⚠️ Best similarity {best_similarity} below threshold")
                return None
                
            print(f"✅ Best match: {best_match['name']} (sim: {best_similarity:.2f})")
            best_match['confidence'] = best_similarity
            return best_match
            
        except Exception as e:
            print(f"🔥 Error in identification: {e}")
            traceback.print_exc()
            return None

    def get_card_by_id(self, card_id: str) -> Optional[Dict]:
        """Get full card details by ID"""
        try:
            url = f"{self.base_url}/cards/{card_id}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            time.sleep(self.rate_limit_delay)
            return response.json().get("data")
            
        except Exception as e:
            print(f"🔥 Error fetching card {card_id}: {e}")
            return None
    
    def search_by_name_and_set(self, name: str, set_name: str = None) -> List[Dict]:
        """Search for cards by name and optionally set"""
        query_parts = [f'name:"{name}"']
        if set_name:
            query_parts.append(f'set.name:"{set_name}"')
        
        query = " ".join(query_parts)
        return self.search_cards(query)

def identify_card_from_crop(crop_path: str, api_key: str = None) -> Dict:
    """
    Main function to identify a card from a crop image
    Returns enriched card data with confidence score
    """
    api = PokemonTCGAPI(api_key)
    
    # Step 1: Attempt visual identification
    card_data = api.identify_card_by_visual_features(crop_path)
    
    if not card_data:
        return {
            "success": False,
            "confidence": 0.0,
            "error": "No card identification possible"
        }
    
    # Step 2: Get current pricing
    try:
        prices = api.get_current_prices(card_data["id"])
        card_data["current_prices"] = prices
        card_data["estimated_value"] = prices["tcgplayer"]["market"]
    except:
        card_data["estimated_value"] = 0.0
    
    # Step 3: Return enriched data
    return {
        "success": True,
        "confidence": card_data["confidence"],
        "card_id": card_data["id"],
        "name": card_data["name"],
        "set_name": card_data["set"]["name"],
        "set_series": card_data["set"]["series"],
        "number": card_data["number"],
        "rarity": card_data["rarity"],
        "supertype": card_data["supertype"],
        "subtypes": card_data.get("subtypes", []),
        "image_url": card_data["images"].get("large", card_data["images"]["small"]),
        "tcgplayer_url": card_data.get("tcgplayer", {}).get("url"),
        "estimated_value": card_data.get("estimated_value", 0.0),
        "current_prices": card_data.get("current_prices", {}),
        "api_response": card_data  # Full API response for debugging
    }

# Example usage
if __name__ == "__main__":
    # Test the API
    result = identify_card_from_crop("test_crop.jpg")
    print("Identification result:", result) 