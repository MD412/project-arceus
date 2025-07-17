#!/usr/bin/env python3
"""
Enhanced ETL script with resume capability
Skips cards that already have embeddings to handle crashes gracefully
"""

import os
import sys
import time
import json
import requests
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional, Set
from PIL import Image
import io

# Add worker to path for config import
sys.path.append(str(Path(__file__).parent.parent / "worker"))
from config import get_supabase_client

# ML dependencies
try:
    import torch
    import open_clip
    from torchvision import transforms
except ImportError:
    print("❌ Missing ML dependencies. Install with:")
    print("pip install torch torchvision open-clip-torch")
    sys.exit(1)

# Configuration
API_BASE_URL = "https://api.pokemontcg.io/v2/cards"
PAGE_SIZE = 250  # Max allowed by API
BATCH_SIZE = 50  # Process cards in batches
IMAGE_SIZE = 224  # OpenCLIP input size
MAX_RETRIES = 3
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
TEST_MODE = os.getenv("TEST_MODE", "false").lower() == "true"
TEST_LIMIT = 100  # Limit cards in test mode

print(f"🚀 Starting card embeddings ETL on device: {DEVICE}")
print(f"📋 Mode: {'TEST' if TEST_MODE else 'PRODUCTION'}")

def get_existing_card_ids(supabase_client) -> Set[str]:
    """Fetch all card IDs that already have embeddings"""
    print("🔍 Checking existing embeddings...")
    existing_ids = set()
    
    try:
        # Fetch in batches to handle large tables
        offset = 0
        batch_size = 1000
        
        while True:
            response = supabase_client.from_("card_embeddings").select("card_id").range(
                offset, offset + batch_size - 1
            ).execute()
            
            if not response.data:
                break
                
            for row in response.data:
                existing_ids.add(row["card_id"])
            
            if len(response.data) < batch_size:
                break
                
            offset += batch_size
            
        print(f"✅ Found {len(existing_ids)} existing embeddings")
        return existing_ids
        
    except Exception as e:
        print(f"⚠️ Could not fetch existing embeddings: {e}")
        return set()

def download_all_cards() -> List[Dict]:
    """Download all Pokemon TCG cards via pagination"""
    print("📥 Downloading Pokemon TCG cards via pagination...")
    
    all_cards = []
    page = 1
    
    while True:
        try:
            params = {
                "page": page,
                "pageSize": PAGE_SIZE,
            }
            
            response = requests.get(API_BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            page_cards = data.get("data", [])
            if not page_cards:
                break
                
            all_cards.extend(page_cards)
            print(f"✅ Page {page}: Downloaded {len(page_cards)} cards (total: {len(all_cards)})")
            
            # Early exit in test mode
            if TEST_MODE and len(all_cards) >= TEST_LIMIT:
                print(f"🧪 Test mode: stopping at {len(all_cards)} cards")
                break
                
            # Check if we've reached the end
            total_count = data.get("totalCount", 0)
            if len(all_cards) >= total_count:
                break
                
            page += 1
            time.sleep(0.1)  # Rate limiting courtesy
            
        except Exception as e:
            print(f"❌ Failed to download page {page}: {e}")
            sys.exit(1)
    
    print(f"✅ Downloaded {len(all_cards)} total cards")
    return all_cards

def filter_english_cards(cards: List[Dict], existing_ids: Set[str]) -> List[Dict]:
    """Filter to English cards with valid images that aren't already embedded"""
    filtered = []
    skipped_existing = 0
    
    for card in cards:
        # Skip if already embedded
        if card.get("id") in existing_ids:
            skipped_existing += 1
            continue
            
        # Skip non-English cards
        lang = card.get("language", "en")  # Default to English if not specified
        if lang and lang != "en":
            continue
            
        # Must have images
        images = card.get("images", {})
        if not images.get("small"):
            continue
            
        # Must have basic metadata
        if not all([card.get("id"), card.get("name"), card.get("set", {}).get("id")]):
            continue
            
        filtered.append(card)
    
    print(f"✅ Filtered to {len(filtered)} new English cards to process")
    print(f"⏭️  Skipped {skipped_existing} cards that already have embeddings")
    return filtered

def load_clip_model():
    """Load OpenCLIP ViT-B/32 model"""
    print("🧠 Loading OpenCLIP ViT-B/32 model...")
    
    try:
        model, _, preprocess = open_clip.create_model_and_transforms(
            'ViT-B-32', 
            pretrained='openai',
            device=DEVICE
        )
        model.eval()
        
        print(f"✅ OpenCLIP model loaded on {DEVICE}")
        return model, preprocess
        
    except Exception as e:
        print(f"❌ Failed to load OpenCLIP model: {e}")
        sys.exit(1)

def download_and_encode_image(image_url: str, model, preprocess) -> Optional[np.ndarray]:
    """Download card image and encode with OpenCLIP"""
    for attempt in range(MAX_RETRIES):
        try:
            # Download image
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Load and preprocess
            image = Image.open(io.BytesIO(response.content)).convert('RGB')
            image_tensor = preprocess(image).unsqueeze(0).to(DEVICE)
            
            # Encode with CLIP
            with torch.no_grad():
                embedding = model.encode_image(image_tensor)
                embedding = embedding.cpu().numpy().flatten()
                
            return embedding
            
        except Exception as e:
            if attempt == MAX_RETRIES - 1:
                print(f"⚠️ Failed to encode {image_url} after {MAX_RETRIES} attempts: {e}")
                return None
            time.sleep(1)  # Brief retry delay
    
    return None

def store_embeddings_batch(supabase_client, embeddings_batch: List[Dict]):
    """Store batch of embeddings in Supabase"""
    try:
        # Convert numpy arrays to lists for JSON serialization
        for item in embeddings_batch:
            if isinstance(item['embedding'], np.ndarray):
                item['embedding'] = item['embedding'].tolist()
        
        response = supabase_client.from_("card_embeddings").upsert(
            embeddings_batch, 
            on_conflict="card_id"
        ).execute()
        
        if response.data:
            return len(response.data)
        return 0
        
    except Exception as e:
        print(f"❌ Failed to store embeddings batch: {e}")
        return 0

def main():
    """Main ETL pipeline with resume capability"""
    print("🎯 Building Pokemon card embeddings database (with resume support)")
    
    # Initialize Supabase client
    try:
        supabase_client = get_supabase_client()
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Get existing embeddings to skip
    existing_ids = get_existing_card_ids(supabase_client)
    
    # Download bulk data
    cards = download_all_cards()
    cards = filter_english_cards(cards, existing_ids)  # Skip already embedded
    
    if not cards:
        print("🎉 All cards already have embeddings! Nothing to process.")
        return
    
    # Load CLIP model
    model, preprocess = load_clip_model()
    
    # Process cards in batches
    total_processed = 0
    total_successful = 0
    embeddings_batch = []
    
    print(f"🔄 Processing {len(cards)} new cards in batches of {BATCH_SIZE}...")
    
    for i, card in enumerate(cards):
        card_id = card["id"]
        image_url = card["images"]["small"]
        
        print(f"[{i+1}/{len(cards)}] Processing {card['name']} ({card_id})")
        
        # Encode image
        embedding = download_and_encode_image(image_url, model, preprocess)
        
        if embedding is not None:
            embeddings_batch.append({
                "card_id": card_id,
                "embedding": embedding
            })
            total_successful += 1
        
        total_processed += 1
        
        # Store batch when full or at end
        if len(embeddings_batch) >= BATCH_SIZE or i == len(cards) - 1:
            if embeddings_batch:
                stored_count = store_embeddings_batch(supabase_client, embeddings_batch)
                print(f"✅ Stored {stored_count} embeddings in batch")
                embeddings_batch = []
        
        # Progress update every 100 cards
        if (i + 1) % 100 == 0:
            success_rate = (total_successful / total_processed) * 100
            print(f"📊 Progress: {i+1}/{len(cards)} ({success_rate:.1f}% success rate)")
    
    # Final summary
    final_success_rate = (total_successful / total_processed) * 100 if total_processed > 0 else 0
    print(f"""
🎉 ETL Complete!
📊 Total processed: {total_processed}
✅ Successful encodings: {total_successful} ({final_success_rate:.1f}%)
❌ Failed encodings: {total_processed - total_successful}
⏭️  Previously embedded: {len(existing_ids)}
    """)
    
    # Verify final count in database
    try:
        final_count = supabase_client.from_("card_embeddings").select("card_id", count="exact").execute()
        print(f"🗄️ Total embeddings in database: {final_count.count}")
    except Exception as e:
        print(f"⚠️ Could not verify final count: {e}")

if __name__ == "__main__":
    main() 