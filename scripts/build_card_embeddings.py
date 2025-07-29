#!/usr/bin/env python3
"""
Build Card Embeddings from Local JSON Data

This script iterates through the `pokemon-tcg-data` JSON files,
generates CLIP embeddings for each card image, and upserts the
data into the `card_embeddings` table in Supabase.
"""
import io
import json
import os
import time
from pathlib import Path

import requests
import torch
from PIL import Image
from alive_progress import alive_bar

# Assuming clip_lookup and config are in the parent directory or accessible
import sys

# Add the parent directory of 'scripts' to the Python path
# This allows importing from the 'worker' directory
# (e.g., `from worker.clip_lookup import CLIPCardIdentifier`)
#
# Project structure:
# project-arceus/
#  ├─ scripts/
#  │  └─ build_card_embeddings.py
#  └─ worker/
#     └─ clip_lookup.py
#
# To run from the project root: `python scripts/build_card_embeddings.py`
current_dir = Path(__file__).parent
project_root = current_dir.parent
# Add project root and worker directory to path to resolve imports correctly
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "worker"))


from clip_lookup import CLIPCardIdentifier
from config import get_supabase_client

# --- Configuration ---
BATCH_SIZE = 16  # Process N cards at a time
DATA_DIR = project_root / "pokemon-tcg-data" / "cards" / "en"
DRY_RUN = False # If True, don't actually write to the database
REPROCESS_EXISTING = False # If False, skip cards already in the DB

def fetch_image_from_url(url: str, max_retries: int = 3) -> Image.Image | None:
    """Downloads an image from a URL and returns a PIL Image object."""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=20)
            response.raise_for_status()
            image_bytes = io.BytesIO(response.content)
            return Image.open(image_bytes).convert("RGB")
        except (requests.RequestException, IOError) as e:
            print(f"\n[WARN] Attempt {attempt + 1} failed for {url}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2**attempt)  # Exponential backoff
            else:
                print(f"\n[ERROR] Could not fetch image after {max_retries} attempts: {url}")
                return None

def process_batch(batch: list, clip_identifier: CLIPCardIdentifier, supabase_client):
    """Processes a batch of cards: fetch images, create embeddings, upsert to DB."""
    embeddings_to_upsert = []
    
    # 1. Fetch images and generate embeddings
    images = []
    card_data_for_batch = []
    for card in batch:
        # Prefer high-res images, fall back to low-res
        image_url = card.get("images", {}).get("large") or card.get("images", {}).get("small")
        if not image_url:
            continue
            
        image = fetch_image_from_url(image_url)
        if image:
            images.append(image)
            card_data_for_batch.append(card)

    if not images:
        return 0

    embeddings = clip_identifier.encode_images_batch(images)

    # 2. Prepare data for Supabase
    for card, embedding in zip(card_data_for_batch, embeddings):
        if embedding is None:
            continue
        
        # The unique ID for a card is its set slug plus its number, e.g., "sv1-1"
        card_id = card.get("id")
        
        embeddings_to_upsert.append({
            "card_id": card_id,
            "name": card.get("name"),
            "set_code": card_id.split('-')[0] if card_id else None,
            "card_number": card.get("number"),
            "rarity": card.get("rarity"),
            "image_url": card.get("images", {}).get("large") or card.get("images", {}).get("small"),
            "embedding": embedding.tolist(), # Convert numpy array to list for JSON
        })

    # 3. Upsert to Supabase
    if not DRY_RUN and embeddings_to_upsert:
        try:
            supabase_client.from_("card_embeddings").upsert(embeddings_to_upsert).execute()
        except Exception as e:
            print(f"\n[ERROR] Supabase upsert failed: {e}")
            # Optionally, you could try to upsert one by one here to isolate the bad record
            return 0
            
    return len(embeddings_to_upsert)

def force_requeue_stale_jobs(supabase_client):
    """Finds all jobs stuck in 'processing' and resets them to 'pending'."""
    print("\n[FIX] Attempting to requeue jobs stuck in 'processing' state...")
    try:
        # Find jobs stuck in 'processing'
        stale_jobs_response = supabase_client.from_("job_queue").select("id").eq("status", "processing").execute()
        stale_jobs = stale_jobs_response.data or []
        
        if not stale_jobs:
            print("[OK] No jobs found in 'processing' state. Nothing to do.")
            return

        print(f"[INFO] Found {len(stale_jobs)} stuck jobs. Resetting to 'pending'...")
        
        job_ids_to_reset = [job['id'] for job in stale_jobs]
        
        # Reset them to 'pending'
        update_response = supabase_client.from_("job_queue").update({
            "status": "pending", 
            "started_at": None, 
            "visibility_timeout_at": None, 
            "picked_at": None,
            "retry_count": 0 # Reset retry count as well
        }).in_("id", job_ids_to_reset).execute()
        
        if len(update_response.data) > 0:
            print(f"[SUCCESS] Successfully reset {len(update_response.data)} jobs to 'pending'.")
        else:
             print("[WARN] The update command did not return any updated rows. They may have been processed by another worker.")

    except Exception as e:
        print(f"[ERROR] Failed to requeue stale jobs: {e}")


def main():
    """Main function to build card embeddings."""
    
    # --- TEMPORARY FIX ---
    # We will call the requeue function directly for a one-time fix.
    supabase_client_for_fix = get_supabase_client()
    force_requeue_stale_jobs(supabase_client_for_fix)
    print("[INFO] One-time job requeue complete. You can now comment out or remove this call.")
    return # We will exit after the fix to avoid running the full script.
    # --- END TEMP FIX ---

    print("--- Card Embedding Builder ---")
    
    if DRY_RUN:
        print("[INFO] Running in DRY RUN mode. No data will be written to the database.")

    # Get all JSON file paths
    json_files = sorted(list(DATA_DIR.glob("*.json")))
    if not json_files:
        print(f"[ERROR] No JSON files found in {DATA_DIR}")
        return

    print(f"[INFO] Found {len(json_files)} JSON files to process.")

    # Initialize Supabase and CLIP
    print("[INFO] Initializing services...")
    supabase_client = get_supabase_client()
    clip_identifier = CLIPCardIdentifier(supabase_client=supabase_client)
    print("[OK] Services initialized.")

    existing_card_ids = set()
    if not REPROCESS_EXISTING:
        print("[INFO] Fetching existing card IDs to avoid reprocessing...")
        try:
            response = supabase_client.from_("card_embeddings").select("card_id", count='exact').execute()
            if response.data:
                existing_card_ids = {item['card_id'] for item in response.data}
            print(f"[OK] Found {len(existing_card_ids)} existing cards.")
        except Exception as e:
            print(f"[WARN] Could not fetch existing card IDs: {e}. Will reprocess all.")


    total_cards_processed = 0
    
    with alive_bar(len(json_files), title="Processing Sets") as bar:
        card_batch = []
        for file_path in json_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    cards = json.load(f)
                    
                for card in cards:
                    card_id = card.get("id")
                    if not card_id:
                        continue

                    if not REPROCESS_EXISTING and card_id in existing_card_ids:
                        continue

                    card_batch.append(card)
                    
                    if len(card_batch) >= BATCH_SIZE:
                        processed_count = process_batch(card_batch, clip_identifier, supabase_client)
                        total_cards_processed += processed_count
                        card_batch = [] # Reset batch
                        
            except (json.JSONDecodeError, IOError) as e:
                print(f"\n[ERROR] Skipping file {file_path.name} due to error: {e}")
            
            bar()
            
        # Process any remaining cards in the last batch
        if card_batch:
            processed_count = process_batch(card_batch, clip_identifier, supabase_client)
            total_cards_processed += processed_count

    print("\n---_---_---_---_---_---_---_---_---_---")
    print(f"[SUCCESS] Embedding build complete!")
    print(f"  Total cards processed and upserted: {total_cards_processed}")
    if DRY_RUN:
        print("[INFO] This was a DRY RUN. No data was actually changed.")
    print("---_---_---_---_---_---_---_---_---_---")


if __name__ == "__main__":
    main() 