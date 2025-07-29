#!/usr/bin/env python3
"""
Analyze CLIP performance and suggest optimal thresholds based on training data
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'worker'))

from clip_lookup import CLIPCardIdentifier

def main():
    print("🚀 CLIP Threshold Analysis Tool")
    print("=" * 50)
    
    # Initialize CLIP
    print("\n📦 Loading CLIP model...")
    clip = CLIPCardIdentifier()
    
    # Analyze non-card examples
    print("\n🔍 Analyzing 'not a card' examples...")
    import os
    training_dir = os.path.join(os.path.dirname(__file__), '..', 'training_data', 'card_crops', 'not_a_card')
    training_dir = os.path.abspath(training_dir)
    print(f"Looking for training data in: {training_dir}")
    result = clip.analyze_confidence_distribution(training_dir)
    
    if result:
        suggested = result['suggested_threshold']
        stats = result['non_card_stats']
        
        print(f"\n🎯 RECOMMENDATION:")
        print(f"   Current threshold in code: {clip.similarity_threshold}")
        print(f"   💡 Suggested threshold: {suggested:.3f}")
        
        if suggested > clip.similarity_threshold:
            print(f"   📈 INCREASE threshold by {suggested - clip.similarity_threshold:.3f}")
            print(f"      → Will reduce false positives (non-cards identified as cards)")
        elif suggested < clip.similarity_threshold:
            print(f"   📉 DECREASE threshold by {clip.similarity_threshold - suggested:.3f}")  
            print(f"      → Will capture more edge cases but may increase false positives")
        else:
            print(f"   ✅ Current threshold is optimal")
        
        print(f"\n📊 Training Data Statistics:")
        print(f"   Non-card samples: {stats['samples']}")
        print(f"   Average similarity: {stats['mean']:.3f}")
        print(f"   Max similarity: {stats['max']:.3f}")
        print(f"   Standard deviation: {stats['std']:.3f}")
        
        # Test on some real card examples if available
        print(f"\n🃏 Testing on real card examples...")
        real_card_dir = "training_data/card_crops/correct"
        if os.path.exists(real_card_dir):
            real_scores = []
            for img_file in os.listdir(real_card_dir)[:10]:  # Sample 10 real cards
                if img_file.endswith('.jpg'):
                    try:
                        result = clip.identify_card_from_crop(
                            os.path.join(real_card_dir, img_file), 
                            similarity_threshold=0.0
                        )
                        if result.get('similarity'):
                            real_scores.append(result['similarity'])
                            print(f"   Real card '{img_file}': {result['similarity']:.3f}")
                    except Exception as e:
                        print(f"   Error processing {img_file}: {e}")
            
            if real_scores:
                import numpy as np
                avg_real = np.mean(real_scores)
                min_real = np.min(real_scores)
                print(f"\n   Real card average: {avg_real:.3f}")
                print(f"   Real card minimum: {min_real:.3f}")
                
                # Ensure suggested threshold doesn't exclude real cards
                if suggested > min_real:
                    adjusted = min_real - 0.02  # Leave 2% buffer
                    print(f"   ⚠️  Suggested threshold {suggested:.3f} would exclude real cards!")
                    print(f"   🔧 Adjusting to {adjusted:.3f} to preserve real card detection")
                    suggested = adjusted
        
        return suggested
    else:
        print("\n❌ No training data found. Cannot suggest threshold.")
        return None

if __name__ == "__main__":
    main() 