#!/usr/bin/env python3
"""
Debug script to investigate card detections data
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'worker'))

from config import get_supabase_client

def debug_detections():
    print("🔍 Debugging Card Detections")
    print("=" * 40)
    
    supabase = get_supabase_client()
    
    # Check scan_uploads
    scan_response = supabase.table('scan_uploads').select('id, processing_status, created_at').limit(5).execute()
    print(f"📋 Recent scan_uploads: {len(scan_response.data)} found")
    for scan in scan_response.data[:3]:
        print(f"   {scan['id'][:8]}... - {scan['processing_status']}")
    
    # Check scans table (worker writes here)
    scans_response = supabase.table('scans').select('id, status, created_at').limit(5).execute()
    print(f"\n📋 Recent scans: {len(scans_response.data)} found")
    for scan in scans_response.data[:3]:
        print(f"   {scan['id'][:8]}... - {scan['status']}")
    
    # Check card_detections
    detections_response = supabase.table('card_detections').select('id, scan_id, confidence').limit(5).execute()
    print(f"\n🎯 Recent card_detections: {len(detections_response.data)} found")
    for det in detections_response.data[:3]:
        print(f"   {det['id'][:8]}... - scan: {det['scan_id'][:8]}... - conf: {det['confidence']}")
    
    # Check if there's a mismatch between scan_uploads and scans
    if scan_response.data and scans_response.data:
        scan_upload_id = scan_response.data[0]['id']
        scan_id = scans_response.data[0]['id']
        print(f"\n🔗 ID Comparison:")
        print(f"   scan_uploads[0]: {scan_upload_id}")
        print(f"   scans[0]: {scan_id}")
        print(f"   Match: {scan_upload_id == scan_id}")
        
        # Check if detections use scans IDs instead of scan_uploads IDs
        if detections_response.data:
            det_scan_id = detections_response.data[0]['scan_id']
            print(f"   detection.scan_id: {det_scan_id}")
            print(f"   Matches scans table: {det_scan_id == scan_id}")
            print(f"   Matches scan_uploads: {det_scan_id == scan_upload_id}")

if __name__ == "__main__":
    debug_detections() 