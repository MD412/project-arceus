#!/usr/bin/env python3
"""
Build per-card prototype embeddings from card_templates entries.

Computes the mean of template embeddings, re-normalizes to L2=1.0, and upserts
into the `card_prototypes` table.
"""
from __future__ import annotations

import argparse
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Optional, Sequence

import numpy as np
import json
from postgrest.exceptions import APIError

import sys

CURRENT_DIR = Path(__file__).parent
PROJECT_ROOT = CURRENT_DIR.parent

sys.path.insert(0, str(PROJECT_ROOT))

from worker.config import get_supabase_client  # type: ignore

PAGE_SIZE = 500
UPSERT_BATCH_SIZE = 200


def ensure_unit_vector(vec: np.ndarray) -> np.ndarray:
    """Normalize the vector to unit length."""
    norm = np.linalg.norm(vec)
    if not np.isfinite(norm) or norm <= 0:
        raise ValueError("Cannot normalize zero-length vector.")
    return (vec / norm).astype(np.float32)


def fetch_templates(supabase_client, card_filter: Optional[Sequence[str]] = None) -> Iterator[Dict]:
    """
    Stream template rows ordered by card_id.

    Uses pagination via range() to avoid large payloads.
    """
    start = 0
    filter_values = list(card_filter) if card_filter else None
    while True:
        end = start + PAGE_SIZE - 1
        query = (
            supabase_client.table("card_templates")
            .select("card_id,set_id,emb")
            .order("card_id", desc=False)
        )
        if filter_values:
            query = query.in_("card_id", filter_values)
        response = query.range(start, end).execute()
        rows = response.data or []
        if not rows:
            break
        for row in rows:
            yield row
        if len(rows) < PAGE_SIZE:
            break
        start += PAGE_SIZE


def compute_prototypes(rows: Iterable[Dict]) -> Iterator[Dict]:
    """Group template rows by card_id and compute normalized mean embedding."""
    current_card: Optional[str] = None
    accumulator: List[np.ndarray] = []
    current_set: Optional[str] = None

    for row in rows:
        card_id = row.get("card_id")
        if not card_id:
            continue

        if current_card is None:
            current_card = card_id

        if card_id != current_card:
            if accumulator:
                yield build_prototype_record(current_card, current_set, accumulator)
            current_card = card_id
            accumulator = []
            current_set = None

        emb = row.get("emb")
        if emb is None:
            continue
        # Accept vector coming back as JSON array, Python list, or string (pgvector)
        vec: Optional[np.ndarray] = None
        if isinstance(emb, list):
            vec = np.asarray(emb, dtype=np.float32)
        elif isinstance(emb, str):
            s = emb.strip()
            try:
                if s.startswith("[") and s.endswith("]"):
                    vec = np.asarray(json.loads(s), dtype=np.float32)
                else:
                    # Fallback: comma-separated without brackets
                    vec = np.fromstring(s, sep=",", dtype=np.float32)
            except Exception:
                # Last resort: strip brackets and parse
                s2 = s.strip("[]")
                vec = np.fromstring(s2, sep=",", dtype=np.float32)
        else:
            # Unknown type, skip
            vec = None

        if vec is None or vec.size == 0:
            continue
        accumulator.append(vec)

        if current_set is None:
            set_id = row.get("set_id")
            if set_id:
                current_set = set_id

    if current_card and accumulator:
        yield build_prototype_record(current_card, current_set, accumulator)


def build_prototype_record(card_id: str, set_id: Optional[str], vectors: List[np.ndarray]) -> Dict:
    """Create a payload dict for upserting into card_prototypes."""
    stacked = np.vstack(vectors)
    mean_vec = stacked.mean(axis=0)
    normalized = ensure_unit_vector(mean_vec)

    fallback_set = set_id
    if not fallback_set and "-" in card_id:
        fallback_set = card_id.split("-", 1)[0]

    return {
        "card_id": card_id,
        "set_id": fallback_set,
        "emb": normalized.tolist(),
        "template_count": len(vectors),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def upsert_prototypes(supabase_client, records: Sequence[Dict]) -> None:
    """Upsert prototype rows into Supabase."""
    supabase_client.table("card_prototypes").upsert(records, on_conflict="card_id").execute()


def main() -> None:
    parser = argparse.ArgumentParser(description="Build card prototypes from card_templates.")
    parser.add_argument(
        "--card-id",
        dest="card_ids",
        action="append",
        help="Restrict processing to specific card_id values (repeatable).",
    )
    parser.add_argument("--dry-run", action="store_true", help="Compute without writing results.")
    args = parser.parse_args()

    print("[INFO] Initializing Supabase client...")
    supabase = get_supabase_client()

    start = time.time()
    processed_cards = 0
    buffer: List[Dict] = []

    rows_iter = fetch_templates(supabase, card_filter=args.card_ids)
    try:
        for prototype in compute_prototypes(rows_iter):
            processed_cards += 1
            buffer.append(prototype)
            if not args.dry_run and len(buffer) >= UPSERT_BATCH_SIZE:
                upsert_prototypes(supabase, buffer)
                print(f"[INFO] Upserted {len(buffer)} prototypes (total cards={processed_cards})")
                buffer = []
    except APIError as api_err:
        if getattr(api_err, "code", None) == "42P01":
            print("[ERROR] card_templates table not found. Apply the Phase 2 migration before building prototypes.")
            return
        raise

    if not args.dry_run and buffer:
        upsert_prototypes(supabase, buffer)
        print(f"[INFO] Upserted remaining {len(buffer)} prototypes.")

    elapsed = time.time() - start
    print(
        f"[DONE] Processed cards={processed_cards}, "
        f"dry_run={args.dry_run}, elapsed={elapsed:.1f}s"
    )


if __name__ == "__main__":
    main()
