import os
import time
import io
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from ultralytics import YOLO
from PIL import Image, ImageDraw, ImageFont, ExifTags
import cv2
import numpy as np
from pathlib import Path

# Load environment variables from .env.local
# This is a common pattern for local development.
# In production, these would be set as environment variables on the server.
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(dotenv_path=dotenv_path, override=True)

# Get Supabase credentials from environment
# The SERVICE_ROLE_KEY is required for the worker to have the necessary
# permissions to bypass RLS and update job statuses.
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Check if credentials are loaded
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Supabase URL and Service Role Key must be set in the environment.")

# Initialize Supabase client
print("Initializing Supabase client...")
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Supabase client initialized successfully.")
except Exception as e:
    print(f"🔥 Failed to initialize Supabase client: {e}")
    exit(1)

# --- Vision Pipeline Configuration ---
YOLO_MODEL_IDENTIFIER = 'yolov8s.pt'
CONFIDENCE_THRESHOLD = 0.25
MODEL = YOLO(YOLO_MODEL_IDENTIFIER)
print("✅ YOLO model loaded.")

# --- Vision Pipeline Helper Functions (adapted from test script) ---

def fix_image_orientation(image):
    try:
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break
        exif = image._getexif()
        if exif is not None:
            orientation_value = exif.get(orientation)
            if orientation_value == 3: image = image.rotate(180, expand=True)
            elif orientation_value == 6: image = image.rotate(270, expand=True)
            elif orientation_value == 8: image = image.rotate(90, expand=True)
    except (AttributeError, KeyError, TypeError): pass
    return image

def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def enhance_tile(tile_pil):
    try:
        tile_bgr = cv2.cvtColor(np.array(tile_pil), cv2.COLOR_RGB2BGR)
        tile_h, tile_w = tile_bgr.shape[:2]
        gray = cv2.cvtColor(tile_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            largest = max(contours, key=cv2.contourArea)
            if cv2.contourArea(largest) > (tile_w * tile_h * 0.1):
                peri = cv2.arcLength(largest, True)
                approx = cv2.approxPolyDP(largest, 0.02 * peri, True)
                if len(approx) == 4:
                    pts = approx.reshape(4, 2).astype("float32")
                    rect = order_points(pts)
                    dst = np.array([[0, 0], [tile_w, 0], [tile_w, tile_h], [0, tile_h]], dtype="float32")
                    M = cv2.getPerspectiveTransform(rect, dst)
                    tile_bgr = cv2.warpPerspective(tile_bgr, M, (tile_w, tile_h))
                    gray = cv2.cvtColor(tile_bgr, cv2.COLOR_BGR2GRAY)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_gray = clahe.apply(gray)
        processed_tile = cv2.cvtColor(enhanced_gray, cv2.COLOR_GRAY2BGR)
        return Image.fromarray(cv2.cvtColor(processed_tile, cv2.COLOR_BGR2RGB))
    except Exception:
        return tile_pil

# --- Main Pipeline Processing Function ---

def process_vision_pipeline(job):
    print(f"Starting vision pipeline for job: {job['id']}")
    input_path = job.get('input_image_path')
    if not input_path:
        raise ValueError("Job is missing 'input_image_path'")

    # 1. Download image from Supabase Storage
    print(f"Downloading image from: {input_path}")
    response = supabase.storage.from_("binders").download(input_path)
    if response is None:
        raise ConnectionError("Failed to download image from storage.")
    
    original_image = Image.open(io.BytesIO(response))
    fixed_image = fix_image_orientation(original_image)
    print(f"Image downloaded and oriented. Size: {fixed_image.size}")

    # 2. Slice and process each tile
    w, h = fixed_image.size
    tile_w, tile_h = w // 3, h // 3
    all_tile_images_with_detections = []
    detected_card_paths = [] # To store paths of individual card crops
    detection_count = 0

    for r in range(3):
        for c in range(3):
            tile_index = r * 3 + c
            box = (c * tile_w, r * tile_h, (c + 1) * tile_w, (r + 1) * tile_h)
            tile = fixed_image.crop(box)
            enhanced_tile = enhance_tile(tile)
            
            # Run YOLO
            results = MODEL.predict(enhanced_tile, conf=CONFIDENCE_THRESHOLD, verbose=False)
            
            # Visualize detections and save individual card crops
            draw = ImageDraw.Draw(enhanced_tile)
            for res in results:
                if res.boxes is not None:
                    for box in res.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()

                        # --- NEW: Sanity-check the bounding box size ---
                        box_width = x2 - x1
                        box_height = y2 - y1
                        # Filter out boxes that are likely just small details inside a card
                        if box_width < (tile_w * 0.6) or box_height < (tile_h * 0.6):
                            print(f"Skipping small detection box (w:{box_width}, h:{box_height})")
                            continue
                        # --- END NEW ---

                        # Draw bounding box on summary tile
                        draw.rectangle([x1, y1, x2, y2], outline="red", width=5)
                        
                        # Crop and upload individual card
                        card_crop = tile.crop((x1, y1, x2, y2))
                        card_buffer = io.BytesIO()
                        card_crop.save(card_buffer, format='JPEG', quality=90)
                        card_buffer.seek(0)
                        
                        card_path_obj = Path("results") / job['id'] / f"card_{detection_count}.jpg"
                        card_path_posix = card_path_obj.as_posix()
                        
                        try:
                            storage_client = supabase.storage.from_("binders")
                            
                            # Attempt to remove existing file to ensure idempotency
                            try:
                                storage_client.remove([card_path_posix])
                            except Exception:
                                pass # Safe to ignore if file doesn't exist

                            print(f"Uploading card crop to: {card_path_posix}")
                            storage_client.upload(
                                file=card_buffer.getvalue(),
                                path=card_path_posix,
                                file_options={"content-type": "image/jpeg", "cache-control": "public, max-age=3600"}
                            )
                            detected_card_paths.append(card_path_posix)
                            detection_count += 1
                        except Exception as e:
                            print(f"🔥 Failed to upload card crop {card_path_posix}: {e}")
                            # Re-raise the exception to fail the entire job
                            # This makes the error visible instead of hiding it.
                            raise e

            all_tile_images_with_detections.append(enhanced_tile)
    
    # 3. Create summary grid
    grid = Image.new('RGB', (w, h))
    for i, tile_img in enumerate(all_tile_images_with_detections):
        row, col = i // 3, i % 3
        grid.paste(tile_img, (col * tile_w, row * tile_h))
    
    # 4. Save summary grid to buffer and upload
    grid_buffer = io.BytesIO()
    grid.save(grid_buffer, format='JPEG', quality=95)
    grid_buffer.seek(0)

    summary_path_obj = Path("results") / job['id'] / "summary.jpg"
    summary_path_posix = summary_path_obj.as_posix()

    storage_client = supabase.storage.from_("binders")
    # Attempt to remove existing file to ensure idempotency
    try:
        storage_client.remove([summary_path_posix])
    except Exception:
        pass # Safe to ignore if file doesn't exist

    print(f"Uploading summary grid to: {summary_path_posix}")
    storage_client.upload(
        file=grid_buffer.getvalue(),
        path=summary_path_posix,
        file_options={"content-type": "image/jpeg"}
    )

    # 5. Return structured results
    return {
        "summary_image_path": summary_path_posix,
        "total_cards_detected": detection_count,
        "detected_card_paths": detected_card_paths,
        "processed_at": time.time()
    }

# --- Existing worker polling logic ---
def fetch_and_lock_job():
    """
    Calls a Postgres function via Supabase RPC to atomically fetch the next pending job
    and lock it by setting its status to 'processing'. Prevents race conditions between workers.
    """
    try:
        # This one line replaces the previous SELECT and UPDATE calls.
        response = supabase.rpc("fetch_and_lock_job").execute()

        if not response.data:
            return None  # No jobs available

        # The RPC function returns the entire job record.
        job = response.data[0]
        print(f"✅ Locked job {job['id']}")
        return job

    except Exception as e:
        print(f"🔥 RPC error while fetching job: {e}")
        return None

def main():
    """The main loop of the worker process."""
    print("🚀 Worker starting up...")
    while True:
        print("Polling for new jobs...")
        job = fetch_and_lock_job()

        if job:
            try:
                # Run the actual pipeline
                results = process_vision_pipeline(job)
                
                # Update job with results
                print(f"✅ Pipeline successful. Updating job {job['id']} with results.")
                supabase.from_("jobs").update({
                    "status": "completed",
                    "results": results,
                    "error_message": None
                }).eq("id", job["id"]).execute()

            except Exception as e:
                # Handle pipeline failure
                print(f"🔥 Pipeline failed for job {job['id']}: {e}")
                supabase.from_("jobs").update({
                    "status": "failed",
                    "error_message": str(e)
                }).eq("id", job["id"]).execute()
        else:
            print("No pending jobs found. Waiting...")

        time.sleep(10) # Wait for 10 seconds before polling again

if __name__ == "__main__":
    main() 