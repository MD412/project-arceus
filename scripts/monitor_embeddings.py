#!/usr/bin/env python3
"""Monitor card embeddings ETL progress"""
import sys
import time
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent / "worker"))
from config import get_supabase_client

def monitor_progress():
    """Monitor embedding count in real-time"""
    supabase = get_supabase_client()
    
    print("Monitoring card_embeddings table...")
    print("-" * 40)
    
    last_count = 0
    while True:
        try:
            result = supabase.from_("card_embeddings").select("card_id", count="exact").execute()
            current_count = result.count or 0
            
            if current_count != last_count:
                diff = current_count - last_count
                rate = f"+{diff}" if diff > 0 else str(diff)
                print(f"Embeddings: {current_count:,} ({rate})")
                last_count = current_count
            
            # Exit when we hit a reasonable target
            if current_count >= 15000:
                print(f"\n✅ Target reached! {current_count:,} embeddings stored.")
                break
                
            time.sleep(5)  # Check every 5 seconds
            
        except KeyboardInterrupt:
            print(f"\nStopped. Final count: {last_count:,}")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    monitor_progress() 