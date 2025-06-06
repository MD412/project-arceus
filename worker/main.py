import os
import time
import supabase
import io
import uuid
from dotenv import load_dotenv
from ultralytics import YOLO
from PIL import Image

load_dotenv() # Load environment variables from .env file

# --- Configuration ---
# Let Ultralytics auto-download the model to its cache if not found locally
YOLO_MODEL_IDENTIFIER = 'yolov8s.pt'
CONFIDENCE_THRESHOLD = 0.25
CROPPED_CARDS_BUCKET = 'card-crops'

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

        # 3. Run YOLO Detection on Each Tile
        t0 = time.time()
        all_detections = []
        for i, tile_data in enumerate(tiles):
            results = model.predict(tile_data['image'], conf=CONFIDENCE_THRESHOLD, verbose=False)
            for res in results:
                for box in res.boxes:
                    # Convert tile-coords to full-image coords
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    origin_x, origin_y = tile_data['origin']
                    global_box = [x1 + origin_x, y1 + origin_y, x2 + origin_x, y2 + origin_y]
                    all_detections.append({'tile_index': i, 'box': global_box, 'confidence': box.conf.item()})
        print(f"[Info] YOLO detected {len(all_detections)} total boxes in {time.time() - t0:.2f}s")

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