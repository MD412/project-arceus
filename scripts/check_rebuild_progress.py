#!/usr/bin/env python3
"""
Quick status check for gallery rebuild progress.
"""
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from worker.config import get_supabase_client

def main():
    supabase = get_supabase_client()
    
    # Count templates by source
    print("\n[INFO] Template counts:")
    sources = ["official_art", "aug", "user_scan"]
    for source in sources:
        result = supabase.table("card_templates").select("id", count="exact").eq("source", source).limit(1).execute()
        count = result.count if hasattr(result, 'count') else 0
        print(f"  {source:15s}: {count:>7,}")
    
    # Total templates
    result = supabase.table("card_templates").select("id", count="exact").limit(1).execute()
    total = result.count if hasattr(result, 'count') else 0
    print(f"  {'TOTAL':15s}: {total:>7,}")
    
    # Prototypes
    result = supabase.table("card_prototypes").select("card_id", count="exact").limit(1).execute()
    proto_count = result.count if hasattr(result, 'count') else 0
    print(f"\n[INFO] Prototypes: {proto_count:,}")
    
    # Expected: 15,504 cards × 2 templates = 31,008 templates
    expected = 19411 * 2  # Total cards in database
    progress = (total / expected) * 100 if expected > 0 else 0
    print(f"\n[INFO] Progress: {progress:.1f}% ({total:,} / {expected:,} templates)")
    print(f"[INFO] Estimated completion: ~{((expected - total) / 2) / 2.7 / 60:.1f} hours remaining")

if __name__ == "__main__":
    main()




