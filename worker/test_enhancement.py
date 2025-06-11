import cv2
import numpy as np
from PIL import Image

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

def test_enhancement_pipeline():
    """Test the OpenCV enhancement pipeline on a sample image."""
    print("🧪 Testing OpenCV Enhancement Pipeline...")
    
    # Create a test image (simulated card tile)
    test_image = np.random.randint(0, 255, (400, 300, 3), dtype=np.uint8)
    
    try:
        # Convert to PIL then back to OpenCV (simulating the worker flow)
        pil_image = Image.fromarray(cv2.cvtColor(test_image, cv2.COLOR_BGR2RGB))
        tile_bgr = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        tile_h, tile_w = tile_bgr.shape[:2]
        
        print(f"✅ Image conversion working: {tile_w}x{tile_h}")
        
        # 1. Convert to gray & blur
        gray = cv2.cvtColor(tile_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        print("✅ Grayscale and blur working")
        
        # 2. Edge detect + find contours
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        print(f"✅ Edge detection working: found {len(contours)} contours")
        
        # 3. CLAHE test
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        processed_tile = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
        print("✅ CLAHE enhancement working")
        
        # 4. Convert back to PIL
        final_pil = Image.fromarray(cv2.cvtColor(processed_tile, cv2.COLOR_BGR2RGB))
        print("✅ Final PIL conversion working")
        
        print("🎉 OpenCV Enhancement Pipeline: ALL TESTS PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Enhancement pipeline failed: {e}")
        return False

if __name__ == "__main__":
    test_enhancement_pipeline() 