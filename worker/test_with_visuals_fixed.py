import os
import io
import requests
from dotenv import load_dotenv
from pathlib import Path
from ultralytics import YOLO
from PIL import Image, ImageDraw, ImageFont, ExifTags, ImageOps
import cv2
import numpy as np
import supabase

# Load environment variables
project_root = Path(__file__).resolve().parent.parent
dotenv_path = project_root / '.env.local'
load_dotenv(dotenv_path=dotenv_path, override=True)

# Configuration
YOLO_MODEL_IDENTIFIER = 'yolov8s.pt'
CONFIDENCE_THRESHOLD = 0.25
ENABLE_CONTOUR_RECTIFICATION = True
OUTPUT_DIR = Path(__file__).parent / "output_fixed"

def setup_output_dir():
    """Create output directory for results."""
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"📁 Output directory: {OUTPUT_DIR.absolute()}")

def fix_image_orientation(image):
    """
    Fix image orientation using EXIF data (via ImageOps.exif_transpose). If EXIF
    data does **not** change the image, we fall back to the YOLO-powered smart
    orientation detection.
    """

    try:
        corrected = ImageOps.exif_transpose(image)

        if corrected is not image:
            print("📱 EXIF: Orientation corrected via ImageOps ✅")
            return corrected
        else:
            print("📱 EXIF: No orientation metadata or already correct, running smart detection…")
            return smart_orientation_detection(corrected)

    except Exception as e:
        print(f"🔥 EXIF orientation handling failed ({e}). Falling back to smart detection…")
        return smart_orientation_detection(image)

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

def enhance_tile(tile_pil, tile_index):
    """Apply contour rectification + CLAHE enhancement and save intermediate steps."""
    if not ENABLE_CONTOUR_RECTIFICATION:
        return tile_pil, "raw"
    
    # Save original tile
    tile_pil.save(OUTPUT_DIR / f"tile_{tile_index}_0_original.jpg")
    
    try:
        tile_bgr = cv2.cvtColor(np.array(tile_pil), cv2.COLOR_RGB2BGR)
        tile_h, tile_w = tile_bgr.shape[:2]
        
        # Convert to gray & blur
        gray = cv2.cvtColor(tile_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Save edge detection
        edges = cv2.Canny(blurred, 50, 150)
        cv2.imwrite(str(OUTPUT_DIR / f"tile_{tile_index}_1_edges.jpg"), edges)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        enhanced = False
        
        # Try perspective correction
        if contours:
            largest = max(contours, key=cv2.contourArea)
            contour_area = cv2.contourArea(largest)
            
            # Save contour visualization
            contour_vis = tile_bgr.copy()
            cv2.drawContours(contour_vis, [largest], -1, (0, 255, 0), 3)
            cv2.imwrite(str(OUTPUT_DIR / f"tile_{tile_index}_2_contour.jpg"), contour_vis)
            
            if contour_area > (tile_w * tile_h * 0.1):
                peri = cv2.arcLength(largest, True)
                approx = cv2.approxPolyDP(largest, 0.02 * peri, True)
                
                if len(approx) == 4:
                    pts = approx.reshape(4, 2).astype("float32")
                    rect = order_points(pts)
                    dst = np.array([[0, 0], [tile_w, 0], [tile_w, tile_h], [0, tile_h]], dtype="float32")
                    M = cv2.getPerspectiveTransform(rect, dst)
                    tile_bgr = cv2.warpPerspective(tile_bgr, M, (tile_w, tile_h))
                    gray = cv2.cvtColor(tile_bgr, cv2.COLOR_BGR2GRAY)
                    enhanced = True
                    
                    # Save perspective corrected
                    cv2.imwrite(str(OUTPUT_DIR / f"tile_{tile_index}_3_perspective.jpg"), tile_bgr)
        
        # Always apply CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_gray = clahe.apply(gray)
        processed_tile = cv2.cvtColor(enhanced_gray, cv2.COLOR_GRAY2BGR)
        
        # Save final enhanced
        cv2.imwrite(str(OUTPUT_DIR / f"tile_{tile_index}_4_final.jpg"), processed_tile)
        
        result_pil = Image.fromarray(cv2.cvtColor(processed_tile, cv2.COLOR_BGR2RGB))
        return result_pil, "perspective+clahe" if enhanced else "clahe"
        
    except Exception as e:
        print(f"[Warning] Enhancement failed: {e}")
        return tile_pil, "raw"

def visualize_detections(image_pil, results, tile_index, enhancement_type):
    """Draw YOLO detection boxes on the image."""
    draw = ImageDraw.Draw(image_pil)
    
    detection_count = 0
    for res in results:
        if res.boxes is not None:
            for box in res.boxes:
                detection_count += 1
                # Get box coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = box.conf.item()
                
                # Draw bounding box
                draw.rectangle([x1, y1, x2, y2], outline="red", width=4)
                
                # Draw confidence text
                try:
                    font = ImageFont.truetype("arial.ttf", 24)
                except:
                    font = ImageFont.load_default()
                
                text = f"{confidence:.2f}"
                # White background for text
                text_bbox = draw.textbbox((x1, y1-30), text, font=font)
                draw.rectangle(text_bbox, fill="white")
                draw.text((x1, y1-30), text, fill="red", font=font)
    
    # Add enhancement type and detection count
    try:
        title_font = ImageFont.truetype("arial.ttf", 28)
    except:
        title_font = ImageFont.load_default()
    
    title = f"Tile {tile_index}: {enhancement_type} ({detection_count} detections)"
    # White background for title
    title_bbox = draw.textbbox((10, 10), title, font=title_font)
    draw.rectangle(title_bbox, fill="white")
    draw.text((10, 10), title, fill="green", font=title_font)
    
    # Save detection visualization
    image_pil.save(OUTPUT_DIR / f"tile_{tile_index}_5_detections.jpg")
    
    return detection_count

def create_summary_grid(all_tiles_info):
    """Create a 3x3 summary grid showing all tiles."""
    # Load all detection images
    tile_images = []
    for i in range(9):
        try:
            img = Image.open(OUTPUT_DIR / f"tile_{i}_5_detections.jpg")
            # Resize to consistent size for grid
            img = img.resize((500, 375))  # Bigger tiles for better readability
            tile_images.append(img)
        except:
            # Create placeholder if image missing
            img = Image.new('RGB', (500, 375), color='gray')
            tile_images.append(img)
    
    # Create 3x3 grid
    grid_width = 3 * 500
    grid_height = 3 * 375
    grid = Image.new('RGB', (grid_width, grid_height), color='white')
    
    for i, tile_img in enumerate(tile_images):
        row = i // 3
        col = i % 3
        x = col * 500
        y = row * 375
        grid.paste(tile_img, (x, y))
    
    # Add overall title
    draw = ImageDraw.Draw(grid)
    try:
        main_font = ImageFont.truetype("arial.ttf", 48)
    except:
        main_font = ImageFont.load_default()
    
    title_text = "🔥 Project Arceus: Enhanced Vision Pipeline Results 🔥"
    title_bbox = draw.textbbox((50, 20), title_text, font=main_font)
    draw.rectangle([title_bbox[0]-10, title_bbox[1]-5, title_bbox[2]+10, title_bbox[3]+5], fill="black")
    draw.text((50, 20), title_text, fill="white", font=main_font)
    
    # Save summary
    grid.save(OUTPUT_DIR / "🔥_SUMMARY_3x3_GRID_🔥.jpg", quality=95)
    print(f"🎨 3x3 summary grid saved: 🔥_SUMMARY_3x3_GRID_🔥.jpg")

def test_with_visuals_fixed():
    """Test the enhanced pipeline and create properly oriented visual outputs."""
    print("🎨 Testing Enhanced Pipeline with FIXED Visual Outputs!")
    
    setup_output_dir()
    
    # Connect to Supabase
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    client = supabase.create_client(url, key)
    print("✅ Connected to Supabase")
    
    # Load YOLO
    print("📦 Loading YOLO model...")
    model = YOLO(YOLO_MODEL_IDENTIFIER)
    print("✅ YOLO model loaded")
    
    # Use the URL from your recent upload
    test_image_url = "https://dipwodpxxjwkwflimgsf.supabase.co/storage/v1/object/public/binder-photo-uploads/user-uploads/ab4cfa97-1840-4567-9e2a-8a0b0082c515.JPEG"
    
    print(f"🖼️ Downloading image: {test_image_url}")
    
    # Download the image
    response = requests.get(test_image_url)
    if response.status_code != 200:
        print(f"❌ Failed to download image: {response.status_code}")
        return
    
    # Open and fix orientation
    original_image = Image.open(io.BytesIO(response.content))
    print(f"📐 Original image size: {original_image.size}")
    
    # Fix orientation
    fixed_image = fix_image_orientation(original_image)
    print(f"📐 Fixed image size: {fixed_image.size}")
    
    # Save properly oriented image
    fixed_image.save(OUTPUT_DIR / "📷_ORIGINAL_FIXED_📷.jpg", quality=95)
    print(f"📷 Fixed original image saved!")
    
    # Perform 3x3 slice on fixed image
    w, h = fixed_image.size
    tile_w, tile_h = w // 3, h // 3
    
    print(f"\n🔪 Slicing into 3x3 grid ({tile_w}x{tile_h} tiles)")
    
    all_detections = []
    enhancement_stats = {"raw": 0, "clahe": 0, "perspective+clahe": 0}
    all_tiles_info = []
    
    for r in range(3):
        for c in range(3):
            tile_index = r * 3 + c
            box = (c * tile_w, r * tile_h, (c + 1) * tile_w, (r + 1) * tile_h)
            tile = fixed_image.crop(box)
            
            print(f"\n📋 Processing tile {tile_index}...")
            
            # Apply enhancement (saves intermediate steps)
            enhanced_tile, enhancement_type = enhance_tile(tile, tile_index)
            enhancement_stats[enhancement_type] += 1
            
            # Run YOLO
            results = model.predict(enhanced_tile, conf=CONFIDENCE_THRESHOLD, verbose=False)
            
            # Visualize detections
            detection_count = visualize_detections(enhanced_tile.copy(), results, tile_index, enhancement_type)
            all_detections.append(detection_count)
            
            all_tiles_info.append({
                'index': tile_index,
                'enhancement': enhancement_type,
                'detections': detection_count
            })
            
            print(f"  ✅ Tile {tile_index}: {enhancement_type} → {detection_count} detections")
    
    # Create summary grid
    create_summary_grid(all_tiles_info)
    
    print(f"\n📊 FINAL RESULTS:")
    print(f"   🎨 All images saved to: {OUTPUT_DIR.absolute()}")
    print(f"   🔧 Enhancement stats: {enhancement_stats}")
    print(f"   🎯 Total detections: {sum(all_detections)}/9 tiles")
    print(f"   📈 Detection rate: {sum(1 for d in all_detections if d > 0)}/9 tiles found cards")
    print(f"   📊 Average detections per tile: {sum(all_detections)/9:.1f}")
    
    print(f"\n🎉 FIXED VISUAL RESULTS READY FOR DOCUMENTATION!")
    print(f"🔥 Key files to check:")
    print(f"   📷 📷_ORIGINAL_FIXED_📷.jpg - Your PROPERLY ORIENTED binder photo")
    print(f"   🎨 🔥_SUMMARY_3x3_GRID_🔥.jpg - EPIC 3x3 grid with all detections!")
    print(f"   🔍 tile_X_5_detections.jpg - Individual tiles with detection boxes")
    print(f"   ⚡ tile_X_1_edges.jpg - Edge detection results")
    print(f"   🎯 tile_X_4_final.jpg - Final enhanced tiles")

if __name__ == "__main__":
    test_with_visuals_fixed() 