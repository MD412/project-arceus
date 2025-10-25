#!/usr/bin/env python3
"""
Print detailed scores (template, prototype, fused) for test fixtures.
Helps validate threshold choice with real score distributions.
"""
import sys
import os
import json
from pathlib import Path
from collections import defaultdict
from typing import List, Tuple
import numpy as np
from PIL import Image

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from worker.openclip_embedder import build_default_embedder
from worker.config import get_supabase_client, FUSION_WEIGHTS

def parse_vector(emb_raw):
    """Parse vector from DB (may be string or list)"""
    if isinstance(emb_raw, str):
        return np.array(json.loads(emb_raw.strip()), dtype=np.float32)
    return np.array(emb_raw, dtype=np.float32)

def compute_fused_scores(sb, query_vec, topk=200, set_hint=None):
    """Compute fused scores for all cards using retrieval v2 logic"""
    # Get template matches
    payload = {
        "qvec": query_vec.tolist(),
        "match_count": topk,
        "set_hint": set_hint
    }
    
    response = sb.rpc("match_card_templates", payload).execute()
    template_rows = response.data or []
    
    # Group by card_id, keep best template score per card
    by_card = defaultdict(list)
    for row in template_rows:
        card_id = row.get("card_id")
        score = float(row.get("score", 0.0))
        by_card[card_id].append(score)
    
    # Get prototypes
    card_ids = list(by_card.keys())
    proto_response = sb.rpc("get_card_prototypes", {"ids": card_ids}).execute()
    
    proto_map = {}
    for row in proto_response.data or []:
        cid = row.get("card_id")
        emb_raw = row.get("emb")
        if cid and emb_raw:
            proto_map[cid] = parse_vector(emb_raw)
    
    # Compute fused scores
    alpha, beta = FUSION_WEIGHTS  # 0.7, 0.3
    results = []
    
    for card_id, template_scores in by_card.items():
        best_template = max(template_scores)
        
        # Prototype similarity (dot product, both L2-normalized)
        proto_vec = proto_map.get(card_id)
        if proto_vec is not None:
            proto_sim = float(np.dot(query_vec, proto_vec))
        else:
            proto_sim = best_template  # fallback
        
        fused = alpha * best_template + beta * proto_sim
        
        results.append({
            'card_id': card_id,
            'template_score': best_template,
            'proto_score': proto_sim,
            'fused': fused
        })
    
    # Sort by fused score descending
    results.sort(key=lambda x: x['fused'], reverse=True)
    return results

def print_top5(label: str, true_card_id: str, scores: List[dict]):
    """Print top-5 with formatting"""
    print(f"\n{'='*70}")
    print(f"=== {label} (expected: {true_card_id}) ===")
    print(f"{'='*70}")
    print(f"{'Rank':<6}{'Card ID':<15}{'Template':<12}{'Prototype':<12}{'Fused':<10}{'Status'}")
    print("-" * 70)
    
    top5 = scores[:5]
    for i, score in enumerate(top5, 1):
        cid = score['card_id']
        tpl = score['template_score']
        proto = score['proto_score']
        fused = score['fused']
        
        if cid == true_card_id and i == 1:
            marker = "✅ CORRECT"
        elif cid == true_card_id:
            marker = f"• (rank #{i})"
        else:
            marker = ""
        
        print(f"#{i:<5}{cid:<15}{tpl:<12.4f}{proto:<12.4f}{fused:<10.4f}{marker}")
    
    # Show separation
    if len(scores) > 1:
        gap = scores[0]['fused'] - scores[1]['fused']
        print(f"\nGap (1st → 2nd): {gap:.4f}")

def main():
    print("🎯 Detailed Score Analysis for Test Fixtures\n")
    
    embedder = build_default_embedder()
    sb = get_supabase_client()
    
    fixtures_dir = Path("__tests__/ocr/fixtures")
    
    # Load test cases
    test_cases = []
    for img_path in fixtures_dir.glob("*.jpg"):
        json_path = img_path.with_suffix(".json")
        if json_path.exists():
            with open(json_path) as f:
                gt = json.load(f)
            img = Image.open(img_path).convert("RGB")
            test_cases.append((img_path.name, gt['card_id'], gt.get('set_id'), img))
    
    print(f"📸 Analyzing {len(test_cases)} test cases\n")
    
    all_results = []
    
    for img_name, true_id, set_id, img in test_cases:
        # Embed query
        query_vec = embedder.embed(img, tta_views=2)
        
        # Compute scores
        scores = compute_fused_scores(sb, query_vec, topk=200, set_hint=set_id)
        
        # Print results
        print_top5(img_name, true_id, scores)
        
        # Store for calibration
        all_results.append((true_id, scores))
    
    # Calibration sweep
    print(f"\n{'='*70}")
    print("THRESHOLD CALIBRATION")
    print(f"{'='*70}")
    print(f"{'Threshold':<12}{'Precision':<12}{'Recall':<12}{'Unknown Rate':<15}{'Status'}")
    print("-" * 70)
    
    thresholds = np.linspace(0.75, 0.92, 18)
    
    for tau in thresholds:
        accepted = 0
        correct = 0
        total = len(all_results)
        
        for true_id, scores in all_results:
            top1_id = scores[0]['card_id']
            top1_score = scores[0]['fused']
            
            if top1_score >= tau:
                accepted += 1
                if top1_id == true_id:
                    correct += 1
        
        precision = (correct / accepted) if accepted > 0 else 1.0
        recall = (correct / total) if total > 0 else 0.0
        unknown_rate = 1.0 - (accepted / total)
        
        status = ""
        if precision >= 0.99 and recall == 1.0:
            status = "← TARGET"
        elif precision == 1.0 and recall == 1.0:
            status = "← PERFECT"
        
        print(f"{tau:<12.3f}{precision*100:<11.1f}%{recall*100:<11.1f}%{unknown_rate*100:<14.1f}%{status}")
    
    print(f"\n{'='*70}")
    print("RECOMMENDATION")
    print(f"{'='*70}")
    print("Based on score distributions:")
    print("  • Correct cards (fused): Check top-5 tables above")
    print("  • Set τ where precision ≥99% and unknown rate is acceptable")
    print("  • Current setting: UNKNOWN_THRESHOLD=0.80")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

