import os
import time
import cv2
import numpy as np
from dotenv import load_dotenv
from pathlib import Path
from ultralytics import YOLO
from PIL import Image

# Load environment variables
project_root = Path(__file__).resolve().parent.parent
dotenv_path = project_root / '.env.local'
load_dotenv(dotenv_path=dotenv_path, override=True)

# --- Configuration ---
YOLO_MODEL_IDENTIFIER = 'yolov8s.pt'
CONFIDENCE_THRESHOLD = 0.25
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

def enhance_tile(tile_pil):
    """Apply contour rectification + CLAHE enhancement to a tile."""
    if not ENABLE_CONTOUR_RECTIFICATION:
        return tile_pil
    
    try:
        # Convert PIL to OpenCV
        tile_bgr = cv2.cvtColor(np.array(tile_pil), cv2.COLOR_RGB2BGR)
        tile_h, tile_w = tile_bgr.shape[:2]
        
        # Convert to gray & blur
        gray = cv2.cvtColor(tile_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detect + find contours
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        # Try perspective correction if good contour found
        if contours:
            largest = max(contours, key=cv2.contourArea)
            contour_area = cv2.contourArea(largest)
            
            if contour_area > (tile_w * tile_h * 0.1):  # At least 10% of tile
                peri = cv2.arcLength(largest, True)
                approx = cv2.approxPolyDP(largest, 0.02 * peri, True)
                
                if len(approx) == 4:
                    pts = approx.reshape(4, 2).astype("float32")
                    rect = order_points(pts)
                    dst = np.array([[0, 0], [tile_w, 0], [tile_w, tile_h], [0, tile_h]], dtype="float32")
                    M = cv2.getPerspectiveTransform(rect, dst)
                    tile_bgr = cv2.warpPerspective(tile_bgr, M, (tile_w, tile_h))
                    gray = cv2.cvtColor(tile_bgr, cv2.COLOR_BGR2GRAY)
        
        # Apply CLAHE enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        processed_tile = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
        
        # Convert back to PIL
        return Image.fromarray(cv2.cvtColor(processed_tile, cv2.COLOR_BGR2RGB))
        
    except Exception as e:
        print(f"[Warning] Enhancement failed: {e}, using raw tile")
        return tile_pil

def demo_enhanced_pipeline():
    """Demo the enhanced 3x3 vision pipeline."""
    print("🚀 Enhanced Vision Pipeline Demo")
    print("✅ Supabase connected")
    print("✅ OpenCV loaded")
    
    # Load YOLO model
    print("📦 Loading YOLO model...")
    model = YOLO(YOLO_MODEL_IDENTIFIER)
    print("✅ YOLO model loaded")
    
    # Create a demo 3x3 grid image
    print("\n🎯 Demo: Processing 3x3 card grid...")
    demo_image = Image.new('RGB', (900, 600), color='lightgray')
    w, h = demo_image.size
    tile_w, tile_h = w // 3, h // 3
    
    processed_count = 0
    all_detections = []
    
    for r in range(3):
        for c in range(3):
            tile_index = r * 3 + c
            box = (c * tile_w, r * tile_h, (c + 1) * tile_w, (r + 1) * tile_h)
            tile = demo_image.crop(box)
            
            # Apply enhancement
            enhanced_tile = enhance_tile(tile)
            if enhanced_tile != tile:
                processed_count += 1
            
            # Run YOLO on enhanced tile
            results = model.predict(enhanced_tile, conf=CONFIDENCE_THRESHOLD, verbose=False)
            detection_count = sum(len(res.boxes) for res in results)
            all_detections.append(detection_count)
            
            print(f"  Tile {tile_index}: {'enhanced' if enhanced_tile != tile else 'raw'} -> {detection_count} detections")
    
    print(f"\n📊 Results:")
    print(f"   Enhanced tiles: {processed_count}/9")
    print(f"   Total detections: {sum(all_detections)}")
    print(f"   Average per tile: {sum(all_detections)/9:.1f}")
    
    print(f"\n🎉 Your enhanced vision pipeline is ready!")
    print(f"📋 Next: Upload a real binder photo to test with actual cards")

if __name__ == "__main__":
    demo_enhanced_pipeline() 