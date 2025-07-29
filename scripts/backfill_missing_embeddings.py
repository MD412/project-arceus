#!/usr/bin/env python3
"""
Backfill Missing Card Embeddings

This script identifies cards that are present in the local JSON data but
are missing from the `card_embeddings` table in Supabase. It then processes
only these missing cards, using a fallback from high-res to low-res images
to ensure maximum coverage.
"""
import io
import json
import time
from pathlib import Path

import requests
from PIL import Image
from alive_progress import alive_bar

import sys
current_dir = Path(__file__).parent
project_root = current_dir.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "worker"))

from clip_lookup import CLIPCardIdentifier
from config import get_supabase_client

# --- Configuration ---
BATCH_SIZE = 16
DATA_DIR = project_root / "pokemon-tcg-data" / "cards" / "en"
DRY_RUN = False

def fetch_image_with_fallback(card: dict, max_retries: int = 3) -> Image.Image | None:
    """
    Downloads a card's image, trying high-res first and falling back to low-res.
    """
    hires_url = card.get("images", {}).get("large")
    lowres_url = card.get("images", {}).get("small")

    # Attempt to fetch high-res image first
    if hires_url:
        for attempt in range(max_retries):
            try:
                response = requests.get(hires_url, timeout=20)
                if response.status_code == 200:
                    image_bytes = io.BytesIO(response.content)
                    return Image.open(image_bytes).convert("RGB")
                elif response.status_code == 404:
                    # If high-res is not found, break to try low-res immediately
                    break 
                response.raise_for_status() # Raise for other HTTP errors
            except requests.RequestException as e:
                if attempt >= max_retries - 1:
                    print(f"\n[WARN] High-res download failed for {hires_url}: {e}")
                time.sleep(1) # Wait before retry

    # Fallback to low-res image if high-res fails or doesn't exist
    if lowres_url:
        try:
            response = requests.get(lowres_url, timeout=20)
            response.raise_for_status()
            image_bytes = io.BytesIO(response.content)
            return Image.open(image_bytes).convert("RGB")
        except (requests.RequestException, IOError) as e:
            print(f"\n[ERROR] Low-res download also failed for {lowres_url}: {e}")
            return None
    
    return None

def process_batch(batch: list, clip_identifier: CLIPCardIdentifier, supabase_client):
    """Processes a batch of missing cards."""
    embeddings_to_upsert = []
    
    images = []
    card_data_for_batch = []
    for card in batch:
        image = fetch_image_with_fallback(card)
        if image:
            images.append(image)
            card_data_for_batch.append(card)

    if not images:
        return 0

    embeddings = clip_identifier.encode_images_batch(images)

    for card, embedding in zip(card_data_for_batch, embeddings):
        if embedding is None:
            continue
        
        card_id = card.get("id")
        
        embeddings_to_upsert.append({
            "card_id": card_id,
            "name": card.get("name"),
            "set_code": card_id.split('-')[0] if card_id else None,
            "card_number": card.get("number"),
            "rarity": card.get("rarity"),
            "image_url": card.get("images", {}).get("large") or card.get("images", {}).get("small"),
            "embedding": embedding.tolist(),
        })

    if not DRY_RUN and embeddings_to_upsert:
        try:
            supabase_client.from_("card_embeddings").upsert(embeddings_to_upsert).execute()
        except Exception as e:
            print(f"\n[ERROR] Supabase upsert failed: {e}")
            return 0
            
    return len(embeddings_to_upsert)

def main():
    """Main function to backfill missing card embeddings."""
    print("--- Missing Card Embedding Backfiller ---")
    
    if DRY_RUN:
        print("[INFO] Running in DRY RUN mode. No data will be written to the database.")

    # 1. Get all card IDs from local JSON files
    print("[INFO] Scanning local data for all possible card IDs...")
    json_files = sorted(list(DATA_DIR.glob("*.json")))
    all_local_cards = {}
    for file_path in json_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            cards = json.load(f)
            for card in cards:
                if card.get("id"):
                    all_local_cards[card["id"]] = card
    print(f"[OK] Found {len(all_local_cards)} unique card IDs in local data.")

    # 2. Initialize Supabase and get existing card IDs
    print("[INFO] Initializing Supabase and fetching existing card IDs...")
    supabase_client = get_supabase_client()
    try:
        response = supabase_client.from_("card_embeddings").select("card_id").execute()
        existing_card_ids = {item['card_id'] for item in response.data}
    except Exception as e:
        print(f"[ERROR] Could not fetch existing card IDs from Supabase: {e}")
        return
    print(f"[OK] Found {len(existing_card_ids)} cards already in the database.")

    # 3. Identify missing cards
    missing_card_ids = set(all_local_cards.keys()) - existing_card_ids
    if not missing_card_ids:
        print("[SUCCESS] No missing cards found. Database is up to date!")
        return
        
    print(f"[INFO] Found {len(missing_card_ids)} missing cards to process.")
    
    missing_cards_data = [all_local_cards[id] for id in missing_card_ids]

    # 4. Process missing cards in batches
    print("[INFO] Starting backfill process...")
    clip_identifier = CLIPCardIdentifier(supabase_client=supabase_client)
    total_backfilled = 0
    
    with alive_bar(len(missing_cards_data), title="Backfilling Cards") as bar:
        card_batch = []
        for card in missing_cards_data:
            card_batch.append(card)
            if len(card_batch) >= BATCH_SIZE:
                processed_count = process_batch(card_batch, clip_identifier, supabase_client)
                total_backfilled += processed_count
                card_batch = []
            bar()
            
        if card_batch:
            processed_count = process_batch(card_batch, clip_identifier, supabase_client)
            total_backfilled += processed_count

    print("\n---_---_---_---_---_---_---_---_---_---")
    print(f"[SUCCESS] Backfill complete!")
    print(f"  Total cards backfilled: {total_backfilled}")
    if DRY_RUN:
        print("[INFO] This was a DRY RUN. No data was actually changed.")
    print("---_---_---_---_---_---_---_---_---_---")

if __name__ == "__main__":
    main() 