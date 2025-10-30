#!/usr/bin/env python3
"""
Retrieval v2 pipeline: gallery template ANN search + prototype fusion.

This module keeps the logic isolated so the main worker can switch implementations
via configuration without altering the legacy retrieval path.
"""
from __future__ import annotations

from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np
from PIL import Image

from openclip_embedder import build_default_embedder
from config import (
    FUSION_WEIGHTS,
    TTA_VIEWS,
    UNKNOWN_THRESHOLD,
)

# Cache heavy embedder instance across calls
_embedder = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = build_default_embedder()
    return _embedder


def _safe_weights(weights: Sequence[float]) -> Tuple[float, float]:
    if not weights:
        return (0.7, 0.3)
    if len(weights) == 1:
        return (float(weights[0]), 0.0)
    first, second = float(weights[0]), float(weights[1])
    return first, second


def _dot(a: np.ndarray, b: np.ndarray) -> float:
    score = float(np.dot(a, b))
    # Clamp minor drift outside [-1, 1]
    if score > 1.0:
        score = 1.0
    elif score < -1.0:
        score = -1.0
    return score


def identify_v2(
    pil_image: Image.Image,
    supabase_client,
    topk: int = 200,
    set_hint: Optional[str] = None,
) -> Dict:
    """
    Execute retrieval v2 using ANN over gallery templates + prototype fusion.

    Returns:
        {
          'card_id': Optional[str],
          'best_score': float,
          'best_template_score': float,
          'best_proto_score': Optional[float],
          'candidates': List[{
              'card_id': str,
              'template_id': str,
              'set_id': Optional[str],
              'template_score': float,
              'proto_score': Optional[float],
              'fused': float,
          }],
          'thresholded': bool,
          'raw_template_matches': int
        }
    """
    embedder = _get_embedder()
    query_vec = embedder.embed(pil_image, tta_views=TTA_VIEWS).astype(np.float32)
    if topk <= 0:
        topk = 200

    payload = {
        "qvec": query_vec.tolist(),
        "match_count": int(topk),
        "set_hint": set_hint,
    }
    
    # Clear the original PIL image reference now that we have embedding
    del pil_image

    try:
        response = supabase_client.rpc("match_card_templates", payload).execute()
        template_rows = response.data or []
    except Exception as exc:  # pragma: no cover - defensive
        error_msg = str(exc)
        # Retry with smaller TopK if timeout (57014)
        if "57014" in error_msg or "statement timeout" in error_msg.lower():
            print(f"[retrieval_v2] RPC timeout, retrying with TopK=25...")
            payload["match_count"] = 25
            try:
                response = supabase_client.rpc("match_card_templates", payload).execute()
                template_rows = response.data or []
                print(f"[retrieval_v2] Retry successful with TopK=25")
            except Exception as retry_exc:
                print(f"[retrieval_v2] RPC match_card_templates failed after retry: {retry_exc}")
                return {
                    "card_id": None,
                    "best_score": 0.0,
                    "best_template_score": 0.0,
                    "best_proto_score": None,
                    "candidates": [],
                    "thresholded": True,
                    "raw_template_matches": 0,
                }
        else:
            print(f"[retrieval_v2] RPC match_card_templates failed: {exc}")
            return {
                "card_id": None,
                "best_score": 0.0,
                "best_template_score": 0.0,
                "best_proto_score": None,
                "candidates": [],
                "thresholded": True,
                "raw_template_matches": 0,
            }

    grouped: Dict[str, Dict] = {}
    for row in template_rows:
        card_id = row.get("card_id")
        if not card_id:
            continue
        score = float(row.get("score", 0.0))
        entry = grouped.get(card_id)
        if entry is None or score > entry["template_score"]:
            grouped[card_id] = {
                "card_id": card_id,
                "template_id": row.get("id"),
                "set_id": row.get("set_id"),
                "template_score": score,
            }

    if not grouped:
        return {
            "card_id": None,
            "best_score": 0.0,
            "best_template_score": 0.0,
            "best_proto_score": None,
            "candidates": [],
            "thresholded": True,
            "raw_template_matches": 0,
        }

    card_ids = list(grouped.keys())
    prototype_map: Dict[str, np.ndarray] = {}
    try:
        proto_resp = supabase_client.rpc(
            "get_card_prototypes", {"ids": card_ids}
        ).execute()
        for row in proto_resp.data or []:
            cid = row.get("card_id")
            emb = row.get("emb")
            if cid and emb:
                prototype_map[cid] = np.asarray(emb, dtype=np.float32)
    except Exception as exc:  # pragma: no cover - defensive
        print(f"[retrieval_v2] RPC get_card_prototypes failed: {exc}")

    w_template, w_proto = _safe_weights(FUSION_WEIGHTS)
    candidates: List[Dict] = []
    for card_id, data in grouped.items():
        template_score = data["template_score"]
        proto_vec = prototype_map.get(card_id)
        proto_score = _dot(query_vec, proto_vec) if proto_vec is not None else None

        fused = template_score * w_template
        if proto_score is not None:
            fused += proto_score * w_proto
        elif w_proto != 0.0:
            # Fallback: reuse template score if prototype missing but weight provided
            fused += template_score * w_proto

        candidates.append(
            {
                "card_id": card_id,
                "template_id": data.get("template_id"),
                "set_id": data.get("set_id"),
                "template_score": template_score,
                "proto_score": proto_score,
                "fused": fused,
            }
        )

    candidates.sort(key=lambda x: x["fused"], reverse=True)
    top_candidates = candidates[:5]  # Keep only top 5 for response

    best = top_candidates[0]
    best_fused = best["fused"]
    thresholded = best_fused < UNKNOWN_THRESHOLD
    
    # Build lightweight result dict first (JSONable primitives only - no tensors, no PIL)
    result = {
        "card_id": None if thresholded else best["card_id"],
        "best_score": float(best_fused),  # Explicit float conversion
        "best_template_score": float(best["template_score"]),
        "best_proto_score": float(best.get("proto_score")) if best.get("proto_score") is not None else None,
        "candidates": [
            {
                "card_id": str(c["card_id"]),
                "template_id": str(c["template_id"]) if c.get("template_id") else None,
                "set_id": str(c["set_id"]) if c.get("set_id") else None,
                "template_score": float(c["template_score"]),
                "proto_score": float(c["proto_score"]) if c.get("proto_score") is not None else None,
                "fused": float(c["fused"]),
            }
            for c in top_candidates
        ],
        "thresholded": bool(thresholded),
        "raw_template_matches": int(len(template_rows)),
    }
    
    # NOW safe to clear all intermediate heavy objects (tensors, arrays, large dicts)
    del query_vec
    del grouped
    del prototype_map
    del candidates
    del top_candidates
    del template_rows
    import gc
    gc.collect()  # Only after we've dropped all references
    
    return result
