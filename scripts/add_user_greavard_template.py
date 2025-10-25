#!/usr/bin/env python3
"""Add the user's actual Greavard scan as a template."""
import sys
import os
import uuid
from PIL import Image
import numpy as np
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from worker.openclip_embedder import build_default_embedder
from worker.config import get_supabase_client

def ensure_unit_vector(vec: np.ndarray) -> np.ndarray:
    """Re-normalize to L2=1.0."""
    norm = np.linalg.norm(vec)
    if not np.isfinite(norm) or norm <= 0:
        raise ValueError("Embedding norm invalid or zero; cannot normalize.")
    return (vec / norm).astype(np.float32)

print("🔧 Adding YOUR ACTUAL Greavard scan as template\n")

embedder = build_default_embedder()
sb = get_supabase_client()

# Load the actual scan the user has been using
img_path = 'great_tusk_crop.jpg'
img = Image.open(img_path).convert("RGB")
print(f"📸 Loaded {img_path}: {img.size}")

# Embed it
emb = embedder.embed(img, tta_views=2)
emb = ensure_unit_vector(emb)

# Create template record for sv3-92 (Greavard)
template_id = str(uuid.uuid4())
record = {
    "id": template_id,
    "card_id": "sv3-92",  # Greavard
    "set_id": "sv3",
    "variant": None,
    "source": "user_scan",  # Mark as user's actual scan
    "aug_tag": "great_tusk_misidentified",  # Track this was the Great Tusk confusion
    "emb": emb.tolist()
}

print(f"📤 Adding template for sv3-92 (Greavard) from user's actual scan...")
sb.table("card_templates").upsert([record], on_conflict="id").execute()
print("✅ Done! Added YOUR scan as template")

# Rebuild prototype
print(f"\n🔄 Rebuilding prototype for sv3-92...")
os.system("python scripts/build_prototypes.py --card-id sv3-92")

print("\n🎯 Now your Greavard scan should match perfectly!")
