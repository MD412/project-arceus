#!/usr/bin/env python3
"""Find Great Tusk detections to use as templates."""
import sys
import os
import io
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from worker.config import get_supabase_client
from PIL import Image
import requests

sb = get_supabase_client()

# Search for Great Tusk ex (svp-72)
result = sb.table('card_detections').select('id, scan_id, crop_url, guess_external_id, created_at').eq('guess_external_id', 'svp-72').order('created_at', desc=True).limit(10).execute()

print(f"Found {len(result.data)} Great Tusk ex (svp-72) detections:")
if result.data:
    for r in result.data:
        print(f"\n  ID: {r['id']}")
        print(f"  Scan: {r['scan_id']}")
        print(f"  Crop: {r['crop_url']}")
        print(f"  Time: {r['created_at']}")
        
    # Download the most recent crop
    most_recent = result.data[0]
    crop_url = most_recent['crop_url']
    
    if crop_url:
        print(f"\nDownloading most recent Great Tusk crop...")
        # Get from Supabase storage
        try:
            response = sb.storage.from_('scans').download(crop_url)
            img = Image.open(io.BytesIO(response))
            
            # Save locally for inspection
            save_path = 'great_tusk_crop.jpg'
            img.save(save_path)
            print(f"✅ Saved to {save_path} - This is what the user has been scanning!")
            print(f"   Dimensions: {img.size}")
            
            # This is the ACTUAL crop we should add as a template for sv3-92 (Greavard)
            # since user says it's really Greavard
            
        except Exception as e:
            print(f"❌ Failed to download: {e}")
else:
    print("  None found")
