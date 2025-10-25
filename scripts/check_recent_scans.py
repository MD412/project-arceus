#!/usr/bin/env python3
"""Check recent scans for potential templates."""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from worker.config import get_supabase_client

sb = get_supabase_client()

# Get recent scans
result = sb.table('scans').select('id, created_at, status').order('created_at', desc=True).limit(10).execute()

print('Recent scans:')
if result.data:
    for r in result.data:
        print(f"  {r['id']}: {r['created_at']} ({r['status']})")
else:
    print('  None found')

# Check if any have crops stored
if result.data:
    scan_id = result.data[0]['id']
    print(f"\nChecking crops for latest scan {scan_id}...")
    
    # Check detections
    det_result = sb.table('card_detections').select('id, crop_url, guess_external_id').eq('scan_id', scan_id).execute()
    if det_result.data:
        print(f"Found {len(det_result.data)} detections:")
        for d in det_result.data:
            ext_id = d.get('guess_external_id') or 'UNKNOWN'
            crop = d.get('crop_url') or 'NO_CROP'
            print(f"  - {ext_id}: {crop}")
            
            # Check if it's Great Tusk that should be Greavard
            if 'great' in ext_id.lower() or 'tusk' in ext_id.lower():
                print(f"    ^^^ This might be the misidentified Greavard!")
    else:
        print("No detections found")
