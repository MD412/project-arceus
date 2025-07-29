#!/usr/bin/env python3
"""
Collect training data from recent scan uploads to build a robust dataset
for CLIP threshold optimization and bicameral AI development.
"""
import sys
import os
import requests
from pathlib import Path
from datetime import datetime, timedelta
import json

# Add worker directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'worker'))
from config import get_supabase_client

def collect_recent_scans(days_back=7, limit=200):
    """Fetch recent scan uploads that have been processed"""
    supabase = get_supabase_client()
    
    cutoff_date = (datetime.now() - timedelta(days=days_back)).isoformat()
    
    print(f"📅 Collecting scans from the last {days_back} days...")
    
    response = supabase.table('scan_uploads').select(
        'id, processing_status, created_at, storage_path, results'
    ).gte('created_at', cutoff_date).eq(
        'processing_status', 'completed'
    ).limit(limit).execute()
    
    scans = response.data
    print(f"🔍 Found {len(scans)} completed scans")
    
    return scans

def collect_card_detections(scan_upload_ids):
    """Fetch card detections from the selected scans"""
    supabase = get_supabase_client()
    
    print(f"🃏 Collecting card detections from {len(scan_upload_ids)} scan uploads...")
    
    # First, get the actual scan IDs from the results field in scan_uploads
    scan_ids = []
    for upload_id in scan_upload_ids:
        upload_response = supabase.table('scan_uploads').select('results').eq('id', upload_id).single().execute()
        if upload_response.data and upload_response.data.get('results', {}).get('scan_id'):
            scan_ids.append(upload_response.data['results']['scan_id'])
    
    print(f"🔗 Mapped to {len(scan_ids)} actual scan IDs")
    
    if not scan_ids:
        print("❌ No scan IDs found in results")
        return []
    
    response = supabase.table('card_detections').select(
        'id, scan_id, crop_url, confidence, guess_card_id, bbox, created_at'
    ).in_('scan_id', scan_ids).execute()
    
    detections = response.data
    print(f"📊 Found {len(detections)} card detections")
    
    return detections

def download_and_categorize_crops(detections, target_count=100):
    """Download crop images and categorize them for training"""
    supabase = get_supabase_client()
    
    # Create training directories
    base_dir = Path('training_data/card_crops')
    categories = {
        'correct': base_dir / 'correct',
        'wrong_id': base_dir / 'wrong_id', 
        'not_a_card': base_dir / 'not_a_card',
        'missing_from_db': base_dir / 'missing_from_db'
    }
    
    for category_dir in categories.values():
        category_dir.mkdir(parents=True, exist_ok=True)
    
    downloaded = {'correct': 0, 'wrong_id': 0, 'not_a_card': 0, 'missing_from_db': 0}
    
    print(f"⬇️  Downloading and categorizing up to {target_count} training examples...")
    
    # Sort detections by confidence (mix of high, medium, low)
    detections.sort(key=lambda x: x['confidence'] if x['confidence'] else 0, reverse=True)
    
    for i, detection in enumerate(detections):
        if sum(downloaded.values()) >= target_count:
            break
            
        crop_url = detection['crop_url']
        confidence = detection.get('confidence', 0)
        guess_card_id = detection.get('guess_card_id')
        detection_id = detection['id']
        
        try:
            # Download the crop image
            response = supabase.storage.from_('scans').download(crop_url)
            if not response:
                continue
                
            image_data = response
            
            # Categorize based on confidence and card match
            category = categorize_detection(confidence, guess_card_id)
            
            # Balance the dataset - don't oversample any category
            if downloaded[category] >= target_count // 4:
                continue
                
            # Save image to appropriate category
            filename = f"{category}_{detection_id}_{int(confidence*100) if confidence else 0}.jpg"
            filepath = categories[category] / filename
            
            with open(filepath, 'wb') as f:
                f.write(image_data)
            
            downloaded[category] += 1
            
            if (i + 1) % 10 == 0:
                print(f"   📈 Progress: {sum(downloaded.values())}/{target_count} images downloaded")
                print(f"      Distribution: {downloaded}")
                
        except Exception as e:
            print(f"   ⚠️  Failed to download {crop_url}: {e}")
            continue
    
    print(f"\n✅ Training data collection complete!")
    print(f"📊 Final distribution:")
    for category, count in downloaded.items():
        print(f"   {category}: {count} images")
    
    return downloaded

def categorize_detection(confidence, guess_card_id):
    """
    Categorize a detection based on confidence and match status
    This is heuristic-based until we have user feedback
    """
    if not confidence:
        return 'not_a_card'  # No confidence usually means not a card
    
    if confidence < 0.4:
        return 'not_a_card'  # Very low confidence = likely not a card
    elif confidence < 0.6:
        if guess_card_id:
            return 'wrong_id'  # Low confidence with match = likely wrong
        else:
            return 'missing_from_db'  # Low confidence, no match = missing
    elif confidence < 0.8:
        if guess_card_id:
            return 'correct'  # Medium confidence with match = likely correct
        else:
            return 'missing_from_db'  # Medium confidence, no match = missing
    else:
        return 'correct'  # High confidence = likely correct

def create_training_metadata(downloaded_counts):
    """Create metadata file documenting the training data collection"""
    metadata = {
        'collection_date': datetime.now().isoformat(),
        'collection_method': 'automatic_from_recent_scans',
        'total_images': sum(downloaded_counts.values()),
        'distribution': downloaded_counts,
        'categorization_method': 'heuristic_confidence_based',
        'notes': 'Initial training data collection. Categories will be refined with user feedback.',
        'next_steps': [
            'Review and manually verify categorizations',
            'Collect more user feedback through review interface',
            'Run CLIP threshold analysis on this dataset'
        ]
    }
    
    metadata_file = Path('training_data/card_crops/collection_metadata.json')
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"📝 Training metadata saved to {metadata_file}")

def main():
    print("🚀 Project Arceus Training Data Collector")
    print("=" * 50)
    
    # Step 1: Collect recent scans
    scans = collect_recent_scans(days_back=14, limit=300)  # Look back 2 weeks
    
    if not scans:
        print("❌ No recent scans found. Nothing to collect.")
        return
    
    # Step 2: Get card detections from those scans
    scan_ids = [scan['id'] for scan in scans]
    detections = collect_card_detections(scan_ids)
    
    if not detections:
        print("❌ No card detections found. Nothing to collect.")
        return
    
    # Step 3: Download and categorize crop images
    downloaded = download_and_categorize_crops(detections, target_count=120)
    
    # Step 4: Create metadata
    create_training_metadata(downloaded)
    
    print(f"\n🎯 Training data collection complete!")
    print(f"   Total images: {sum(downloaded.values())}")
    print(f"   Ready for CLIP threshold analysis!")
    print(f"\n💡 Next steps:")
    print(f"   1. Run: python scripts/analyze_clip_thresholds.py")
    print(f"   2. Review categorizations manually")
    print(f"   3. Collect more user feedback through the UI")

if __name__ == "__main__":
    main() 