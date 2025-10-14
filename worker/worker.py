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
import os
import sys
import time
import json
from pathlib import Path
import uuid
import hashlib
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta, timezone
import traceback

from PIL import Image, ImageDraw, ImageFont, ImageOps
from ultralytics import YOLO
from config import get_supabase_client
from clip_lookup import CLIPCardIdentifier  # CLIP-only identification
import logging

# ---------------- Logging Setup ----------------
# Stage-by-stage logging with timestamps for observability
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    datefmt="%H:%M:%S"
)
# Reduce noise from verbose third-party libraries
for noisy_logger in ("httpx", "faiss", "faiss.loader", "open_clip"):
    logging.getLogger(noisy_logger).setLevel(logging.WARNING)

logging.info("[OK] Logger initialized")
# ------------------------------------------------

# ---------------- Environment Validation ----------------
REQUIRED_ENV_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]

def startup_env_check():
    """Validate required environment variables are present."""
    from config import load_environment
    load_environment()  # Load .env.local if present
    
    missing = [k for k in REQUIRED_ENV_VARS if not os.getenv(k)]
    if missing:
        logging.error(f"Missing env vars: {', '.join(missing)}")
        logging.error("Please ensure .env.local exists with required variables")
        sys.exit(1)
    
    logging.info("[OK] Environment loaded")
    logging.info(f"   SUPABASE_URL: {os.getenv('NEXT_PUBLIC_SUPABASE_URL')[:40]}...")
    logging.info(f"   SERVICE_KEY: {'*' * 40}... (length: {len(os.getenv('SUPABASE_SERVICE_ROLE_KEY', ''))})")
# --------------------------------------------------------

# --- Production logging: stdout only, no DB logging ---
# Database logging removed for production best practices

# --- Model and Configuration ---
CONFIDENCE_THRESHOLD = 0.25
MAX_IMAGE_SIZE = 2048
MAX_REASONABLE_CARDS = 18
STORAGE_BUCKET = "scans"

def get_yolo_model(model_path=str(Path(__file__).parent / 'pokemon_cards_trained.pt')):
    """Load YOLO model for card detection.

    Resolution order:
      1) Local custom model (pokemon_cards_trained.pt) if present
      2) Hugging Face Hub: zanzoy/pokemon-card-yolo: pokemon_cards_trained.pt
      3) Fallback to base YOLOv8s weights (downloads automatically via Ultralytics)
    """
    logging.info("[..] Loading YOLO model")
    local_path = Path(model_path)
    try:
        if local_path.exists():
            model = YOLO(str(local_path))
            logging.info(f"[OK] YOLO model loaded from local file: {local_path.name}")
            return model
    except Exception as e:
        logging.warning(f"Local model load failed: {e}")

    # Try Hugging Face Hub
    try:
        from huggingface_hub import hf_hub_download  # type: ignore
        repo_id = os.getenv("HF_MODEL_REPO", "zanzoy/pokemon-card-yolo")
        filename = os.getenv("HF_MODEL_FILENAME", "pokemon_cards_trained.pt")
        token = os.getenv("HF_TOKEN")  # optional for private repos
        logging.info(f"[..] Downloading model from Hugging Face: {repo_id}/{filename}")
        hf_path = hf_hub_download(
            repo_id=repo_id,
            filename=filename,
            token=token,
            cache_dir=str(Path(__file__).parent / "hf_cache"),
            local_dir=str(Path(__file__).parent),
            local_dir_use_symlinks=False,
        )
        model = YOLO(str(hf_path))
        logging.info(f"[OK] YOLO model loaded from Hugging Face: {Path(hf_path).name}")
        return model
    except Exception as e:
        logging.warning(f"Hugging Face model load failed: {e}")

    # Final fallback: base yolov8s
    try:
        logging.info("[..] Falling back to base 'yolov8s.pt'")
        model = YOLO('yolov8s.pt')  # Ultralytics will download if missing
        logging.info("[OK] YOLO base model loaded")
        return model
    except Exception as e:
        logging.error(f"Failed to load any YOLO model: {e}")
        sys.exit(1)

def resize_for_detection(image, max_size=MAX_IMAGE_SIZE):
    w, h = image.size
    if max(w, h) <= max_size:
        return image, 1.0
    scale = max_size / max(w, h)
    return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS), scale

# REMOVED: find_or_create_card function - cards already exist in card_embeddings from ETL
# Cards are identified by CLIP and card_id is returned directly

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

def resolve_card_uuid(supabase_client, source: str, external_card_id: str) -> Optional[str]:
    """Resolve an external text card ID (e.g., sv8pt5-160) to internal cards.id (UUID).
    Creates cards on-the-fly from card_embeddings if needed.
    If found in cards, upserts mapping for future fast resolution.
    """
    # 1) Direct mapping via card_keys
    try:
        key_res = (
            supabase_client
            .from_("card_keys")
            .select("card_id")
            .eq("source", source)
            .eq("external_id", external_card_id)
            .single()
            .execute()
        )
        if key_res.data and key_res.data.get("card_id"):
            return key_res.data["card_id"]
    except Exception:
        pass

    # 2) Try to find existing card by vendor id column
    try:
        card_res = (
            supabase_client
            .from_("cards")
            .select("id")
            .eq("pokemon_tcg_api_id", external_card_id)
            .single()
            .execute()
        )
        if card_res.data and card_res.data.get("id"):
            card_uuid = card_res.data["id"]
            # 3) Upsert mapping for next time
            try:
                supabase_client.from_("card_keys").upsert(
                    {"source": source, "external_id": external_card_id, "card_id": card_uuid},
                    on_conflict="source,external_id"
                ).execute()
            except Exception:
                pass
            return card_uuid
    except Exception:
        pass

    # 3) NEW: Create card from card_embeddings if it exists there
    try:
        embedding_res = (
            supabase_client
            .from_("card_embeddings")
            .select("card_id, name, set_code, card_number, rarity, image_url")
            .eq("card_id", external_card_id)
            .single()
            .execute()
        )
        if embedding_res.data:
            emb_data = embedding_res.data
            # Create the card in cards table
            new_card_data = {
                "pokemon_tcg_api_id": emb_data["card_id"],
                "name": emb_data.get("name"),
                "set_code": emb_data.get("set_code"),
                "card_number": emb_data.get("card_number"),
                "rarity": emb_data.get("rarity"),
                "image_urls": {"large": emb_data.get("image_url"), "small": emb_data.get("image_url")} if emb_data.get("image_url") else {}
            }
            card_insert_res = supabase_client.from_("cards").insert(new_card_data).execute()
            if card_insert_res.data and len(card_insert_res.data) > 0:
                card_uuid = card_insert_res.data[0]["id"]
                print(f"[AUTO-CREATE] Created card {emb_data.get('name')} ({external_card_id}) -> {card_uuid}")
                # Upsert mapping for next time
                try:
                    supabase_client.from_("card_keys").upsert(
                        {"source": source, "external_id": external_card_id, "card_id": card_uuid},
                        on_conflict="source,external_id"
                    ).execute()
                except Exception:
                    pass
                return card_uuid
    except Exception as e:
        print(f"[WARN] Failed to auto-create card from embeddings: {e}")
        pass

    return None

def compute_bbox_hash(scan_id: str, bbox: List[int]) -> str:
    base = f"{scan_id}:{bbox[0]}:{bbox[1]}:{bbox[2]}:{bbox[3]}"
    return hashlib.md5(base.encode("utf-8")).hexdigest()

def download_image_with_retry(supabase_client, storage_path: str, max_retries: int = 3) -> bytes:
    for attempt in range(max_retries):
        try:
            image_bytes = supabase_client.storage.from_(STORAGE_BUCKET).download(storage_path)
            return image_bytes
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"[WARN] Download attempt {attempt + 1} failed: {e}, retrying...")
                time.sleep(2 ** attempt)
            else:
                raise e

def run_normalized_pipeline(supabase_client, job: dict, model: YOLO, clip_identifier: CLIPCardIdentifier):
    job_id_for_logging = job.get('job_id')
    print(f"[INFO] Starting pipeline for job: {job_id_for_logging}")

    upload_id = job['scan_upload_id']
    storage_path = job.get('payload', {}).get('storage_path')

    if not storage_path:
        print(f"[INFO] Job payload missing storage_path, fetching from scan_uploads... (job: {job_id_for_logging})")
        legacy_path_resp = supabase_client.from_("scan_uploads").select("storage_path").eq("id", upload_id).execute()
        if legacy_path_resp.data:
            storage_path = legacy_path_resp.data[0].get("storage_path")

    if not storage_path:
        print(f"[ERROR] Job {job_id_for_logging} has no storage_path.")
        raise ValueError(f"Job {job['id']} has no storage_path in payload or scan_uploads record.")
    print(f"[INFO] Got storage_path: {storage_path} (job: {job_id_for_logging})")

    legacy_scan = supabase_client.from_("scan_uploads").select("user_id, scan_title").eq("id", upload_id).execute()
    if not legacy_scan.data:
        raise ValueError(f"No scan upload found for id: {upload_id}")
    user_id, scan_title = legacy_scan.data[0]["user_id"], legacy_scan.data[0].get("scan_title", "Untitled Scan")
    print(f"[INFO] Got user_id: {user_id} (job: {job_id_for_logging})")

    print(f"[START] Starting normalized pipeline v3 for user {user_id}")
    scan_id = None
    try:
        print(f"[INFO] Creating scan record...")
        print(f"[INFO] Attempting to insert into scans table. (job: {job_id_for_logging})")
        
        try:
            scan_response = supabase_client.from_("scans").insert({
                "user_id": user_id, "title": scan_title, "storage_path": storage_path,
                "status": "processing", "progress": 10.0
            }).execute()
            
            if scan_response.data:
                scan_id = scan_response.data[0]["id"]
                print(f"[INFO] Successfully inserted into scans table. (job: {job_id_for_logging}, scan_id: {scan_id})")
            else:
                error_payload = {}
                if hasattr(scan_response, 'error') and scan_response.error:
                    error_payload = {"error": scan_response.error.message, "details": scan_response.error.details}
                print(f"[ERROR] Insert into scans returned no data and no explicit error. (job: {job_id_for_logging}, error: {error_payload})")
                raise ValueError("Failed to create scan record: No data returned.")
        except Exception as insert_exc:
            print(f"[ERROR] Insert into scans failed: {str(insert_exc)}")
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            raise

        logging.info(f"[OK] Created scan: {scan_id}")
        
        logging.info(f"[..] Downloading image: {storage_path}")
        image_bytes = download_image_with_retry(supabase_client, storage_path)
        logging.info(f"[OK] Image downloaded ({len(image_bytes) / 1024:.1f} KB)")
        
        try:
            original_image = Image.open(io.BytesIO(image_bytes))
        except Exception:
            logging.warning("Standard open failed, attempting HEIC conversion...")
            try:
                import pillow_heif
                heif_file = pillow_heif.read_heif(io.BytesIO(image_bytes))
                original_image = Image.frombytes(heif_file.mode, heif_file.size, heif_file.data, "raw")
                logging.info("[OK] HEIC conversion successful")
            except Exception as heic_error:
                raise Exception(f"Pillow and pillow-heif failed. Error: {heic_error}")

        image = ImageOps.exif_transpose(original_image)
        w, h = image.size
        logging.info(f"[OK] Image loaded: {w}x{h} pixels")
        
        supabase_client.from_("scans").update({"progress": 30.0}).eq("id", scan_id).execute()
        detection_image, scale = resize_for_detection(image)
        
        logging.info(f"[..] Detecting cards (YOLO) on {detection_image.size[0]}x{detection_image.size[1]} image")
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
        logging.info(f"[OK] Detection complete: {len(final_detections)} cards found")
        supabase_client.from_("scans").update({"progress": 50.0}).eq("id", scan_id).execute()

        detection_records = []
        user_cards_created = 0
        
        if final_detections:
            summary_img = image.copy()
            draw = ImageDraw.Draw(summary_img)
            font = ImageFont.load_default()
            print(f"[INFO] Processing {len(final_detections)} detections...")
            
            # First, prepare all crops and save them
            card_crops = []
            crop_paths = []
            for i, det in enumerate(final_detections):
                box = det['box']
                draw.rectangle(box, outline="red", width=3)
                draw.text((box[0] + 5, box[1] + 5), f"Card {i+1}", fill="red", font=font)
                card_crop = image.crop(box)
                card_crops.append(card_crop)
                
                # Save crop for storage
                card_buffer = io.BytesIO()
                card_crop.save(card_buffer, format='JPEG', quality=95)
                card_buffer.seek(0)
                crop_path = f"{scan_id}/crop_{i+1}.jpeg"
                supabase_client.storage.from_(STORAGE_BUCKET).upload(
                    path=crop_path, file=card_buffer.getvalue(), 
                    file_options={"content-type": "image/jpeg", "upsert": "true"}
                )
                crop_paths.append(crop_path)
            
            # Batch identify all cards at once
            logging.info(f"[..] Identifying cards (CLIP): {len(card_crops)} cards in batch")
            batch_results = clip_identifier.identify_cards_batch(card_crops, similarity_threshold=0.75)
            logging.info(f"[OK] Identifications complete")
            
            # Process results
            for i, (det, clip_result, crop_path) in enumerate(zip(final_detections, batch_results, crop_paths)):
                # Use CLIP result directly
                if clip_result.get('success'):
                    card_name = clip_result.get('name', '')
                    card_id = clip_result.get('card_id')  # CLIP already provides this!
                    confidence = clip_result.get('confidence', 0.0)
                    logging.info(f"   Card {i+1}: {card_name} ({card_id}) | Similarity: {confidence:.2f}")
                    enrichment = clip_result  # Keep for backward compatibility
                else:
                    card_name = None
                    card_id = None
                    confidence = 0.0
                    enrichment = {'success': False}  # Keep for backward compatibility
                    print(f"   Card {i+1}: No match found")

                # Detection data matching actual card_detections schema
                detection_data = {
                    "scan_id": scan_id, 
                    "crop_url": crop_path, 
                    "bbox": det['bbox'],
                    "confidence": det['confidence'], 
                    "tile_source": get_tile_source(i % 9),
                    "identification_method": 'clip',
                    "identification_cost": 0.0,  # CLIP is free
                    "identification_confidence": confidence
                }
                
                # External guess metadata
                if card_id:
                    detection_data["guess_external_id"] = card_id
                    detection_data["guess_source"] = "clip"  # Changed from "sv_text" to "clip"

                # Resolve external card_id to internal UUID when available via mapping
                resolved_uuid: Optional[str] = None
                if card_id:
                    resolved_uuid = resolve_card_uuid(supabase_client, "clip", card_id)
                    if resolved_uuid:
                        detection_data["guess_card_id"] = resolved_uuid
                    # If no UUID resolved, we don't set guess_card_id at all

                # Idempotency key
                detection_data["bbox_hash"] = compute_bbox_hash(scan_id, det['bbox'])
                
                # Try upsert with AI columns first, fallback to basic columns or without guess_card_id if schema mismatch
                try:
                    detection_response = supabase_client.from_("card_detections").upsert(
                        detection_data, on_conflict="scan_id,bbox_hash"
                    ).execute()
                except Exception as e:
                    err_msg = str(e)
                    if "identification_confidence" in err_msg or "identification_method" in err_msg:
                        print("[WARN] AI tracking columns not available, using basic schema")
                        basic_data = {k: v for k, v in detection_data.items()
                                      if k not in ['identification_method', 'identification_cost', 'identification_confidence']}
                        detection_response = supabase_client.from_("card_detections").upsert(
                            basic_data, on_conflict="scan_id,bbox_hash"
                        ).execute()
                    elif "invalid input syntax for type uuid" in err_msg or "guess_card_id" in err_msg:
                        print("[WARN] DB expects UUID for guess_card_id. Retrying insert without guess_card_id.")
                        fallback_data = {k: v for k, v in detection_data.items() if k != 'guess_card_id'}
                        detection_response = supabase_client.from_("card_detections").upsert(
                            fallback_data, on_conflict="scan_id,bbox_hash"
                        ).execute()
                    else:
                        raise e
                
                if not detection_response.data:
                    raise ValueError("Failed to insert detection record")
                detection_id = detection_response.data[0]["id"]
                detection_records.append(detection_id)
                
                # Only create user_cards when we have a valid UUID for the card
                if resolved_uuid:  # Use the resolved UUID, not the external card_id
                    user_card_data = {
                        "user_id": user_id,
                        "detection_id": detection_id,
                        "card_id": resolved_uuid,  # Use the UUID
                        "condition": "unknown",
                        "estimated_value": enrichment.get("estimated_value")
                    }
                    try:
                        # Use upsert with the proper constraint that now exists
                        supabase_client.from_("user_cards").upsert(
                            user_card_data, 
                            on_conflict="user_id,card_id"
                        ).execute()
                        user_cards_created += 1
                        print(f"[OK] Created/updated user card: {card_name}")
                    except Exception as e:
                        print(f"[WARN] Failed to create user_card for {card_name}: {e}")
                elif card_id:
                    print(f"[INFO] Skipping user_cards creation for {card_name} ({card_id}) - no UUID mapping found")
                
                progress = 50.0 + (i + 1) / len(final_detections) * 40.0
                supabase_client.from_("scans").update({"progress": round(progress, 1)}).eq("id", scan_id).execute()
            
            logging.info("[..] Uploading results + writing DB")
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
            logging.info("[OK] Results uploaded")
            
            # Update scan_uploads status so it shows in scan history
            try:
                supabase_client.from_("scan_uploads").update({
                    "processing_status": "review_pending"
                }).eq("id", job["scan_upload_id"]).execute()
                logging.info(f"   Updated scan_uploads status to review_pending")
            except Exception as status_err:
                logging.warning(f"Failed to update scan_uploads status: {status_err}")

        return {
            "scan_id": scan_id, "total_detections": len(final_detections),
            "user_cards_created": user_cards_created, "detection_records": detection_records,
            "summary_image_path": summary_path if final_detections else None, "status": "ready"
        }
        
    except Exception as e:
        if scan_id:
            try:
                supabase_client.from_("scans").update({"status": "error", "error_message": str(e)}).eq("id", scan_id).execute()
                print(f"[ERROR] Marked scan {scan_id} as error: {e}")
            except Exception as update_error:
                print(f"[ERROR] Failed to update scan error status: {update_error}")
            print(f"[ERROR] Pipeline failed: {str(e)} (job: {job_id_for_logging})")
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise e

def save_output_log(job_id: str, results: Dict):
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    file_path = output_dir / f"{job_id}_result.json"
    with open(file_path, 'w') as f:
        json.dump(results, f, indent=2, sort_keys=True)
    print(f"[LOG] Saved detailed output log to: {file_path}")


# Heartbeat functionality removed - use external monitoring instead

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
        
        print(f"[REQUEUE] Found {len(stale_jobs)} stale jobs to requeue...")
        
        for job_id, job_data in stale_jobs.items():
            retry_count = job_data.get('retry_count', 0)
            scan_upload_id = job_data.get('scan_upload_id')
            
            # Check retry limit (max 3 auto-retries)
            if retry_count >= 3:
                print(f"  [FAIL] Job {job_id} exceeded retry limit, marking as failed")
                # Mark as permanently failed
                supabase_client.from_("job_queue").update({
                    "status": "failed", 
                                            "completed_at": now_iso
                }).eq("id", job_id).execute()
                
                # Update scan status
                if scan_upload_id:
                    supabase_client.from_("scan_uploads").update({
                        "processing_status": "failed",
                        "error_message": "Processing failed after multiple retries"
                    }).eq("id", scan_upload_id).execute()
            else:
                # Increment retry and requeue
                print(f"  [RETRY] Re-queuing job {job_id} (retry {retry_count + 1})")
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
        print(f"[WARN] Requeue stale jobs failed: {e}")
        # Duplicate log line removed

def fetch_and_lock_job(supabase_client):
    try:
        response = supabase_client.rpc("dequeue_and_start_job").execute()
        job = response.data[0] if response.data else None
        if job:
            try:
                supabase_client.from_("job_queue").update({"visibility_timeout_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()}).eq("id", job["job_id"]).execute()
            except Exception as e:
                print(f"[WARN] Failed to set visibility_timeout_at: {e}")
        return job
    except Exception as e:
        print(f"[ERROR] Error fetching job: {e}")
        return None

def update_job_status(supabase_client, job_id, upload_id, status, error_message=None, results=None):
    try:
        # Map processing_status to job_status for job_queue table
        job_status_map = {
            'queued': 'pending',
            'processing': 'processing', 
            'review_pending': 'completed',  # Job is done, scan is ready for review
            'completed': 'completed',
            'failed': 'failed',
            'timeout': 'timeout',
            'cancelled': 'failed'
        }
        
        job_status = job_status_map.get(status, 'completed')
        job_update_data = {"status": job_status, "visibility_timeout_at": None}
        if job_status in ['completed', 'failed']:
            job_update_data['completed_at'] = datetime.now(timezone.utc).isoformat()
            job_update_data['started_at'] = None
        supabase_client.from_("job_queue").update(job_update_data).eq("id", job_id).execute()
        
        # Avoid setting a status that may propagate to scans.status illegally
        upload_processing_status = status
        if status == 'review_pending':
            # scan is effectively ready for review; map to 'ready' for base table compatibility
            upload_processing_status = 'ready'

        upload_update_data = {"processing_status": upload_processing_status}
        if error_message:
            upload_update_data["error_message"] = error_message
        # Avoid writing to non-updatable view column `results`
        # Carry over summary image if available
        if results and results.get("summary_image_path"):
            upload_update_data["summary_image_path"] = results["summary_image_path"]

        supabase_client.from_("scan_uploads").update(upload_update_data).eq("id", upload_id).execute()
        print(f"[UPDATE] Status for job {job_id} updated to {status}.")
    except Exception as e:
        print(f"[ERROR] Failed to update job/upload status for job {job_id}: {e}")

def main():
    """Main worker loop."""
    logging.info("=" * 60)
    logging.info("[START] Normalized Worker v3 starting...")
    logging.info("=" * 60)
    
    # Validate environment first
    startup_env_check()
    
    # Load YOLO model
    yolo_model = get_yolo_model()
    
    # Initialize Supabase client and CLIP identifier once at startup
    try:
        logging.info("[..] Connecting to Supabase")
        supabase_client = get_supabase_client()
        logging.info("[OK] Supabase connected")
        
        # Initialize CLIP-only identification system
        logging.info("[..] Initializing CLIP identifier")
        clip_identifier = CLIPCardIdentifier(supabase_client=supabase_client)
        logging.info("[OK] CLIP identifier initialized")
        
        logging.info("=" * 60)
        logging.info("[OK] Worker initialized successfully, starting main loop...")
        logging.info("=" * 60)
    except Exception as e:
        logging.error(f"Failed to initialize worker: {e}")
        traceback.print_exc()
        return
    
    while True:
        try:
            # Heartbeat removed - use external monitoring
            requeue_stale_jobs(supabase_client)
            job = fetch_and_lock_job(supabase_client)
            if not job:
                logging.info("[WAIT] No jobs found, waiting...")
                time.sleep(10)
                continue

            job_id, upload_id = job.get('job_id'), job.get('scan_upload_id')
            logging.info("=" * 60)
            logging.info(f"[OK] Job dequeued: {job_id}")
            logging.info(f"   Upload ID: {upload_id}")
            
            try:
                pipeline_results = run_normalized_pipeline(supabase_client, job, yolo_model, clip_identifier)
                
                logging.info("[..] Finalizing job")
                update_job_status(supabase_client, job_id, upload_id, 'review_pending', results=pipeline_results)
                logging.info("[OK] Job finalized")
                
                if pipeline_results:
                    logging.info(f"[STATS] Created {pipeline_results.get('user_cards_created', 0)} user cards from {pipeline_results.get('total_detections', 0)} detections")
                
                save_output_log(job_id, pipeline_results)
                logging.info(f"[COMPLETE] Job {job_id} completed successfully")
                logging.info("=" * 60)
            except Exception as e:
                logging.error(f"Job {job_id} failed: {e}")
                traceback.print_exc()
                update_job_status(supabase_client, job_id, upload_id, 'failed', error_message=str(e))
                save_output_log(job_id, {"error": str(e), "traceback": traceback.format_exc()})

        except Exception as e:
            logging.critical(f"A critical error occurred in the main loop: {e}")
            logging.critical("This might be due to missing env vars or a DB connection issue.")
            logging.critical("Waiting for 30 seconds before retrying...")
            time.sleep(30)

if __name__ == "__main__":
    main()