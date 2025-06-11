import os
import time
import supabase
import io
import uuid
import cv2
import numpy as np
from dotenv import load_dotenv
from pathlib import Path
from ultralytics import YOLO
from PIL import Image

# Load environment variables from .env.local in the project root
project_root = Path(__file__).resolve().parent.parent
dotenv_path = project_root / '.env.local'

if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path, override=True)
    print(f"✅ Loaded environment variables from: {dotenv_path}")
else:
    print(f"⚠️ Warning: .env.local file not found at {dotenv_path}. Script might fail.")

# --- Configuration ---
YOLO_MODEL_IDENTIFIER = 'yolov8s.pt'
CONFIDENCE_THRESHOLD = 0.25
CROPPED_CARDS_BUCKET = 'card-crops'
# Safety flag - set to False to disable new processing and use original pipeline
ENABLE_CONTOUR_RECTIFICATION = True

def order_points(pts):
    """Order points in (top-left, top-right, bottom-right, bottom-left) order."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def create_supabase_client():
    """Creates a Supabase client instance."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.")
    return supabase.create_client(url, key)

def process_job(sb_client, job, model):
    """
    Processes a single job from the queue, performing the 3x3 slice and detection pipeline.
    """
    job_id = job['id']
    upload_id = job['binder_page_upload_id']
    storage_path = job['payload']['storage_path'] # Assuming storage_path is in the payload

    print(f"[Info] Picked job {job_id} (page {upload_id})")

    try:
        # 1. Download the Image
        t0 = time.time()
        download_response = sb_client.storage.from_("binder-photo-uploads").download(storage_path)
        if download_response is None:
            raise Exception("Failed to download image: response is null.")
        image_bytes = download_response
        print(f"[Info] Image downloaded (size {len(image_bytes)} bytes) in {time.time() - t0:.2f}s")

        # 2. Perform the 3x3 Slice
        t0 = time.time()
        original_image = Image.open(io.BytesIO(image_bytes))
        w, h = original_image.size
        tile_w, tile_h = w // 3, h // 3
        tiles = []
        for r in range(3):
            for c in range(3):
                box = (c * tile_w, r * tile_h, (c + 1) * tile_w, (r + 1) * tile_h)
                tile = original_image.crop(box)
                tiles.append({'image': tile, 'origin': (c * tile_w, r * tile_h)})
        print(f"[Info] Performed 3x3 slices -> got {len(tiles)} tiles in {time.time() - t0:.2f}s")

        # 3. Run YOLO Detection on Each Tile (with optional contour rectification + CLAHE)
        t0 = time.time()
        all_detections = []
        processed_count = 0
        fallback_count = 0
        
        for i, tile_data in enumerate(tiles):
            tile_pil = tile_data['image']
            
            # Apply enhanced processing if enabled
            if ENABLE_CONTOUR_RECTIFICATION:
                try:
                    # Convert PIL image to OpenCV format (BGR numpy array)
                    tile_bgr = cv2.cvtColor(np.array(tile_pil), cv2.COLOR_RGB2BGR)
                    tile_h, tile_w = tile_bgr.shape[:2]
                    
                    # 1. Convert to gray & blur to smooth noise
                    gray = cv2.cvtColor(tile_bgr, cv2.COLOR_BGR2GRAY)
                    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
                    
                    # 2. Edge detect + find contours
                    edges = cv2.Canny(blurred, 50, 150)
                    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
                    
                    # 3. Pick the contour with largest area (if any contours found)
                    if contours and len(contours) > 0:
                        largest = max(contours, key=cv2.contourArea)
                        
                        # Only proceed if contour is reasonably large
                        contour_area = cv2.contourArea(largest)
                        if contour_area > (tile_w * tile_h * 0.1):  # At least 10% of tile
                            # 4. Approximate to quadrilateral
                            peri = cv2.arcLength(largest, True)
                            approx = cv2.approxPolyDP(largest, 0.02 * peri, True)
                            
                            if len(approx) == 4:
                                pts = approx.reshape(4, 2).astype("float32")
                                
                                # 5. Order pts (tl, tr, br, bl) then warp
                                rect = order_points(pts)
                                dst = np.array([[0, 0], [tile_w, 0], [tile_w, tile_h], [0, tile_h]], dtype="float32")
                                M = cv2.getPerspectiveTransform(rect, dst)
                                warped = cv2.warpPerspective(tile_bgr, M, (tile_w, tile_h))
                                
                                # 6. Apply CLAHE
                                gray_w = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
                                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                                enhanced = clahe.apply(gray_w)
                                processed_tile = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
                                
                                # Convert back to PIL for YOLO
                                tile_pil = Image.fromarray(cv2.cvtColor(processed_tile, cv2.COLOR_BGR2RGB))
                                processed_count += 1
                                continue
                    
                    # If we get here, no good contour found - use raw tile
                    fallback_count += 1
                    
                except Exception as e:
                    print(f"[Warning] Tile {i} preprocessing failed: {e}, using raw tile")
                    fallback_count += 1
            else:
                fallback_count += 1
            
            # Run YOLO on tile (either processed or raw)
            results = model.predict(tile_pil, conf=CONFIDENCE_THRESHOLD, verbose=False)
            for res in results:
                for box in res.boxes:
                    # Convert tile-coords to full-image coords
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    origin_x, origin_y = tile_data['origin']
                    global_box = [x1 + origin_x, y1 + origin_y, x2 + origin_x, y2 + origin_y]
                    all_detections.append({'tile_index': i, 'box': global_box, 'confidence': box.conf.item()})
        
        processing_status = f"enhanced={processed_count}, raw={fallback_count}" if ENABLE_CONTOUR_RECTIFICATION else "raw=9 (enhancement disabled)"
        print(f"[Info] YOLO detected {len(all_detections)} total boxes in {time.time() - t0:.2f}s ({processing_status})")

        # 4. Post-Process & Upload Cropped Cards
        t0 = time.time()
        review_items = []
        for i, det in enumerate(all_detections):
            cropped_image = original_image.crop(det['box'])
            img_byte_arr = io.BytesIO()
            cropped_image.save(img_byte_arr, format='JPEG', quality=90)
            img_byte_arr = img_byte_arr.getvalue()

            file_path = f"{upload_id}/{det['tile_index']}_{i}.jpg"
            sb_client.storage.from_(CROPPED_CARDS_BUCKET).upload(file_path, img_byte_arr, {"content-type": "image/jpeg"})
            review_items.append({
                "tile_index": det['tile_index'],
                "crop_path": file_path,
                "confidence": det['confidence'],
                "box_coords": det['box']
            })
        print(f"[Info] Uploaded {len(review_items)} cropped images in {time.time() - t0:.2f}s")

        # 5. Call RPC to finalize the job
        t0 = time.time()
        sb_client.rpc('finalize_job_run', {
            'p_job_id': job_id,
            'p_upload_id': upload_id,
            'p_final_status': 'review_pending',
            'p_review_items': review_items
        }).execute()
        print(f"[Info] Completed job {job_id}: enqueued {len(review_items)} items for review in {time.time() - t0:.2f}s")

    except Exception as e:
        print(f"[Error] Job {job_id} failed: {e}")
        # Finalize job with 'failed' status
        sb_client.rpc('finalize_job_run', {
            'p_job_id': job_id,
            'p_upload_id': upload_id,
            'p_final_status': 'failed',
            'p_error_message': str(e)
        }).execute()

def poll_for_jobs(sb_client):
    """Continuously polls the job_queue for new jobs."""
    print("Worker started. Loading YOLO model...")
    model = YOLO(YOLO_MODEL_IDENTIFIER)
    print("Model loaded. Polling for jobs...")
    while True:
        try:
            response = sb_client.rpc('dequeue_and_start_job', {}).execute()
            job = response.data[0] if response.data else None

            if job:
                process_job(sb_client, job, model)
            else:
                print("No pending jobs found. Waiting...")
                time.sleep(10)

        except Exception as e:
            print(f"An error occurred in the polling loop: {e}")
            time.sleep(30)

if __name__ == "__main__":
    supabase_client = create_supabase_client()
    poll_for_jobs(supabase_client) 