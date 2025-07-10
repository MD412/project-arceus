#!/usr/bin/env python3
"""
Normalized Card Ownership Worker (v3)
Production-ready version addressing o3 feedback:
- Race condition fixes with upsert operations
- Better error handling and scan status management
- Improved bounding box validation
- Optimized imports and network error handling
"""
import io
import time
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont, ImageOps
from ultralytics import YOLO
from config import supabase_client
from pokemon_tcg_api import identify_card_from_crop
from paddleocr import PaddleOCR
import faiss
import open_clip

# --- Model and Configuration ---
CONFIDENCE_THRESHOLD = 0.25
MAX_IMAGE_SIZE = 2048
MAX_REASONABLE_CARDS = 18
STORAGE_BUCKET = "scans"

def get_yolo_model(model_path='pokemon_cards_trained.pt'):
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

yolo_model = get_yolo_model('worker/pokemon_cards_trained.pt')

def resize_for_detection(image, max_size=MAX_IMAGE_SIZE):
    w, h = image.size
    if max(w, h) <= max_size:
        return image, 1.0
    scale = max_size / max(w, h)
    return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS), scale

def find_or_create_card(enrichment: Dict) -> Optional[str]:
    """
    Find existing card in catalog or create new one using UPSERT for race condition safety
    Returns card_id (UUID)
    """
    if not enrichment.get("success"):
        return None
        
    try:
        set_code = enrichment.get("set_code")
        card_number = enrichment.get("number")
        image_url = enrichment.get("image_url")
        
        new_card = {
            "name": enrichment.get("name"),
            "set_code": set_code,
            "card_number": card_number,
            "image_url": image_url,
            "rarity": enrichment.get("rarity"),
        }

        print("🔵 [DEBUG] Attempting to upsert card with this data:")
        print(new_card)

        response = supabase_client.from_("cards").upsert(
            new_card,
            on_conflict="set_code,card_number"
        ).execute()

        if response.data:
            card_id = response.data[0]["id"]
            action = "found/created" if set_code and card_number else "found/created (by name)"
            print(f"✅ {action} card: {enrichment['name']} ({set_code} {card_number}) -> {card_id}")
            return card_id
            
    except Exception as e:
        print(f"⚠️ Error finding/creating card: {e}")
        
    return None

def safe_bbox_calculation(box: List[int]) -> List[int]:
    """
    ✏️ Ensure bounding box width/height are never negative
    Input: [x1, y1, x2, y2]
    Output: [x, y, w, h] with positive w, h
    """
    x1, y1, x2, y2 = box
    
    # Ensure x2 > x1 and y2 > y1
    if x2 < x1:
        x1, x2 = x2, x1
    if y2 < y1:
        y1, y2 = y2, y1
        
    w = x2 - x1
    h = y2 - y1
    
    # Ensure minimum size
    if w < 1:
        w = 1
    if h < 1:
        h = 1
        
    return [x1, y1, w, h]

def get_tile_source(tile_index: int) -> str:
    """
    Convert detection index to grid position (A1-C3)
    ✏️ TODO: Implement real spatial sorting based on bbox position
    For now, just mock the tile assignment
    """
    if tile_index < 0 or tile_index > 8:
        return "??"
    
    row = chr(ord('A') + (tile_index // 3))  # A, B, C
    col = str((tile_index % 3) + 1)          # 1, 2, 3
    return f"{row}{col}"

def download_image_with_retry(storage_path: str, max_retries: int = 3) -> bytes:
    """
    ✏️ Download image with retry logic for transient network errors
    """
    for attempt in range(max_retries):
        try:
            image_bytes = supabase_client.storage.from_(STORAGE_BUCKET).download(storage_path)
            return image_bytes
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⚠️ Download attempt {attempt + 1} failed: {e}, retrying...")
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise e

def run_normalized_pipeline(job: dict, model: YOLO):
    """
    Production-ready pipeline with proper error handling and race condition fixes
    """
    # Extract job data
    upload_id = job['scan_upload_id']
    storage_path = None
    if job.get('payload') and isinstance(job['payload'], dict):
        storage_path = job['payload'].get('storage_path')

    # Fallback: directly read from scan_uploads if payload missing
    if not storage_path:
        print("⚠️  Job payload missing storage_path, fetching from scan_uploads…")
        legacy_path_resp = supabase_client.from_("scan_uploads").select("storage_path").eq("id", upload_id).single().execute()
        if legacy_path_resp.data:
            storage_path = legacy_path_resp.data.get("storage_path")

    if not storage_path:
        raise ValueError(f"Job {job['id']} has no storage_path in payload or scan_uploads record.")
        
    # Get user_id from scan_uploads table (transition helper)
    legacy_scan = supabase_client.from_("scan_uploads").select("user_id, scan_title").eq("id", upload_id).single().execute()
    user_id = legacy_scan.data["user_id"]
    scan_title = legacy_scan.data.get("scan_title", "Untitled Scan")

    print(f"🚀 Starting normalized pipeline v3 for user {user_id}")
    
    scan_id = None
    try:
        # 1. CREATE SCAN RECORD
        print(f"📝 Creating scan record...")
        scan_response = supabase_client.from_("scans").insert({
            "user_id": user_id,
            "title": scan_title,
            "storage_path": storage_path,
            "status": "processing",
            "progress": 10.0
        }).execute()
        
        scan_id = scan_response.data[0]["id"]
        print(f"✅ Created scan: {scan_id}")

        # 2. DOWNLOAD AND PROCESS IMAGE
        print(f"⬇️ Downloading image: {storage_path}")
        image_bytes = download_image_with_retry(storage_path)

        try:
            original_image = Image.open(io.BytesIO(image_bytes))
        except Exception:
            print("⚠️ Standard open failed, attempting HEIC conversion...")
            try:
                # ✏️ Lazy import for better cold-start performance
                import pillow_heif
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
                    
                # ✏️ Safe bbox calculation with validation
                bbox = safe_bbox_calculation([int(x1), int(y1), int(x2), int(y2)])
                detections.append({
                    'box': [bbox[0], bbox[1], bbox[0] + bbox[2], bbox[1] + bbox[3]],  # Convert back to x1,y1,x2,y2 for cropping
                    'bbox': bbox,  # Store as [x,y,w,h] for database
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
                
                # CREATE DETECTION RECORD
                detection_data = {
                    "scan_id": scan_id,
                    "crop_url": crop_path,
                    "bbox": det['bbox'],  # [x,y,w,h] as int[]
                    "confidence": det['confidence'],
                    "tile_source": get_tile_source(i % 9)
                }
                
                # ENRICH THE CARD
                print(f"🧠 Enriching card {i+1}...")
                enrichment = identify_card_from_crop(crop_path)
                
                # Find or create card in catalog (race-safe)
                card_id = None
                if enrichment.get("success"):
                    card_id = find_or_create_card(enrichment)
                    detection_data["guess_card_id"] = card_id
                
                # Insert detection record
                detection_response = supabase_client.from_("card_detections").insert(detection_data).execute()
                detection_id = detection_response.data[0]["id"]
                detection_records.append(detection_id)
                
                # CREATE USER CARD OWNERSHIP RECORD (with upsert for safety)
                if card_id:
                    user_card_data = {
                        "user_id": user_id,
                        "detection_id": detection_id,
                        "card_id": card_id,
                        "condition": "unknown",
                        "estimated_value": enrichment.get("estimated_value")
                    }
                    
                    # ✏️ Use upsert to prevent duplicate user_cards if scan is re-run
                    try:
                        supabase_client.from_("user_cards").upsert(
                            user_card_data,
                            on_conflict="user_id,card_id"
                        ).execute()
                        user_cards_created += 1
                        print(f"✅ Created/updated user card: {enrichment['name']}")
                    except Exception as e:
                        # If upsert fails, fall back to regular insert
                        print(f"⚠️ Upsert failed, trying insert: {e}")
                        supabase_client.from_("user_cards").insert(user_card_data).execute()
                        user_cards_created += 1
                
                # Update progress incrementally
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
        
    except Exception as e:
        # ✏️ Proper error handling: mark scan as error if it was created
        if scan_id:
            try:
                supabase_client.from_("scans").update({
                    "status": "error",
                    "error_message": str(e)
                }).eq("id", scan_id).execute()
                print(f"🔥 Marked scan {scan_id} as error: {e}")
            except Exception as update_error:
                print(f"🔥 Failed to update scan error status: {update_error}")
        raise e

def save_output_log(job_id: str, results: Dict):
    """Saves a detailed JSON log for a completed job."""
    output_dir = Path("worker/output")
    output_dir.mkdir(exist_ok=True)
    file_path = output_dir / f"{job_id}_result.json"
    with open(file_path, 'w') as f:
        json.dump(results, f, indent=2, sort_keys=True)
    print(f"📄 Saved detailed output log to: {file_path}")

# --- Identifier Cascade Functions (Phase 2 Scaffolding) ---

def run_ocr(image_path: str, ocr_engine: PaddleOCR) -> tuple[str, float]:
    """
    Runs OCR on a cropped card image to extract text.
    Returns a tuple of (detected_text, confidence_score).
    """
    # TODO: Implement actual OCR logic
    print(f"🔩 [STUB] Running OCR on {image_path}")
    # result = ocr_engine.ocr(image_path, cls=True)
    # ... process result ...
    return "", 0.0

def run_clip_knn(image_path: str) -> tuple[str, float]:
    """
    Generates a CLIP embedding for the image and searches a Faiss index.
    Returns a tuple of (best_guess_card_id, similarity_score).
    """
    # TODO: Load CLIP model and Faiss index
    # TODO: Preprocess image and generate embedding
    # TODO: Search Faiss index
    print(f"🔩 [STUB] Running CLIP+Faiss on {image_path}")
    return "", 0.0

# --- Worker Loop ---
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
            # ✏️ Fixed: Use actual timestamp instead of string literal
            from datetime import datetime
            job_update_data['finished_at'] = datetime.utcnow().isoformat()
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
    print("🚀 Normalized Worker v3 starting...")
    print("✏️ Production-ready with race condition fixes and better error handling")
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
            save_output_log(job_id, pipeline_results)
        except Exception as e:
            import traceback
            print(f"🔥 Job {job_id} failed: {e}")
            traceback.print_exc()
            update_job_status(job_id, upload_id, 'failed', error_message=str(e))
            save_output_log(job_id, {"error": str(e), "traceback": traceback.format_exc()})

if __name__ == "__main__":
    main() 