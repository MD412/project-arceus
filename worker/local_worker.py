#!/usr/bin/env python3
"""
Local development worker for Project Arceus - Full ML pipeline
Runs the complete vision pipeline with YOLO model for local testing
"""

import time
import io
from PIL import Image, ImageDraw, ImageFont, ImageOps
from pathlib import Path
from ultralytics import YOLO
from config import supabase_client

# --- Configuration ---
CONFIDENCE_THRESHOLD = 0.25
MAX_IMAGE_SIZE = 2048
MAX_REASONABLE_CARDS = 18

def get_yolo_model(model_path='worker/pokemon_cards_trained.pt'):
    """
    Load and return the trained YOLO model.
    """
    print(f"📊 Loading trained model from: {model_path}")
    
    # Check from project root, which is the CWD for the worker
    if not Path(model_path).exists():
         print(f"❌ Trained model not found at: {model_path}")
         print("Please ensure the model file is in the correct location.")
         exit(1)

    try:
        model = YOLO(model_path)
        print("✅ YOLO model loaded (TRAINED VERSION).")
        return model
    except Exception as e:
        print(f"🔥 Failed to load YOLO model: {e}")
        exit(1)

# Initialize model for local use
yolo_model = get_yolo_model()

def resize_for_detection(image, max_size=MAX_IMAGE_SIZE):
    """Resize image for faster processing while maintaining aspect ratio."""
    w, h = image.size
    if max(w, h) <= max_size:
        return image, 1.0
    
    scale = max_size / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    return image.resize((new_w, new_h), Image.Resampling.LANCZOS), scale

def whole_image_pipeline(job):
    """Run YOLO on the entire binder image."""
    print(f"🚀 Running WHOLE IMAGE Pipeline for job: {job['id']}")
    
    input_path = job.get('input_image_path')
    if not input_path:
        raise ValueError("Job missing 'input_image_path'")

    # 1. Download and orient image
    print(f"Downloading image from: {input_path}")
    response = supabase_client.storage.from_("binders").download(input_path)
    original_image = Image.open(io.BytesIO(response))
    fixed_image = ImageOps.exif_transpose(original_image)
    w, h = fixed_image.size
    print(f"📐 Original size: {w}x{h}")

    # 2. Resize for detection
    detection_image, scale_factor = resize_for_detection(fixed_image)
    det_w, det_h = detection_image.size
    print(f"🔍 Detecting on resized image: {det_w}x{det_h}")

    # 3. Run YOLO on the ENTIRE image
    print("🧠 Running YOLO on whole image...")
    results = yolo_model.predict(detection_image, conf=CONFIDENCE_THRESHOLD, verbose=False)
    
    # Extract detections
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

    # NEW: Safety net - auto-relax confidence if recall is too low
    if len(detections) < 4:
        print("⚠️ Low detection count - running 2nd pass with gentler confidence...")
        results = yolo_model.predict(detection_image, conf=0.15, verbose=False)
        
        # Re-extract detections
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
    
    print(f"📊 Total detections: {len(detections)}")

    # 4. Filter tiny boxes and take top detections
    min_card_area = (w * h) * 0.002
    filtered_detections = [d for d in detections if ((d['box'][2] - d['box'][0]) * (d['box'][3] - d['box'][1])) >= min_card_area]
    final_detections = sorted(filtered_detections, key=lambda x: x['confidence'], reverse=True)[:MAX_REASONABLE_CARDS]
    print(f"🎯 Found {len(final_detections)} final detections")

    # 5. Create crops and summary image
    detected_card_paths = []
    summary_image = fixed_image.copy()
    draw = ImageDraw.Draw(summary_image)
    font = ImageFont.load_default()

    for i, detection in enumerate(final_detections):
        box = detection['box']
        card_crop = fixed_image.crop(box)
        card_buffer = io.BytesIO()
        card_crop.save(card_buffer, format='JPEG', quality=95)
        
        card_path = f"results/{job['id']}/card_{i}.jpg"
        supabase_client.storage.from_("binders").upload(card_path, card_buffer.getvalue(), {"content-type": "image/jpeg", "x-upsert": "true"})
        detected_card_paths.append(card_path)
        
        draw.rectangle(box, outline="red", width=5)
        label = f"Card {i+1}: {detection['confidence']:.2f}"
        draw.text((box[0], box[1] - 15), label, fill="red", font=font)

    # 6. Upload summary image
    summary_buffer = io.BytesIO()
    summary_image.save(summary_buffer, format='JPEG', quality=95)
    summary_path = f"results/{job['id']}/summary.jpg"
    supabase_client.storage.from_("binders").upload(summary_path, summary_buffer.getvalue(), {"content-type": "image/jpeg", "x-upsert": "true"})

    return {
        "summary_image_path": summary_path,
        "total_cards_detected": len(final_detections),
        "detected_card_paths": detected_card_paths,
        "processed_at": time.time(),
        "original_image_width": w,
        "original_image_height": h
    }

def fetch_and_lock_job():
    """Atomically fetch and lock the next pending job."""
    try:
        response = supabase_client.rpc("fetch_and_lock_job").execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"🔥 Error fetching job: {e}")
        return None

def main():
    """Main worker loop with startup health check."""
    print("🚀 LOCAL Worker (Whole-Image) starting...")
    
    # --- Startup Health Check ---
    print("🩺 Running startup health check...")
    try:
        # Check Supabase connection
        _ = supabase_client.auth.get_user()
        print("✅ Supabase connection successful.")
        
        # Check model loading
        _ = yolo_model
        print("✅ YOLO model loaded successfully.")
        
    except Exception as e:
        print(f"🔥 Startup health check FAILED: {e}")
        print("Worker will not start. Please resolve the issue.")
        exit(1)
        
    print("✅ Health checks passed. Worker is ready.")
    
    print(f"🎯 Confidence: {CONFIDENCE_THRESHOLD}, Max Size: {MAX_IMAGE_SIZE}px")
    
    while True:
        job = fetch_and_lock_job()
        if job:
            try:
                results = whole_image_pipeline(job)
                
                # Update job_queue table
                supabase_client.from_("job_queue").update({
                    "status": "completed"
                }).eq("id", job["id"]).execute()
                
                # Update binder_page_uploads table
                supabase_client.from_("binder_page_uploads").update({
                    "processing_status": "completed",
                    "results": results
                }).eq("id", job["binder_page_upload_id"]).execute()
                
                print(f"✅ Job {job['id']} completed successfully")
            except Exception as e:
                print(f"🔥 Job {job['id']} failed: {e}")
                
                # Update job_queue table
                supabase_client.from_("job_queue").update({
                    "status": "failed"
                }).eq("id", job["id"]).execute()
                
                # Update binder_page_uploads table
                supabase_client.from_("binder_page_uploads").update({
                    "processing_status": "failed",
                    "error_message": str(e)
                }).eq("id", job["binder_page_upload_id"]).execute()
        else:
            print("💤 No jobs found, waiting...")
            time.sleep(10)

if __name__ == "__main__":
    main() 