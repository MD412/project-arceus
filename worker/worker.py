#!/usr/bin/env python3
"""
Normalized Card Ownership Worker (v3)
Production-ready version addressing o3 feedback:
- Race condition fixes with scan status management
- Improved bounding box validation
- Optimized imports and network error handling
- Delayed client initialization to gracefully handle env var errors
"""
import io
import time
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta, timezone
import traceback

from PIL import Image, ImageDraw, ImageFont, ImageOps
from ultralytics import YOLO
from config import get_supabase_client
from hybrid_card_identifier_v2 import HybridCardIdentifierV2  # Premium AI vision
from paddleocr import PaddleOCR
import faiss
import open_clip

# --- Custom Logger ---
def log_to_db(supabase_client, message: str, payload: Optional[Dict] = None):
    """Inserts a log message into the worker_logs table."""
    if not supabase_client:
        print(f"!!! No Supabase client, cannot log to DB: {message}")
        return
    try:
        supabase_client.from_("worker_logs").insert({
            "message": message,
            "payload": payload or {}
        }).execute()
    except Exception as e:
        print(f"!!! Failed to log to DB: {e}")

# --- Model and Configuration ---
CONFIDENCE_THRESHOLD = 0.25
MAX_IMAGE_SIZE = 2048
MAX_REASONABLE_CARDS = 18
STORAGE_BUCKET = "scans"

def get_yolo_model(model_path=str(Path(__file__).parent / 'pokemon_cards_trained.pt')):
    model_path = Path(model_path)
    if not model_path.exists():
        print(f"❌ Trained model not found at: {model_path}")
        exit(1)
    try:
        model = YOLO(str(model_path))
        print("✅ YOLO model loaded.")
        return model
    except Exception as e:
        print(f"🔥 Failed to load YOLO model: {e}")
        exit(1)

def resize_for_detection(image, max_size=MAX_IMAGE_SIZE):
    w, h = image.size
    if max(w, h) <= max_size:
        return image, 1.0
    scale = max_size / max(w, h)
    return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS), scale

def find_or_create_card(supabase_client, enrichment: Dict) -> Optional[str]:
    if not enrichment.get("success"):
        return None
    try:
        set_code = enrichment.get("set_code")
        card_number = enrichment.get("number")
        image_url = enrichment.get("image_url")
        new_card = {
            "name": enrichment.get("name"), "set_code": set_code, "card_number": card_number,
            "image_url": image_url, "rarity": enrichment.get("rarity"),
        }
        response = supabase_client.from_("cards").upsert(new_card, on_conflict="set_code,card_number").execute()
        if response.data:
            card_id = response.data[0]["id"]
            action = "found/created" if set_code and card_number else "found/created (by name)"
            print(f"✅ {action} card: {enrichment['name']} ({set_code} {card_number}) -> {card_id}")
            return card_id
        else:
            print(f"⚠️ Upsert returned no data for card: {enrichment['name']}")
            return None
    except Exception as e:
        print(f"⚠️ Error finding/creating card: {e}")
    return None

def safe_bbox_calculation(box: List[int]) -> List[int]:
    x1, y1, x2, y2 = box
    if x2 < x1: x1, x2 = x2, x1
    if y2 < y1: y1, y2 = y2, y1
    w, h = x2 - x1, y2 - y1
    if w < 1: w = 1
    if h < 1: h = 1
    return [x1, y1, w, h]

def get_tile_source(tile_index: int) -> str:
    if tile_index < 0 or tile_index > 8: return "??"
    row = chr(ord('A') + (tile_index // 3))
    col = str((tile_index % 3) + 1)
    return f"{row}{col}"

def map_hybrid_to_worker_format(hybrid_result: Dict) -> Dict:
    """Map HybridCardIdentifierV2 response to legacy worker format"""
    if hybrid_result.get('success'):
        card = hybrid_result['card']
        return {
            'success': True,
            'name': card['name'],
            'set_code': card.get('set_code'),
            'number': card.get('number'),
            'confidence': card['confidence'],
            'method': hybrid_result['method'],
            'cost_usd': hybrid_result['cost_usd'],
            # Legacy fields for compatibility
            'card_id': card.get('id'),
            'image_url': None,  # Not provided by hybrid system
            'rarity': None,     # Not provided by hybrid system
            'estimated_value': None  # Not provided by hybrid system
        }
    else:
        return {
            'success': False,
            'method': hybrid_result.get('method', 'failed'),
            'cost_usd': hybrid_result.get('cost_usd', 0.0),
            'error': hybrid_result.get('error', 'Unknown error')
        }

def download_image_with_retry(supabase_client, storage_path: str, max_retries: int = 3) -> bytes:
    for attempt in range(max_retries):
        try:
            image_bytes = supabase_client.storage.from_(STORAGE_BUCKET).download(storage_path)
            return image_bytes
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⚠️ Download attempt {attempt + 1} failed: {e}, retrying...")
                time.sleep(2 ** attempt)
            else:
                raise e

def run_normalized_pipeline(supabase_client, job: dict, model: YOLO, hybrid_identifier: HybridCardIdentifierV2):
    job_id_for_logging = job.get('id')
    log_to_db(supabase_client, f"Starting pipeline", {"job_id": job_id_for_logging})

    upload_id = job['scan_upload_id']
    storage_path = job.get('payload', {}).get('storage_path')

    if not storage_path:
        log_to_db(supabase_client, f"Job payload missing storage_path, fetching from scan_uploads…", {"job_id": job_id_for_logging})
        legacy_path_resp = supabase_client.from_("scan_uploads").select("storage_path").eq("id", upload_id).execute()
        if legacy_path_resp.data:
            storage_path = legacy_path_resp.data[0].get("storage_path")

    if not storage_path:
        log_to_db(supabase_client, f"Job {job_id_for_logging} has no storage_path.", {"job_id": job_id_for_logging})
        raise ValueError(f"Job {job['id']} has no storage_path in payload or scan_uploads record.")
    log_to_db(supabase_client, f"Got storage_path: {storage_path}", {"job_id": job_id_for_logging})

    legacy_scan = supabase_client.from_("scan_uploads").select("user_id, scan_title").eq("id", upload_id).execute()
    if not legacy_scan.data:
        raise ValueError(f"No scan upload found for id: {upload_id}")
    user_id, scan_title = legacy_scan.data[0]["user_id"], legacy_scan.data[0].get("scan_title", "Untitled Scan")
    log_to_db(supabase_client, f"Got user_id: {user_id}", {"job_id": job_id_for_logging, "user_id": user_id})

    print(f"🚀 Starting normalized pipeline v3 for user {user_id}")
    scan_id = None
    try:
        print(f"📝 Creating scan record...")
        log_to_db(supabase_client, "Attempting to insert into scans table.", {"job_id": job_id_for_logging})
        
        try:
            scan_response = supabase_client.from_("scans").insert({
                "user_id": user_id, "title": scan_title, "storage_path": storage_path,
                "status": "processing", "progress": 10.0
            }).execute()
            
            if scan_response.data:
                scan_id = scan_response.data[0]["id"]
                log_to_db(supabase_client, "Successfully inserted into scans table.", {"job_id": job_id_for_logging, "scan_id": scan_id})
            else:
                error_payload = {}
                if hasattr(scan_response, 'error') and scan_response.error:
                    error_payload = {"error": scan_response.error.message, "details": scan_response.error.details}
                log_to_db(supabase_client, "Insert into scans returned no data and no explicit error.", {"job_id": job_id_for_logging, **error_payload})
                raise ValueError("Failed to create scan record: No data returned.")
        except Exception as insert_exc:
            log_to_db(supabase_client, f"Insert into scans failed: {str(insert_exc)}", {"job_id": job_id_for_logging, "traceback": traceback.format_exc()})
            raise

        print(f"✅ Created scan: {scan_id}")
        image_bytes = download_image_with_retry(supabase_client, storage_path)
        
        try:
            original_image = Image.open(io.BytesIO(image_bytes))
        except Exception:
            print("⚠️ Standard open failed, attempting HEIC conversion...")
            try:
                import pillow_heif
                heif_file = pillow_heif.read_heif(io.BytesIO(image_bytes))
                original_image = Image.frombytes(heif_file.mode, heif_file.size, heif_file.data, "raw")
                print("✅ HEIC conversion successful.")
            except Exception as heic_error:
                raise Exception(f"Pillow and pillow-heif failed. Error: {heic_error}")

        image = ImageOps.exif_transpose(original_image)
        w, h = image.size
        print(f"📐 Image size: {w}x{h}")
        
        supabase_client.from_("scans").update({"progress": 30.0}).eq("id", scan_id).execute()
        detection_image, scale = resize_for_detection(image)
        print(f"🔬 Detecting on resized {detection_image.size}...")
        results = model.predict(detection_image, conf=CONFIDENCE_THRESHOLD, verbose=False)
        detections = []
        for r in results:
            for box_data in r.boxes:
                x1, y1, x2, y2 = box_data.xyxy[0].tolist()
                if scale != 1.0:
                    x1, y1, x2, y2 = x1/scale, y1/scale, x2/scale, y2/scale
                bbox = safe_bbox_calculation([int(x1), int(y1), int(x2), int(y2)])
                detections.append({
                    'box': [bbox[0], bbox[1], bbox[0] + bbox[2], bbox[1] + bbox[3]],
                    'bbox': bbox, 'confidence': box_data.conf[0].item()
                })

        final_detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)[:MAX_REASONABLE_CARDS]
        print(f"Found {len(final_detections)} cards.")
        supabase_client.from_("scans").update({"progress": 50.0}).eq("id", scan_id).execute()

        detection_records = []
        user_cards_created = 0
        
        if final_detections:
            summary_img = image.copy()
            draw = ImageDraw.Draw(summary_img)
            font = ImageFont.load_default()
            print(f"🖼️ Processing {len(final_detections)} detections...")
            
            for i, det in enumerate(final_detections):
                box = det['box']
                draw.rectangle(box, outline="red", width=3)
                draw.text((box[0] + 5, box[1] + 5), f"Card {i+1}", fill="red", font=font)
                card_crop = image.crop(box)
                card_buffer = io.BytesIO()
                card_crop.save(card_buffer, format='JPEG', quality=95)
                card_buffer.seek(0)
                crop_path = f"{scan_id}/crop_{i+1}.jpeg"
                supabase_client.storage.from_(STORAGE_BUCKET).upload(
                    path=crop_path, file=card_buffer.getvalue(), 
                    file_options={"content-type": "image/jpeg", "upsert": "true"}
                )
                
                local_crop_path = f"/tmp/crop_{scan_id}_{i+1}.jpeg"
                with open(local_crop_path, 'wb') as f:
                    f.write(card_buffer.getvalue())
                
                print(f"🧠 Identifying card {i+1} with Premium AI Vision...")
                hybrid_result = hybrid_identifier.identify_card(local_crop_path)
                
                # Map hybrid result to legacy enrichment format
                enrichment = map_hybrid_to_worker_format(hybrid_result)
                
                # Log AI vision performance
                print(f"   Method: {hybrid_result.get('method', 'unknown')} | Cost: ${hybrid_result.get('cost_usd', 0.0):.4f}")
                if hybrid_result.get('success'):
                    card = hybrid_result['card']
                    print(f"   ✅ Identified: {card['name']} | Confidence: {card['confidence']:.2f}")
                else:
                    print(f"   ❌ Failed: {hybrid_result.get('error', 'Unknown error')}")
                
                import os
                os.remove(local_crop_path)

                # Base detection data (always compatible)
                detection_data = {
                    "scan_id": scan_id, "crop_url": crop_path, "bbox": det['bbox'],
                    "confidence": det['confidence'], "tile_source": get_tile_source(i % 9),
                    # AI Vision tracking (new columns) - will gracefully fail if not available
                    "identification_method": hybrid_result.get('method', 'unknown'),
                    "identification_cost": hybrid_result.get('cost_usd', 0.0),
                    "identification_confidence": hybrid_result['card']['confidence'] if hybrid_result.get('success') else 0.0
                }
                
                is_blank = det['confidence'] < 0.3 or not enrichment.get("success")
                detection_data["is_blank"] = is_blank
                card_id = None
                if enrichment.get("success"):
                    card_id = find_or_create_card(supabase_client, enrichment)
                    detection_data["guess_card_id"] = card_id
                
                # Try insert with AI columns first, fallback to basic columns if schema not updated
                try:
                    detection_response = supabase_client.from_("card_detections").insert(detection_data).execute()
                except Exception as e:
                    if "identification_confidence" in str(e) or "identification_method" in str(e):
                        print("⚠️ AI tracking columns not available, using basic schema")
                        # Remove AI tracking columns and retry
                        basic_data = {k: v for k, v in detection_data.items() 
                                     if k not in ['identification_method', 'identification_cost', 'identification_confidence']}
                        detection_response = supabase_client.from_("card_detections").insert(basic_data).execute()
                    else:
                        raise e
                
                if not detection_response.data:
                    raise ValueError("Failed to insert detection record")
                detection_id = detection_response.data[0]["id"]
                detection_records.append(detection_id)
                
                if card_id:
                    user_card_data = {
                        "user_id": user_id, "detection_id": detection_id, "card_id": card_id,
                        "condition": "unknown", "estimated_value": enrichment.get("estimated_value")
                    }
                    try:
                        supabase_client.from_("user_cards").upsert(user_card_data, on_conflict="user_id,card_id").execute()
                        user_cards_created += 1
                        print(f"✅ Created/updated user card: {enrichment['name']}")
                    except Exception as e:
                        print(f"⚠️ Upsert failed, trying insert: {e}")
                        supabase_client.from_("user_cards").insert(user_card_data).execute()
                        user_cards_created += 1
                
                progress = 50.0 + (i + 1) / len(final_detections) * 40.0
                supabase_client.from_("scans").update({"progress": round(progress, 1)}).eq("id", scan_id).execute()
            
            summary_buffer = io.BytesIO()
            summary_img.save(summary_buffer, format='JPEG', quality=90)
            summary_buffer.seek(0)
            summary_path = f"{scan_id}/summary.jpeg"
            supabase_client.storage.from_(STORAGE_BUCKET).upload(
                path=summary_path, file=summary_buffer.getvalue(), 
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
            
            supabase_client.from_("scans").update({
                "status": "ready", "progress": 100.0, "summary_image_path": summary_path
            }).eq("id", scan_id).execute()
            print("✅ Summary image uploaded and scan completed.")

        return {
            "scan_id": scan_id, "total_detections": len(final_detections),
            "user_cards_created": user_cards_created, "detection_records": detection_records
        }
        
    except Exception as e:
        if scan_id:
            try:
                supabase_client.from_("scans").update({"status": "error", "error_message": str(e)}).eq("id", scan_id).execute()
                print(f"🔥 Marked scan {scan_id} as error: {e}")
            except Exception as update_error:
                print(f"🔥 Failed to update scan error status: {update_error}")
        log_to_db(supabase_client, f"Pipeline failed: {str(e)}", {"job_id": job_id_for_logging, "traceback": traceback.format_exc()})
        raise e

def save_output_log(job_id: str, results: Dict):
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    file_path = output_dir / f"{job_id}_result.json"
    with open(file_path, 'w') as f:
        json.dump(results, f, indent=2, sort_keys=True)
    print(f"📄 Saved detailed output log to: {file_path}")

def run_ocr(image_path: str, ocr_engine: PaddleOCR) -> tuple[str, float]:
    print(f"🔩 [STUB] Running OCR on {image_path}")
    return "", 0.0

def run_clip_knn(image_path: str) -> tuple[str, float]:
    print(f"🔩 [STUB] Running CLIP+Faiss on {image_path}")
    return "", 0.0

def send_heartbeat(supabase_client):
    try:
        supabase_client.from_("worker_health").upsert({"id": "primary", "last_heartbeat": datetime.now(timezone.utc).isoformat()}, on_conflict="id").execute()
    except Exception as e:
        print(f"⚠️ Heartbeat failed: {e}")
        supabase_client.from_("worker_health").insert({"id": "primary", "last_heartbeat": datetime.now(timezone.utc).isoformat()}).execute()

def requeue_stale_jobs(supabase_client):
    """Enhanced stale job recovery with retry tracking"""
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Find jobs stuck by timeout
        stale_by_timeout = supabase_client.from_("job_queue").select("id, retry_count, scan_upload_id").in_("status", ["processing"]).lte("visibility_timeout_at", now_iso).execute().data or []
        
        # Find jobs stuck by time (15+ minutes)
        fifteen_mins_ago = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
        stale_by_time = supabase_client.from_("job_queue").select("id, retry_count, scan_upload_id").in_("status", ["processing"]).lte("started_at", fifteen_mins_ago).execute().data or []
        
        # Combine unique stale jobs
        stale_jobs = {j['id']: j for j in stale_by_timeout}
        for j in stale_by_time:
            stale_jobs[j['id']] = j
        
        if not stale_jobs: 
            return
        
        print(f"🔄 Found {len(stale_jobs)} stale jobs to requeue...")
        
        for job_id, job_data in stale_jobs.items():
            retry_count = job_data.get('retry_count', 0)
            scan_upload_id = job_data.get('scan_upload_id')
            
            # Check retry limit (max 3 auto-retries)
            if retry_count >= 3:
                print(f"  ❌ Job {job_id} exceeded retry limit, marking as failed")
                # Mark as permanently failed
                supabase_client.from_("job_queue").update({
                    "status": "failed", 
                    "finished_at": now_iso,
                    "error_message": "Exceeded automatic retry limit"
                }).eq("id", job_id).execute()
                
                # Update scan status
                if scan_upload_id:
                    supabase_client.from_("scan_uploads").update({
                        "processing_status": "failed",
                        "error_message": "Processing failed after multiple retries"
                    }).eq("id", scan_upload_id).execute()
            else:
                # Increment retry and requeue
                print(f"  🔄 Re-queuing job {job_id} (retry {retry_count + 1})")
                supabase_client.from_("job_queue").update({
                    "status": "pending", 
                    "started_at": None, 
                    "visibility_timeout_at": None, 
                    "picked_at": None,
                    "retry_count": retry_count + 1
                }).eq("id", job_id).execute()
                
                # Reset scan status
                if scan_upload_id:
                    supabase_client.from_("scan_uploads").update({
                        "processing_status": "queued",
                        "error_message": None
                    }).eq("id", scan_upload_id).execute()
                    
    except Exception as e:
        print(f"⚠️ Requeue stale jobs failed: {e}")
        log_to_db(supabase_client, f"Stale job requeue failed: {str(e)}", {"error": str(e)})

def fetch_and_lock_job(supabase_client):
    try:
        response = supabase_client.rpc("dequeue_and_start_job").execute()
        job = response.data[0] if response.data else None
        if job:
            try:
                supabase_client.from_("job_queue").update({"visibility_timeout_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()}).eq("id", job["id"]).execute()
            except Exception as e:
                print(f"⚠️ Failed to set visibility_timeout_at: {e}")
        return job
    except Exception as e:
        print(f"🔥 Error fetching job: {e}")
        return None

def update_job_status(supabase_client, job_id, upload_id, status, error_message=None, results=None):
    try:
        job_update_data = {"status": status, "visibility_timeout_at": None}
        if status in ['completed', 'failed']:
            job_update_data['finished_at'] = datetime.now(timezone.utc).isoformat()
            job_update_data['started_at'] = None
        supabase_client.from_("job_queue").update(job_update_data).eq("id", job_id).execute()
        upload_update_data = {"processing_status": status}
        if error_message: upload_update_data["error_message"] = error_message
        if results: upload_update_data["results"] = results
        supabase_client.from_("scan_uploads").update(upload_update_data).eq("id", upload_id).execute()
        print(f"🔔 Status for job {job_id} updated to {status}.")
    except Exception as e:
        print(f"🔥 Failed to update job/upload status for job {job_id}: {e}")

def main():
    print("🚀 Normalized Worker v3 starting…")
    yolo_model = get_yolo_model()
    
    # Initialize Supabase client and hybrid identifier once at startup
    try:
        supabase_client = get_supabase_client()
        
        # Initialize premium AI vision system
        print("🧠 Initializing Hybrid AI Vision (CLIP + GPT-4o Mini)...")
        hybrid_identifier = HybridCardIdentifierV2(
            supabase_client=supabase_client,
            gpt_daily_budget=0.10  # Production budget: $0.10/day
        )
        print("✅ Premium AI vision system ready!")
        print("✅ Worker initialized successfully, starting main loop...")
    except Exception as e:
        print(f"🔥 Failed to initialize worker: {e}")
        return
    
    while True:
        try:
            send_heartbeat(supabase_client)
            requeue_stale_jobs(supabase_client)
            job = fetch_and_lock_job(supabase_client)
            if not job:
                print("💤 No jobs found, waiting...")
                time.sleep(10)
                continue

            job_id, upload_id = job.get('id'), job.get('scan_upload_id')
            print(f"⚙️ Processing job: {job_id} for upload: {upload_id}")
            
            try:
                pipeline_results = run_normalized_pipeline(supabase_client, job, yolo_model, hybrid_identifier)
                update_job_status(supabase_client, job_id, upload_id, 'completed', results=pipeline_results)
                print(f"✅ Job {job_id} completed successfully.")
                if pipeline_results:
                    print(f"   📊 Created {pipeline_results.get('user_cards_created', 0)} user cards from {pipeline_results.get('total_detections', 0)} detections")
                save_output_log(job_id, pipeline_results)
            except Exception as e:
                print(f"🔥 Job {job_id} failed: {e}")
                traceback.print_exc()
                update_job_status(supabase_client, job_id, upload_id, 'failed', error_message=str(e))
                save_output_log(job_id, {"error": str(e), "traceback": traceback.format_exc()})

        except Exception as e:
            print(f"🔥 A critical error occurred in the main loop: {e}")
            print("   This might be due to missing env vars or a DB connection issue.")
            print("   Waiting for 30 seconds before retrying...")
            time.sleep(30)

if __name__ == "__main__":
    main()