#!/usr/bin/env python3
"""
Embed official Pokemon TCG images into the Phase 2 gallery tables.

Creates deterministic card template embeddings (OpenCLIP ViT-L/14-336, TTA=2),
including simple augmentations (horizontal flip, optional brightness tweak),
and upserts into the `card_templates` table.
"""
from __future__ import annotations

import argparse
import io
import json
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence

import numpy as np
import requests
from PIL import Image, ImageEnhance

import sys

CURRENT_DIR = Path(__file__).parent
PROJECT_ROOT = CURRENT_DIR.parent

# Ensure we can import from the project root and worker package
sys.path.insert(0, str(PROJECT_ROOT))

from worker.openclip_embedder import build_default_embedder  # type: ignore
from worker.config import get_supabase_client  # type: ignore

DATA_DIR = PROJECT_ROOT / "Pokemon-tcg-data" / "cards" / "en"
CARD_BATCH_SIZE = 8
UPSERT_BATCH_SIZE = 48
DOWNLOAD_TIMEOUT_SEC = 20
MAX_DOWNLOAD_RETRIES = 3
BRIGHTNESS_GAIN = 1.1
BRIGHTNESS_TAG = f"brightness+{int((BRIGHTNESS_GAIN - 1) * 100)}"


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


def all_cards(limit: Optional[int] = None, start_after: Optional[str] = None) -> Iterable[Dict]:
    """Yield card dictionaries from the Pokemon-tcg-data repo."""
    yielded = 0
    resume = start_after is not None
    for json_path in sorted(DATA_DIR.glob("*.json")):
        with json_path.open("r", encoding="utf-8") as handle:
            try:
                cards = json.load(handle)
            except json.JSONDecodeError as exc:
                print(f"[WARN] Skipping {json_path.name}: {exc}")
                continue
        for card in cards:
            card_id = card.get("id")
            if not card_id:
                continue
            if resume:
                if card_id == start_after:
                    resume = False
                continue
            yield card
            yielded += 1
            if limit is not None and yielded >= limit:
                return


def make_templates(
    card: Dict,
    embedder,
    session: requests.Session,
    include_brightness: bool,
) -> List[TemplateRecord]:
    """Create template embeddings (official art + augmentations) for one card."""
    images = card.get("images", {})
    image_url = images.get("large") or images.get("small")
    if not image_url:
        return []

    pil_img = fetch_image(session, image_url)
    if pil_img is None:
        print(f"[WARN] No image fetched for card {card.get('id')}")
        return []

    templates: List[TemplateRecord] = []
    card_id = card["id"]
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

    if include_brightness:
        enhancer = ImageEnhance.Brightness(pil_img)
        bright_img = enhancer.enhance(BRIGHTNESS_GAIN)
        bright_vec = ensure_unit_vector(np.array(embedder.embed(bright_img), dtype=np.float32))
        templates.append(
            TemplateRecord(
                id=deterministic_template_id(
                    card_id,
                    "aug",
                    variant,
                    f"brightness+{int((BRIGHTNESS_GAIN - 1) * 100)}",
                ),
                card_id=card_id,
                set_id=set_id,
                variant=variant,
                source="aug",
                aug_tag=BRIGHTNESS_TAG,
                emb=bright_vec.tolist(),
            )
        )

    return templates


def upsert_templates(supabase_client, records: Sequence[TemplateRecord]) -> None:
    """Upsert template records into Supabase."""
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
    supabase_client.table("card_templates").upsert(payload, on_conflict="id").execute()


def main() -> None:
    parser = argparse.ArgumentParser(description="Populate card_templates with OpenCLIP embeddings.")
    parser.add_argument("--limit", type=int, default=None, help="Process only the first N cards.")
    parser.add_argument("--start-after", type=str, default=None, help="Resume after the given card_id.")
    parser.add_argument("--disable-brightness", action="store_true", help="Skip brightness augmentation template.")
    parser.add_argument("--dry-run", action="store_true", help="Compute embeddings without writing to the database.")
    args = parser.parse_args()

    if not DATA_DIR.exists():
        raise FileNotFoundError(f"Expected card data directory at {DATA_DIR}")

    print("[INFO] Initializing Supabase client...")
    supabase = get_supabase_client()
    print("[INFO] Loading OpenCLIP ViT-L/14-336 embedder...")
    embedder = build_default_embedder()
    print(f"[OK] Embedder ready on device={embedder.device_str}, dim={embedder.embed_dim}")

    total_cards = 0
    total_templates = 0
    buffered: List[TemplateRecord] = []

    cards_iter = all_cards(limit=args.limit, start_after=args.start_after)

    start_time = time.time()
    with requests.Session() as session:
        for batch_cards in chunked_cards(cards_iter, CARD_BATCH_SIZE):
            for card in batch_cards:
                total_cards += 1
                try:
                    templates = make_templates(
                        card,
                        embedder,
                        session=session,
                        include_brightness=not args.disable_brightness,
                    )
                except Exception as exc:
                    print(f"[WARN] Failed to embed card {card.get('id')}: {exc}")
                    continue

                if not templates:
                    continue

                total_templates += len(templates)
                buffered.extend(templates)

            if not args.dry_run and len(buffered) >= UPSERT_BATCH_SIZE:
                chunk = buffered[:UPSERT_BATCH_SIZE]
                start = time.time()
                upsert_templates(supabase, chunk)
                print(
                    f"[INFO] Upserted {len(chunk)} templates "
                    f"(cards processed={total_cards}, total templates={total_templates}) "
                    f"in {time.time() - start:.2f}s"
                )
                buffered = buffered[UPSERT_BATCH_SIZE:]

    if not args.dry_run and buffered:
        upsert_templates(supabase, buffered)
        print(f"[INFO] Upserted remaining {len(buffered)} templates.")

    elapsed = time.time() - start_time
    print(
        f"[DONE] Processed cards={total_cards}, templates={total_templates}, "
        f"dry_run={args.dry_run}, elapsed={elapsed:.1f}s"
    )


def chunked_cards(iterable: Iterable[Dict], size: int) -> Iterable[List[Dict]]:
    """Helper to chunk card dictionaries."""
    chunk: List[Dict] = []
    for item in iterable:
        chunk.append(item)
        if len(chunk) >= size:
            yield chunk
            chunk = []
    if chunk:
        yield chunk


if __name__ == "__main__":
    main()
