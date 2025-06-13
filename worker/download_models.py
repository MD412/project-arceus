#!/usr/bin/env python3
"""
Model management script for downloading and caching ML models.
This ensures models are available without storing them in Git.
"""

import os
import requests
from pathlib import Path
import hashlib

# Model configurations
MODELS = {
    "yolov8s": {
        "url": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8s.pt",
        "filename": "yolov8s.pt",
        "sha256": None  # Add checksum if needed for verification
    },
    # Add your custom model here when you upload it to Hugging Face
    # "pokemon_cards": {
    #     "url": "https://huggingface.co/your-username/pokemon-card-detector/resolve/main/pokemon_cards_trained.pt",
    #     "filename": "pokemon_cards_trained.pt",
    #     "sha256": None
    # }
}

def download_file(url: str, filepath: Path, chunk_size: int = 8192) -> bool:
    """Download a file with progress indication."""
    try:
        print(f"Downloading {filepath.name}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\rProgress: {percent:.1f}%", end='', flush=True)
        
        print(f"\n✅ Downloaded {filepath.name}")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to download {filepath.name}: {e}")
        return False

def verify_checksum(filepath: Path, expected_sha256: str) -> bool:
    """Verify file integrity using SHA256 checksum."""
    if not expected_sha256:
        return True
        
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    
    actual_sha256 = sha256_hash.hexdigest()
    return actual_sha256 == expected_sha256

def ensure_models_available() -> bool:
    """Ensure all required models are downloaded and available."""
    worker_dir = Path(__file__).parent
    all_success = True
    
    for model_name, config in MODELS.items():
        filepath = worker_dir / config["filename"]
        
        # Check if model already exists
        if filepath.exists():
            print(f"✅ {config['filename']} already exists")
            
            # Verify checksum if provided
            if config["sha256"] and not verify_checksum(filepath, config["sha256"]):
                print(f"⚠️  Checksum mismatch for {config['filename']}, re-downloading...")
                filepath.unlink()
            else:
                continue
        
        # Download the model
        success = download_file(config["url"], filepath)
        if not success:
            all_success = False
            continue
            
        # Verify checksum if provided
        if config["sha256"] and not verify_checksum(filepath, config["sha256"]):
            print(f"❌ Checksum verification failed for {config['filename']}")
            filepath.unlink()
            all_success = False
    
    return all_success

if __name__ == "__main__":
    print("🔄 Checking and downloading required models...")
    success = ensure_models_available()
    
    if success:
        print("✅ All models are ready!")
    else:
        print("❌ Some models failed to download")
        exit(1) 