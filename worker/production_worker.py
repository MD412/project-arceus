#!/usr/bin/env python3
"""
Production worker for Project Arceus - Full ML Pipeline
- Downloads model from Hugging Face
- Polls for jobs, runs the vision pipeline, and uploads results.
"""
import os
import time
import io
import logging
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
from ultralytics import YOLO
from huggingface_hub import hf_hub_download

from config import supabase_client

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

POLL_INTERVAL = 10  # seconds between empty-queue checks
CONFIDENCE_THRESHOLD = 0.25
MAX_IMAGE_SIZE = 2048
MAX_REASONABLE_CARDS = 18
MODEL_REPO_ID = "zanzoy/alkzm" # Your Hugging Face repo ID
MODEL_FILENAME = "pokemon_cards_trained.pt"
LOCAL_MODEL_PATH = Path("worker") / MODEL_FILENAME

def download_model_if_needed():
    """Downloads the YOLO model from Hugging Face if it doesn't exist locally."""
    if LOCAL_MODEL_PATH.exists():
        logger.info(f"Model '{MODEL_FILENAME}' already exists locally. Skipping download.")
        return
    
    logger.info(f"Model not found locally. Downloading from Hugging Face repo '{MODEL_REPO_ID}'...")
    try:
        hf_token = os.getenv("HUGGING_FACE_TOKEN")
        if not hf_token:
            logger.warning("HUGGING_FACE_TOKEN not set. Trying anonymous download.")
        
        hf_hub_download(
            repo_id=MODEL_REPO_ID,
            filename=MODEL_FILENAME,
            local_dir=LOCAL_MODEL_PATH.parent,
            token=hf_token,
        )
        logger.info("✅ Model downloaded successfully.")
    except Exception as e:
        logger.error(f"🔥 Failed to download model from Hugging Face: {e}")
        logger.error("The worker cannot start without the model. Please check your HUGGING_FACE_TOKEN and repo permissions.")
        exit(1)

def get_yolo_model():
    """Load and return the trained YOLO model."""
    logger.info(f"📊 Loading trained model from: {LOCAL_MODEL_PATH}")
    try:
        model = YOLO(LOCAL_MODEL_PATH)
        logger.info("✅ YOLO model loaded successfully.")
        return model
    except Exception as e:
        logger.error(f"🔥 Failed to load YOLO model: {e}")
        exit(1)

# --- Database Functions ---

def get_next_job():
    """Fetches and locks the next pending job from the queue."""
    try:
        response = supabase_client.from_("job_queue").select("*").eq("status", "pending").order("created_at").limit(1).execute()
        if not response.data:
            return None
        
        job = response.data[0]
        
        # Mark as processing
        supabase_client.from_("job_queue").update({"status": "processing", "started_at": "now()"}).eq("id", job['id']).execute()
        
        # Also update the related binder page upload
        supabase_client.from_("binder_page_uploads").update({"processing_status": "processing"}).eq("id", job['binder_page_upload_id']).execute()

        return job
    except Exception as e:
        logger.error(f"Error getting next job: {e}")
        return None

def update_job_and_upload(job_id, upload_id, status, results=None, error_message=None):
    """Updates the status and results for both the job and the upload."""
    try:
        # Update job_queue
        job_update = {"status": status, "finished_at": "now()"}
        if error_message:
            job_update['error_message'] = error_message
        supabase_client.from_("job_queue").update(job_update).eq("id", job_id).execute()

        # Update binder_page_uploads
        upload_update = {"processing_status": status}
        if results:
            upload_update['results'] = results
        if error_message:
            upload_update['error_message'] = error_message
        supabase_client.from_("binder_page_uploads").update(upload_update).eq("id", upload_id).execute()

    except Exception as e:
        logger.error(f"🔥 Failed to update job/upload status for job {job_id}: {e}")

# --- Image Processing Pipeline ---

def resize_for_detection(image, max_size=MAX_IMAGE_SIZE):
    """Resize image for faster processing while maintaining aspect ratio."""
    w, h = image.size
    if max(w, h) <= max_size:
        return image, 1.0
    scale = max_size / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    return image.resize((new_w, new_h), Image.Resampling.LANCZOS), scale

def run_vision_pipeline(job: dict, model: YOLO):
    """Downloads image, runs YOLO, and returns structured results."""
    upload_id = job['binder_page_upload_id']
    
    # The `enqueue` function now includes storage_path in the job payload
    job_payload = job.get('payload', {})
    input_path = job_payload.get('storage_path')
    
    if not input_path:
        raise ValueError(f"Job {job['id']} is missing 'storage_path' in its payload.")

    logger.info(f"Downloading image from: {input_path}")
    response = supabase_client.storage.from_("binders").download(input_path)
    original_image = Image.open(io.BytesIO(response))
    fixed_image = ImageOps.exif_transpose(original_image)
    w, h = fixed_image.size
    logger.info(f"📐 Original size: {w}x{h}")

    detection_image, scale_factor = resize_for_detection(fixed_image)
    logger.info(f"🧠 Running YOLO on resized image ({detection_image.width}x{detection_image.height})...")
    
    results = model.predict(detection_image, conf=CONFIDENCE_THRESHOLD, verbose=False)
    
    detections = []
    for res in results:
        if res.boxes is not None:
            for box_data in res.boxes:
                x1, y1, x2, y2 = box_data.xyxy[0].tolist()
                confidence = box_data.conf[0].item()
                if scale_factor != 1.0:
                    x1 /= scale_factor; y1 /= scale_factor
                    x2 /= scale_factor; y2 /= scale_factor
                detections.append({'box': [x1, y1, x2, y2], 'confidence': confidence})

    logger.info(f"📊 Found {len(detections)} potential cards.")
    
    min_card_area = (w * h) * 0.002
    filtered_detections = [d for d in detections if ((d['box'][2] - d['box'][0]) * (d['box'][3] - d['box'][1])) >= min_card_area]
    final_detections = sorted(filtered_detections, key=lambda x: x['confidence'], reverse=True)[:MAX_REASONABLE_CARDS]
    logger.info(f"🎯 Found {len(final_detections)} final detections after filtering.")

    if not final_detections:
        return { "total_cards_detected": 0, "summary_image_path": None }

    summary_image = fixed_image.copy()
    draw = ImageDraw.Draw(summary_image)
    try:
      font = ImageFont.truetype("arial.ttf", size=max(15, int(w/100)))
    except IOError:
      font = ImageFont.load_default()

    for i, detection in enumerate(final_detections):
        box = detection['box']
        draw.rectangle(box, outline="red", width=5)
        label = f"Card {i+1}"
        draw.text((box[0], box[1] - (font.size + 5)), label, fill="red", font=font)

    summary_buffer = io.BytesIO()
    summary_image.save(summary_buffer, format='JPEG', quality=90)
    summary_path = f"results/{job['id']}/summary.jpg"
    supabase_client.storage.from_("binders").upload(summary_path, summary_buffer.getvalue(), {"content-type": "image/jpeg", "x-upsert": "true"})
    
    return {
        "summary_image_path": summary_path,
        "total_cards_detected": len(final_detections),
        "processed_at": time.time(),
    }

# --- Main Worker Loop ---

def main():
    """Main worker loop with startup health check."""
    logger.info("🚀 PRODUCTION Worker (Full-ML) starting...")
    
    download_model_if_needed()
    yolo_model = get_yolo_model()
    
    logger.info("✅ Health checks passed. Worker is ready.")
    
    while True:
        job = get_next_job()
        if job:
            job_id = job['id']
            upload_id = job['binder_page_upload_id']
            logger.info(f"⚙️  Processing job {job_id} for upload {upload_id}")
            try:
                pipeline_results = run_vision_pipeline(job, yolo_model)
                update_job_and_upload(job_id, upload_id, 'completed', results=pipeline_results)
                logger.info(f"✅ Job {job_id} completed successfully.")
            except Exception as e:
                logger.error(f"🔥 Job {job_id} failed: {e}", exc_info=True)
                update_job_and_upload(job_id, upload_id, 'failed', error_message=str(e))
        else:
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main() 