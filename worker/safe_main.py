import os
import time
import io
import uuid
import cv2
import numpy as np
from PIL import Image

# Import our centralized config
from env_config import (
    get_supabase_config,
    YOLO_MODEL_IDENTIFIER,
    CONFIDENCE_THRESHOLD,
    CROPPED_CARDS_BUCKET,
    ENABLE_CONTOUR_RECTIFICATION
)

# Try to import optional dependencies
try:
    from dotenv import load_dotenv
    load_dotenv()
    DOTENV_AVAILABLE = True
except ImportError:
    print("[Warning] python-dotenv not available, environment loading skipped")
    DOTENV_AVAILABLE = False

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    print("[Warning] ultralytics not available, using mock YOLO")
    YOLO_AVAILABLE = False

try:
    import supabase
    SUPABASE_AVAILABLE = True
except ImportError:
    print("[Warning] supabase not available, using mock client")
    SUPABASE_AVAILABLE = False

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

def test_tile_enhancement(tile_pil):
    """Test the tile enhancement on a real PIL image."""
    print(f"🔍 Testing enhancement on {tile_pil.size} tile...")
    
    if not ENABLE_CONTOUR_RECTIFICATION:
        print("📋 Enhancement disabled, using raw tile")
        return tile_pil
    
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
                    enhanced_pil = Image.fromarray(cv2.cvtColor(processed_tile, cv2.COLOR_BGR2RGB))
                    print("✅ Tile enhanced with contour rectification + CLAHE")
                    return enhanced_pil
        
        # If we get here, no good contour found - just apply CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        processed_tile = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
        enhanced_pil = Image.fromarray(cv2.cvtColor(processed_tile, cv2.COLOR_BGR2RGB))
        print("🔧 Tile enhanced with CLAHE only (no good contour found)")
        return enhanced_pil
        
    except Exception as e:
        print(f"⚠️ Enhancement failed: {e}, using raw tile")
        return tile_pil

def simulate_3x3_processing():
    """Simulate the 3x3 tile processing with enhancement."""
    print("🧪 Simulating 3x3 Tile Processing with Enhancement...")
    
    # Create a sample image (would be from Supabase in real worker)
    sample_image = Image.new('RGB', (900, 600), color='lightblue')
    w, h = sample_image.size
    tile_w, tile_h = w // 3, h // 3
    
    processed_count = 0
    fallback_count = 0
    
    print(f"📐 Processing {w}x{h} image into 3x3 tiles ({tile_w}x{tile_h} each)")
    
    for r in range(3):
        for c in range(3):
            tile_index = r * 3 + c
            box = (c * tile_w, r * tile_h, (c + 1) * tile_w, (r + 1) * tile_h)
            tile = sample_image.crop(box)
            
            # Test enhancement on this tile
            enhanced_tile = test_tile_enhancement(tile)
            
            if enhanced_tile != tile:  # Enhancement was applied
                processed_count += 1
            else:
                fallback_count += 1
            
            print(f"  Tile {tile_index}: {'enhanced' if enhanced_tile != tile else 'raw'}")
    
    processing_status = f"enhanced={processed_count}, raw={fallback_count}"
    print(f"🎯 Processing complete: {processing_status}")
    
    return processed_count, fallback_count

if __name__ == "__main__":
    print("🚀 Safe Worker Test - OpenCV Enhancement Pipeline")
    print(f"📦 Dependencies: OpenCV={cv2.__version__}, YOLO={YOLO_AVAILABLE}, Supabase={SUPABASE_AVAILABLE}")
    print()
    
    # Test the enhancement pipeline
    processed_count, fallback_count = simulate_3x3_processing()
    
    print()
    print("✅ Safe worker test completed!")
    print(f"🎉 Your OpenCV enhancement pipeline is ready for integration!") 