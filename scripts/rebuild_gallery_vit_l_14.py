#!/usr/bin/env python3
"""
Rebuild the entire card_templates gallery using ViT-L-14-336.

This script:
1. Deletes all existing templates (clean slate)
2. Fetches all cards from the cards table
3. Downloads images and generates embeddings with current OpenClipEmbedder
4. Creates official_art + hflip augmentation templates
5. Rebuilds card_prototypes (mean → L2 normalize)

Expected runtime: ~30-60min for 15,504 cards
Expected accuracy gain: +10-20pp from feature space alignment
"""
from __future__ import annotations

import argparse
import io
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Sequence

import numpy as np
import requests
from PIL import Image

import sys

CURRENT_DIR = Path(__file__).parent
PROJECT_ROOT = CURRENT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))

from worker.openclip_embedder import build_default_embedder
from worker.config import get_supabase_client

CARD_BATCH_SIZE = 16
UPSERT_BATCH_SIZE = 20  # Reduced to avoid statement timeout
DOWNLOAD_TIMEOUT_SEC = 20
MAX_DOWNLOAD_RETRIES = 3


@dataclass
class TemplateRecord:
    id: str
    card_id: str
    set_id: Optional[str]
    variant: Optional[str]
    source: str
    aug_tag: Optional[str]
    emb: List[float]


def deterministic_template_id(card_id: str, source: str, variant: Optional[str], aug_tag: Optional[str]) -> str:
    """Produce a consistent UUID for idempotent upserts."""
    key = f"{card_id}|{source}|{variant or ''}|{aug_tag or ''}"
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))


def ensure_unit_vector(vec: np.ndarray) -> np.ndarray:
    """Re-normalize to L2=1.0 to defend against drift or numerical noise."""
    norm = np.linalg.norm(vec)
    if not np.isfinite(norm) or norm <= 0:
        raise ValueError("Embedding norm invalid or zero; cannot normalize.")
    return (vec / norm).astype(np.float32)


def fetch_image(session: requests.Session, url: str) -> Optional[Image.Image]:
    """Download image (RGB) with retry handling."""
    for attempt in range(1, MAX_DOWNLOAD_RETRIES + 1):
        try:
            resp = session.get(url, timeout=DOWNLOAD_TIMEOUT_SEC)
            if resp.status_code == 200:
                byte_stream = io.BytesIO(resp.content)
                img = Image.open(byte_stream).convert("RGB")
                return img
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
        except Exception as exc:
            if attempt == MAX_DOWNLOAD_RETRIES:
                print(f"[WARN] Failed to download {url}: {exc}")
            time.sleep(1.5 * attempt)
    return None


def make_templates(
    card_id: str,
    image_url: str,
    embedder,
    session: requests.Session,
) -> List[TemplateRecord]:
    """Create template embeddings (official art + hflip) for one card."""
    pil_img = fetch_image(session, image_url)
    if pil_img is None:
        return []

    templates: List[TemplateRecord] = []
    set_id = (card_id.split("-", 1)[0] if "-" in card_id else None) or None
    variant = None

    # Official art (base)
    base_vec = ensure_unit_vector(np.array(embedder.embed(pil_img), dtype=np.float32))
    templates.append(
        TemplateRecord(
            id=deterministic_template_id(card_id, "official_art", variant, None),
            card_id=card_id,
            set_id=set_id,
            variant=variant,
            source="official_art",
            aug_tag=None,
            emb=base_vec.tolist(),
        )
    )

    # Horizontal flip augmentation
    flipped_img = pil_img.transpose(Image.FLIP_LEFT_RIGHT)
    flipped_vec = ensure_unit_vector(np.array(embedder.embed(flipped_img), dtype=np.float32))
    templates.append(
        TemplateRecord(
            id=deterministic_template_id(card_id, "aug", variant, "hflip"),
            card_id=card_id,
            set_id=set_id,
            variant=variant,
            source="aug",
            aug_tag="hflip",
            emb=flipped_vec.tolist(),
        )
    )

    return templates


def upsert_templates(supabase_client, records: Sequence[TemplateRecord]) -> None:
    """Upsert template records into Supabase in small chunks to avoid timeout."""
    payload = [
        {
            "id": rec.id,
            "card_id": rec.card_id,
            "set_id": rec.set_id,
            "variant": rec.variant,
            "source": rec.source,
            "aug_tag": rec.aug_tag,
            "emb": rec.emb,
        }
        for rec in records
    ]
    
    # Split into micro-batches of 10 to avoid statement timeout
    MICRO_BATCH = 10
    for i in range(0, len(payload), MICRO_BATCH):
        micro_batch = payload[i:i+MICRO_BATCH]
        supabase_client.table("card_templates").upsert(micro_batch, on_conflict="id").execute()
        time.sleep(0.1)  # Small delay between batches


def rebuild_prototypes(supabase_client) -> None:
    """Rebuild card_prototypes by averaging templates per card_id."""
    print("\n[INFO] Rebuilding card_prototypes...")
    
    # Fetch all templates
    print("[INFO] Fetching templates...")
    templates = supabase_client.table("card_templates").select("card_id, set_id, emb").execute()
    
    # Group by card_id
    from collections import defaultdict
    card_groups = defaultdict(list)
    set_ids = {}
    
    for t in templates.data:
        card_id = t["card_id"]
        emb = t["emb"]
        # Handle string representation of vector
        if isinstance(emb, str):
            # Remove brackets and parse as floats
            emb = emb.strip("[]")
            emb = np.array([float(x) for x in emb.split(",")], dtype=np.float32)
        else:
            emb = np.array(emb, dtype=np.float32)
        card_groups[card_id].append(emb)
        set_ids[card_id] = t.get("set_id")
    
    print(f"[INFO] Computing prototypes for {len(card_groups)} cards...")
    
    # Compute mean → L2 normalize
    prototypes = []
    for card_id, embs in card_groups.items():
        mean_emb = np.mean(embs, axis=0)
        norm_emb = ensure_unit_vector(mean_emb)
        prototypes.append({
            "card_id": card_id,
            "set_id": set_ids.get(card_id),
            "emb": norm_emb.tolist(),
            "template_count": len(embs),
        })
    
    # Upsert in batches
    print(f"[INFO] Upserting {len(prototypes)} prototypes...")
    for i in range(0, len(prototypes), 50):
        batch = prototypes[i:i+50]
        supabase_client.table("card_prototypes").upsert(batch, on_conflict="card_id").execute()
        if (i + 50) % 500 == 0:
            print(f"[INFO] Progress: {min(i+50, len(prototypes))} / {len(prototypes)}")
        time.sleep(0.1)
    
    print(f"[OK] Rebuilt {len(prototypes)} prototypes")


def main() -> None:
    parser = argparse.ArgumentParser(description="Rebuild card_templates with ViT-L-14-336")
    parser.add_argument("--limit", type=int, default=None, help="Process only the first N cards")
    parser.add_argument("--skip-clear", action="store_true", help="Don't delete existing templates (incremental mode)")
    parser.add_argument("--skip-prototypes", action="store_true", help="Don't rebuild prototypes after templates")
    parser.add_argument("--dry-run", action="store_true", help="Compute embeddings without writing to database")
    args = parser.parse_args()

    print("[INFO] Initializing Supabase client...")
    supabase = get_supabase_client()
    
    print("[INFO] Loading OpenCLIP ViT-L/14-336 embedder...")
    embedder = build_default_embedder()
    print(f"[OK] Embedder ready on device={embedder.device_str}, dim={embedder.embed_dim}")

    if not args.skip_clear and not args.dry_run:
        print("\n[INFO] Clearing existing templates...")
        try:
            # Delete templates in small batches to avoid timeout
            print("[INFO] Counting existing templates...")
            count_result = supabase.table("card_templates").select("id", count="exact").in_(
                "source", ["official_art", "aug"]
            ).limit(1).execute()
            
            total_to_delete = count_result.count if hasattr(count_result, 'count') else 0
            print(f"[INFO] Found ~{total_to_delete} templates to clear")
            
            if total_to_delete > 0:
                # Delete in batches of 1000
                deleted = 0
                while True:
                    batch = supabase.table("card_templates").select("id").in_(
                        "source", ["official_art", "aug"]
                    ).limit(1000).execute()
                    
                    if not batch.data:
                        break
                    
                    ids = [row["id"] for row in batch.data]
                    supabase.table("card_templates").delete().in_("id", ids).execute()
                    deleted += len(ids)
                    print(f"[INFO] Deleted {deleted} templates...")
                    time.sleep(0.5)
                
                print(f"[OK] Cleared {deleted} existing templates")
            else:
                print("[OK] No existing templates to clear")
        except Exception as e:
            print(f"[WARN] Clear operation issue: {e}")
            print("[INFO] Continuing with rebuild (templates will be overwritten)...")

    # Fetch all cards with images
    print(f"\n[INFO] Fetching cards from database{f' (limit={args.limit})' if args.limit else ''}...")
    query = supabase.table("cards").select("pokemon_tcg_api_id, image_urls")
    
    if args.limit:
        query = query.limit(args.limit)
    
    cards_response = query.execute()
    cards = cards_response.data
    
    print(f"[OK] Found {len(cards)} cards to process")

    total_cards = 0
    total_templates = 0
    skipped_cards = 0
    buffered: List[TemplateRecord] = []

    start_time = time.time()
    with requests.Session() as session:
        for i, card in enumerate(cards):
            card_id = card.get("pokemon_tcg_api_id")
            image_urls = card.get("image_urls") or {}
            image_url = image_urls.get("large") or image_urls.get("small")
            
            if not card_id or not image_url:
                skipped_cards += 1
                continue

            try:
                templates = make_templates(card_id, image_url, embedder, session)
            except Exception as exc:
                print(f"[WARN] Failed to embed card {card_id}: {exc}")
                skipped_cards += 1
                continue

            if not templates:
                skipped_cards += 1
                continue

            total_cards += 1
            total_templates += len(templates)
            buffered.extend(templates)

            # Upsert in batches
            if not args.dry_run and len(buffered) >= UPSERT_BATCH_SIZE:
                chunk = buffered[:UPSERT_BATCH_SIZE]
                upsert_templates(supabase, chunk)
                elapsed = time.time() - start_time
                rate = total_cards / elapsed if elapsed > 0 else 0
                eta = (len(cards) - i) / rate if rate > 0 else 0
                print(
                    f"[INFO] Progress: {total_cards}/{len(cards)} cards "
                    f"({total_templates} templates) | "
                    f"{rate:.1f} cards/s | "
                    f"ETA: {eta/60:.1f}min"
                )
                buffered = buffered[UPSERT_BATCH_SIZE:]

    # Final upsert
    if not args.dry_run and buffered:
        upsert_templates(supabase, buffered)
        print(f"[INFO] Upserted remaining {len(buffered)} templates")

    elapsed = time.time() - start_time
    print(
        f"\n[DONE] Gallery rebuild complete!"
        f"\n  - Processed: {total_cards} cards"
        f"\n  - Skipped: {skipped_cards} cards"
        f"\n  - Templates: {total_templates}"
        f"\n  - Time: {elapsed/60:.1f} minutes"
        f"\n  - Rate: {total_cards/elapsed:.1f} cards/s"
    )

    # Rebuild prototypes
    if not args.skip_prototypes and not args.dry_run:
        rebuild_prototypes(supabase)
    
    print("\n[OK] All done! Run CLIP test suite to verify accuracy improvement.")


if __name__ == "__main__":
    main()

