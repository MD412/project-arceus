#!/usr/bin/env python3
"""
Local development worker for Project Arceus - Full ML pipeline
"""
import io
import os
import time
from pathlib import Path

import pillow_heif
from PIL import Image, ImageDraw, ImageFont, ImageOps
from ultralytics import YOLO
from config import supabase_client

# --- Model and Configuration ---
CONFIDENCE_THRESHOLD = 0.25
MAX_IMAGE_SIZE = 2048
MAX_REASONABLE_CARDS = 18

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

# --- Image Processing Pipeline ---

def resize_for_detection(image, max_size=MAX_IMAGE_SIZE):
    w, h = image.size
    if max(w, h) <= max_size:
        return image, 1.0
    scale = max_size / max(w, h)
    return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS), scale

def run_pipeline(job: dict, model: YOLO):
    """Main processing pipeline for a single job."""
    upload_id = job['binder_page_upload_id']
    storage_path = job.get('payload', {}).get('storage_path')
    if not storage_path:
        raise ValueError(f"Job {job['id']} is missing 'storage_path' in payload.")

    print(f"⬇️ Downloading image: {storage_path}")
    image_bytes = supabase_client.storage.from_("binders").download(storage_path)

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

    detection_image, scale = resize_for_detection(image)
    print(f"🔬 Detecting on resized {detection_image.size}...")
    
    results = model.predict(detection_image, conf=CONFIDENCE_THRESHOLD, verbose=False)
    detections = []
    for r in results:
        for box_data in r.boxes:
            x1, y1, x2, y2 = box_data.xyxy[0].tolist()
            if scale != 1.0:
                x1, y1, x2, y2 = x1/scale, y1/scale, x2/scale, y2/scale
            detections.append({'box': [x1, y1, x2, y2], 'confidence': box_data.conf[0].item()})

    final_detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)[:MAX_REASONABLE_CARDS]
    print(f"Found {len(final_detections)} cards.")

    summary_image_path = None
    detected_card_paths = []
    if final_detections:
        summary_img = image.copy()
        draw = ImageDraw.Draw(summary_img)
        font = ImageFont.load_default()

        print(f"🖼️ Creating crops and summary image...")
        for i, det in enumerate(final_detections):
            # Draw on summary image
            draw.rectangle(det['box'], outline="red", width=3)
            draw.text((det['box'][0] + 5, det['box'][1] + 5), f"Card {i+1}", fill="red", font=font)
            
            # Create and upload individual card crop
            card_crop = image.crop(det['box'])
            card_buffer = io.BytesIO()
            card_crop.save(card_buffer, format='JPEG', quality=95)
            card_buffer.seek(0)
            card_path = f"{upload_id}/card_{i+1}.jpeg"
            supabase_client.storage.from_("binders").upload(
                path=card_path, file=card_buffer.getvalue(), file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
            detected_card_paths.append(card_path)
        
        # Upload summary image
        summary_buffer = io.BytesIO()
        summary_img.save(summary_buffer, format='JPEG', quality=90)
        summary_buffer.seek(0)
        summary_image_path = f"{upload_id}/summary.jpeg"
        supabase_client.storage.from_("binders").upload(
            path=summary_image_path, file=summary_buffer.getvalue(), file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        print("✅ Summary image and crops uploaded.")

    return {
        "total_cards_detected": len(final_detections), 
        "summary_image_path": summary_image_path,
        "detected_card_paths": detected_card_paths
    }

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
        # First update the job queue itself
        job_update_data = {"status": status}
        if status in ['completed', 'failed']:
             job_update_data['finished_at'] = 'now()'
        supabase_client.from_("job_queue").update(job_update_data).eq("id", job_id).execute()
        
        # Then update the parent upload record
        upload_update_data = {"processing_status": status}
        if error_message:
            upload_update_data["error_message"] = error_message
        if results:
            upload_update_data["results"] = results
        supabase_client.from_("binder_page_uploads").update(upload_update_data).eq("id", upload_id).execute()
        print(f"🔔 Status for job {job_id} updated to {status}.")
    except Exception as e:
        print(f"🔥 Failed to update job/upload status for job {job_id}: {e}")

def main():
    print("🚀 Worker starting...")
    while True:
        job = fetch_and_lock_job()
        if not job:
            print("💤 No jobs found, waiting...")
            time.sleep(10)
            continue

        upload_id = job.get('binder_page_upload_id')
        job_id = job.get('id')
        print(f"⚙️ Processing job: {job_id} for upload: {upload_id}")

        try:
            pipeline_results = run_pipeline(job, yolo_model)
            update_job_status(job_id, upload_id, 'completed', results=pipeline_results)
            print(f"✅ Job {job_id} completed successfully.")
        except Exception as e:
            import traceback
            print(f"🔥 Job {job_id} failed: {e}")
            traceback.print_exc() # Print full stack trace
            update_job_status(job_id, upload_id, 'failed', error_message=str(e))

if __name__ == "__main__":
    main()