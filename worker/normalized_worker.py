#!/usr/bin/env python3
"""
Normalized Card Ownership Worker (v2)
Uses the improved multi-tenant architecture with expert PostgreSQL optimizations
"""
import io
import time
from pathlib import Path
from typing import Dict, List, Optional

import pillow_heif
from PIL import Image, ImageDraw, ImageFont, ImageOps
from ultralytics import YOLO
from config import supabase_client

# --- Model and Configuration ---
CONFIDENCE_THRESHOLD = 0.25
MAX_IMAGE_SIZE = 2048
MAX_REASONABLE_CARDS = 18
STORAGE_BUCKET = "scans"

def get_yolo_model(model_path='worker/pokemon_cards_trained.pt'):
    if not Path(model_path).exists():
        print(f"❌ Trained model not found at: {model_path}")
        exit(1)
    try:
        model = YOLO(model_path)
        print("✅ YOLO model loaded.")
        return model
    except Exception as e:
        print(f"🔥 Failed to load YOLO model: {e}")
        exit(1)

yolo_model = get_yolo_model()

def resize_for_detection(image, max_size=MAX_IMAGE_SIZE):
    w, h = image.size
    if max(w, h) <= max_size:
        return image, 1.0
    scale = max_size / max(w, h)
    return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS), scale

def mock_enrich_card(crop_path: str) -> Dict:
    """
    Mock enrichment function - replace with real LLM + API call
    Returns enrichment data for a card crop
    """
    # For now, return mock data
    mock_cards = [
        {"name": "Charizard ex", "set_name": "Scarlet & Violet", "set_code": "SV1", "card_number": "27", "rarity": "Double Rare", "price": 45.00},
        {"name": "Pikachu VMAX", "set_name": "Sword & Shield", "set_code": "SWSH", "card_number": "188", "rarity": "Secret Rare", "price": 12.50},
        {"name": "Mewtwo GX", "set_name": "Sun & Moon", "set_code": "SM1", "card_number": "62", "rarity": "Ultra Rare", "price": 8.75},
    ]
    
    import random
    mock_card = random.choice(mock_cards)
    
    return {
        "success": True,
        "card_name": mock_card["name"],
        "set_name": mock_card["set_name"],
        "set_code": mock_card["set_code"],
        "card_number": mock_card["card_number"],
        "rarity": mock_card["rarity"],
        "estimated_price": mock_card["price"],
        "confidence": round(random.uniform(0.7, 0.95), 2)
    }

def find_or_create_card(enrichment: Dict) -> Optional[str]:
    """
    Find existing card in catalog or create new one
    Returns card_id (UUID)
    Uses the unique constraint on (set_code, card_number) for proper deduplication
    """
    if not enrichment.get("success"):
        return None
        
    try:
        # ✏️ Try to find by set_code + card_number first (more reliable than name)
        set_code = enrichment.get("set_code")
        card_number = enrichment.get("card_number")
        
        if set_code and card_number:
            response = supabase_client.from_("cards").select("id").eq(
                "set_code", set_code
            ).eq(
                "card_number", card_number
            ).limit(1).execute()
            
            if response.data:
                print(f"✅ Found existing card: {enrichment['card_name']} ({set_code} {card_number})")
                return response.data[0]["id"]
        
        # Fallback: try to find by name only
        response = supabase_client.from_("cards").select("id").eq(
            "name", enrichment["card_name"]
        ).limit(1).execute()
        
        if response.data:
            print(f"✅ Found existing card by name: {enrichment['card_name']}")
            return response.data[0]["id"]
            
        # Create new card if not found
        new_card = {
            "name": enrichment["card_name"],
            "set_code": enrichment.get("set_code"),
            "set_name": enrichment.get("set_name"),
            "card_number": enrichment.get("card_number"),
            "rarity": enrichment.get("rarity"),
            "market_price": enrichment.get("estimated_price"),
            "price_updated_at": "now()"
        }
        
        response = supabase_client.from_("cards").insert(new_card).select("id").execute()
        if response.data:
            print(f"✅ Created new card: {enrichment['card_name']} ({set_code} {card_number})")
            return response.data[0]["id"]
            
    except Exception as e:
        print(f"⚠️ Error finding/creating card: {e}")
        
    return None

def get_tile_source(tile_index: int) -> str:
    """
    Convert 3x3 tile index (0-8) to grid position (A1-C3)
    ✏️ Returns char(2) format as expected by database constraint
    """
    if tile_index < 0 or tile_index > 8:
        return "??"
    
    row = chr(ord('A') + (tile_index // 3))  # A, B, C
    col = str((tile_index % 3) + 1)          # 1, 2, 3
    return f"{row}{col}"

def run_normalized_pipeline(job: dict, model: YOLO):
    """
    Improved pipeline using normalized architecture with expert optimizations:
    1. Create scan record
    2. Run detection + create crops
    3. For each crop: detect -> enrich -> record ownership
    """
    # Extract job data (from legacy job_queue structure)
    upload_id = job['scan_upload_id']
    storage_path = job.get('payload', {}).get('storage_path')
    if not storage_path:
        raise ValueError(f"Job {job['id']} is missing 'storage_path' in payload.")
        
    # Get user_id from scan_uploads table (transition helper)
    legacy_scan = supabase_client.from_("scan_uploads").select("user_id, scan_title").eq("id", upload_id).single().execute()
    user_id = legacy_scan.data["user_id"]
    scan_title = legacy_scan.data.get("scan_title", "Untitled Scan")

    print(f"🚀 Starting normalized pipeline for user {user_id}")
    
    # 1. CREATE SCAN RECORD
    print(f"📝 Creating scan record...")
    scan_response = supabase_client.from_("scans").insert({
        "user_id": user_id,
        "title": scan_title,
        "storage_path": storage_path,
        "status": "processing",
        "progress": 10.0  # ✏️ Now supports decimal progress
    }).select("id").single().execute()
    
    scan_id = scan_response.data["id"]
    print(f"✅ Created scan: {scan_id}")

    # 2. DOWNLOAD AND PROCESS IMAGE
    print(f"⬇️ Downloading image: {storage_path}")
    image_bytes = supabase_client.storage.from_(STORAGE_BUCKET).download(storage_path)

    try:
        original_image = Image.open(io.BytesIO(image_bytes))
    except Exception:
        print("⚠️ Standard open failed, attempting HEIC conversion...")
        try:
            heif_file = pillow_heif.read_heif(io.BytesIO(image_bytes))
            original_image = Image.frombytes(heif_file.mode, heif_file.size, heif_file.data, "raw")
            print("✅ HEIC conversion successful.")
        except Exception as heic_error:
            raise Exception(f"Pillow and pillow-heif failed. Error: {heic_error}")

    image = ImageOps.exif_transpose(original_image)
    w, h = image.size
    print(f"📐 Image size: {w}x{h}")

    # Update progress
    supabase_client.from_("scans").update({"progress": 30.0}).eq("id", scan_id).execute()

    # 3. RUN YOLO DETECTION
    detection_image, scale = resize_for_detection(image)
    print(f"🔬 Detecting on resized {detection_image.size}...")
    
    results = model.predict(detection_image, conf=CONFIDENCE_THRESHOLD, verbose=False)
    detections = []
    for r in results:
        for box_data in r.boxes:
            x1, y1, x2, y2 = box_data.xyxy[0].tolist()
            if scale != 1.0:
                x1, y1, x2, y2 = x1/scale, y1/scale, x2/scale, y2/scale
            detections.append({
                'box': [int(x1), int(y1), int(x2), int(y2)],  # ✏️ Convert to ints
                'confidence': box_data.conf[0].item()
            })

    final_detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)[:MAX_REASONABLE_CARDS]
    print(f"Found {len(final_detections)} cards.")

    # Update progress
    supabase_client.from_("scans").update({"progress": 50.0}).eq("id", scan_id).execute()

    # 4. PROCESS EACH DETECTION
    detection_records = []
    user_cards_created = 0
    
    if final_detections:
        summary_img = image.copy()
        draw = ImageDraw.Draw(summary_img)
        font = ImageFont.load_default()

        print(f"🖼️ Processing {len(final_detections)} detections...")
        
        for i, det in enumerate(final_detections):
            # Draw on summary image
            box = det['box']
            draw.rectangle(box, outline="red", width=3)
            draw.text((box[0] + 5, box[1] + 5), f"Card {i+1}", fill="red", font=font)
            
            # Create and upload individual card crop
            card_crop = image.crop(box)
            card_buffer = io.BytesIO()
            card_crop.save(card_buffer, format='JPEG', quality=95)
            card_buffer.seek(0)
            crop_path = f"{scan_id}/crop_{i+1}.jpeg"
            
            supabase_client.storage.from_(STORAGE_BUCKET).upload(
                path=crop_path, 
                file=card_buffer.getvalue(), 
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
            
            # CREATE DETECTION RECORD with improved schema
            detection_data = {
                "scan_id": scan_id,
                "crop_url": crop_path,
                "bbox": [box[0], box[1], box[2] - box[0], box[3] - box[1]],  # ✏️ [x,y,w,h] as int[]
                "confidence": det['confidence'],
                "tile_source": get_tile_source(i % 9)  # ✏️ Mock tile source for now
            }
            
            # ENRICH THE CARD
            print(f"🧠 Enriching card {i+1}...")
            enrichment = mock_enrich_card(crop_path)
            
            # Find or create card in catalog
            card_id = None
            if enrichment.get("success"):
                card_id = find_or_create_card(enrichment)
                detection_data["guess_card_id"] = card_id
            
            # Insert detection record
            detection_response = supabase_client.from_("card_detections").insert(detection_data).select("id").single().execute()
            detection_id = detection_response.data["id"]
            detection_records.append(detection_id)
            
            # CREATE USER CARD OWNERSHIP RECORD
            if card_id:
                user_card_data = {
                    "user_id": user_id,
                    "detection_id": detection_id,
                    "card_id": card_id,
                    "condition": "unknown",
                    "estimated_value": enrichment.get("estimated_price")
                }
                
                supabase_client.from_("user_cards").insert(user_card_data).execute()
                user_cards_created += 1
                print(f"✅ Created user card: {enrichment['card_name']}")
            
            # Update progress incrementally with decimal precision
            progress = 50.0 + (i + 1) / len(final_detections) * 40.0
            supabase_client.from_("scans").update({"progress": round(progress, 1)}).eq("id", scan_id).execute()
        
        # Upload summary image
        summary_buffer = io.BytesIO()
        summary_img.save(summary_buffer, format='JPEG', quality=90)
        summary_buffer.seek(0)
        summary_path = f"{scan_id}/summary.jpeg"
        
        supabase_client.storage.from_(STORAGE_BUCKET).upload(
            path=summary_path, 
            file=summary_buffer.getvalue(), 
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        
        # Update scan as completed
        supabase_client.from_("scans").update({
            "status": "ready",
            "progress": 100.0,
            "summary_image_path": summary_path
        }).eq("id", scan_id).execute()
        
        print("✅ Summary image uploaded and scan completed.")

    return {
        "scan_id": scan_id,
        "total_detections": len(final_detections),
        "user_cards_created": user_cards_created,
        "detection_records": detection_records
    }

# --- Worker Loop (same as before) ---
def fetch_and_lock_job():
    try:
        response = supabase_client.rpc("dequeue_and_start_job").execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"🔥 Error fetching job: {e}")
        return None

def update_job_status(job_id, upload_id, status, error_message=None, results=None):
    try:
        # Update legacy job queue (for compatibility)
        job_update_data = {"status": status}
        if status in ['completed', 'failed']:
             job_update_data['finished_at'] = 'now()'
        supabase_client.from_("job_queue").update(job_update_data).eq("id", job_id).execute()
        
        # Update legacy scan_uploads (for compatibility)
        upload_update_data = {"processing_status": status}
        if error_message:
            upload_update_data["error_message"] = error_message
        if results:
            upload_update_data["results"] = results
        supabase_client.from_("scan_uploads").update(upload_update_data).eq("id", upload_id).execute()
        
        print(f"🔔 Status for job {job_id} updated to {status}.")
    except Exception as e:
        print(f"🔥 Failed to update job/upload status for job {job_id}: {e}")

def main():
    print("🚀 Normalized Worker v2 starting...")
    print("✏️ Using improved schema with better constraints and performance")
    while True:
        job = fetch_and_lock_job()
        if not job:
            print("💤 No jobs found, waiting...")
            time.sleep(10)
            continue

        upload_id = job.get('scan_upload_id')
        job_id = job.get('id')
        print(f"⚙️ Processing job: {job_id} for upload: {upload_id}")

        try:
            pipeline_results = run_normalized_pipeline(job, yolo_model)
            update_job_status(job_id, upload_id, 'completed', results=pipeline_results)
            print(f"✅ Job {job_id} completed successfully.")
            print(f"   📊 Created {pipeline_results['user_cards_created']} user cards from {pipeline_results['total_detections']} detections")
        except Exception as e:
            import traceback
            print(f"🔥 Job {job_id} failed: {e}")
            traceback.print_exc()
            update_job_status(job_id, upload_id, 'failed', error_message=str(e))

if __name__ == "__main__":
    main() 