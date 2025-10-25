#!/usr/bin/env python3
"""
Phase 4: Threshold Calibration for Retrieval v2

Sweeps UNKNOWN_THRESHOLD over real card crops to find optimal value targeting ≥99% precision.
"""
import sys
import os
import json
import pathlib
from typing import Dict, List, Tuple
from dataclasses import dataclass
from PIL import Image

# Add worker to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from worker.retrieval_v2 import identify_v2
from worker.config import get_supabase_client

@dataclass
class TestCase:
    """Single test case with ground truth"""
    image_path: pathlib.Path
    card_id: str
    name: str
    set_id: str

@dataclass
class ThresholdResult:
    """Results at a specific threshold"""
    threshold: float
    true_positives: int
    false_positives: int
    false_negatives: int
    precision: float
    recall: float
    f1: float

class ThresholdCalibrator:
    """Calibrate UNKNOWN_THRESHOLD for retrieval v2"""
    
    def __init__(self):
        self.fixtures_dir = pathlib.Path(__file__).parent.parent / "__tests__" / "ocr" / "fixtures"
        self.supabase = get_supabase_client()
        self.test_cases: List[TestCase] = []
        
    def load_test_cases(self) -> int:
        """Load all test cases with ground truth"""
        for img_path in self.fixtures_dir.glob("*.jpg"):
            json_path = img_path.with_suffix(".json")
            if not json_path.exists():
                print(f"⚠️  Skipping {img_path.name} - no ground truth JSON")
                continue
                
            try:
                with open(json_path) as f:
                    gt = json.load(f)
                    
                self.test_cases.append(TestCase(
                    image_path=img_path,
                    card_id=gt["card_id"],
                    name=gt["name"],
                    set_id=gt["set_id"]
                ))
                print(f"✅ Loaded {img_path.name} → {gt['card_id']} ({gt['name']})")
            except (json.JSONDecodeError, KeyError) as e:
                print(f"❌ Failed to load {json_path}: {e}")
                
        return len(self.test_cases)
    
    def run_at_threshold(self, threshold: float, verbose: bool = False) -> ThresholdResult:
        """Run all test cases at a specific threshold"""
        # Temporarily override threshold in config
        import worker.config as config
        original_threshold = config.UNKNOWN_THRESHOLD
        config.UNKNOWN_THRESHOLD = threshold
        
        tp = fp = fn = 0
        
        for tc in self.test_cases:
            img = Image.open(tc.image_path).convert("RGB")
            
            # Run retrieval v2
            result = identify_v2(img, self.supabase, topk=200, set_hint=tc.set_id)
            
            predicted_id = result.get("card_id")
            best_score = result.get("best_score", 0.0)
            thresholded = result.get("thresholded", False)
            candidates = result.get("candidates", [])
            
            # Show scores if verbose
            if verbose:
                status = "✅" if predicted_id == tc.card_id else ("❌" if predicted_id else "🚫")
                print(f"   {status} {tc.image_path.name}: {tc.card_id}")
                print(f"      Predicted: {predicted_id or 'UNKNOWN'}")
                print(f"      Best score: {best_score:.4f}")
                if candidates:
                    top5 = candidates[:5]
                    print(f"      Top-5:")
                    for i, c in enumerate(top5, 1):
                        marker = " ← CORRECT" if c.get('card_id') == tc.card_id else ""
                        print(f"        {i}. {c.get('card_id')}: fused={c.get('fused', 0):.4f}, tpl={c.get('template_score', 0):.4f}, proto={c.get('proto_score', 0):.4f}{marker}")
                print()
            
            # Evaluate prediction
            if predicted_id is None:
                # Model said UNKNOWN
                fn += 1  # Should have identified but didn't
            elif predicted_id == tc.card_id:
                # Correct identification
                tp += 1
            else:
                # Wrong identification
                fp += 1
        
        # Restore original threshold
        config.UNKNOWN_THRESHOLD = original_threshold
        
        # Calculate metrics
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        
        return ThresholdResult(
            threshold=threshold,
            true_positives=tp,
            false_positives=fp,
            false_negatives=fn,
            precision=precision,
            recall=recall,
            f1=f1
        )
    
    def sweep_thresholds(self, thresholds: List[float]) -> List[ThresholdResult]:
        """Sweep multiple thresholds and return results"""
        results = []
        
        print(f"\n🎯 Sweeping {len(thresholds)} thresholds over {len(self.test_cases)} test cases\n")
        
        for idx, thresh in enumerate(thresholds):
            print(f"Testing threshold {thresh:.2f}...")
            # Show verbose debug on first threshold only
            verbose = (idx == 0)
            result = self.run_at_threshold(thresh, verbose=verbose)
            results.append(result)
            print(f"   P={result.precision*100:.1f}%, R={result.recall*100:.1f}%, F1={result.f1:.3f}\n")
            
        return results
    
    def find_optimal_threshold(self, results: List[ThresholdResult], min_precision: float = 0.99) -> ThresholdResult:
        """Find threshold with ≥min_precision and highest recall"""
        # Filter to thresholds meeting precision requirement
        candidates = [r for r in results if r.precision >= min_precision]
        
        if not candidates:
            print(f"\n⚠️  No threshold achieved {min_precision*100:.0f}% precision!")
            print("Showing best precision available:")
            best_prec = max(results, key=lambda r: r.precision)
            return best_prec
        
        # Among candidates, pick highest recall (or F1 as tiebreaker)
        optimal = max(candidates, key=lambda r: (r.recall, r.f1))
        return optimal

def main():
    print("🚀 Phase 4: Threshold Calibration for Retrieval v2\n")
    
    calibrator = ThresholdCalibrator()
    
    # Load test cases
    num_cases = calibrator.load_test_cases()
    if num_cases == 0:
        print("❌ No test cases found!")
        return 1
    
    print(f"\n📊 Loaded {num_cases} test cases")
    
    # Sweep thresholds
    thresholds = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90]
    results = calibrator.sweep_thresholds(thresholds)
    
    # Find optimal
    print(f"\n{'='*60}")
    optimal = calibrator.find_optimal_threshold(results, min_precision=0.99)
    
    print(f"\n🎯 OPTIMAL THRESHOLD: {optimal.threshold:.2f}")
    print(f"   Precision: {optimal.precision*100:.1f}%")
    print(f"   Recall: {optimal.recall*100:.1f}%")
    print(f"   F1 Score: {optimal.f1:.3f}")
    print(f"   TP={optimal.true_positives}, FP={optimal.false_positives}, FN={optimal.false_negatives}")
    
    # Show full results table
    print(f"\n{'='*60}")
    print("📈 Full Results:")
    print(f"{'Threshold':<12}{'Precision':<12}{'Recall':<12}{'F1':<12}{'TP/FP/FN'}")
    print("-" * 60)
    for r in results:
        marker = " ← OPTIMAL" if r.threshold == optimal.threshold else ""
        print(f"{r.threshold:<12.2f}{r.precision*100:<11.1f}%{r.recall*100:<11.1f}%{r.f1:<12.3f}{r.true_positives}/{r.false_positives}/{r.false_negatives}{marker}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

