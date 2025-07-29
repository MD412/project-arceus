#!/usr/bin/env python3
"""
Fix set_code values in card_embeddings table
Extracts set_code from card_id format (e.g., "base1-51" -> set_code="base1")
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Missing Supabase environment variables")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def fix_set_codes():
    """Fix set_code values by extracting from card_id"""
    print("🔧 Fixing set_code values in card_embeddings...")
    
    supabase = get_supabase_client()
    
    # Get all cards with NULL set_code
    response = supabase.table("card_embeddings").select("card_id").is_("set_code", "null").execute()
    
    if not response.data:
        print("✅ No cards with NULL set_code found")
        return
    
    print(f"📊 Found {len(response.data)} cards with NULL set_code")
    
    # Process in batches
    batch_size = 100
    total_updated = 0
    
    for i in range(0, len(response.data), batch_size):
        batch = response.data[i:i + batch_size]
        
        # Extract set_code from card_id for each card in batch
        updates = []
        for card in batch:
            card_id = card["card_id"]
            if "-" in card_id:
                set_code = card_id.split("-")[0]
                updates.append({
                    "card_id": card_id,
                    "set_code": set_code
                })
        
        if updates:
            try:
                # Update the batch
                supabase.table("card_embeddings").upsert(updates).execute()
                total_updated += len(updates)
                print(f"✅ Updated batch {i//batch_size + 1}: {len(updates)} cards")
            except Exception as e:
                print(f"❌ Failed to update batch {i//batch_size + 1}: {e}")
    
    print(f"🎉 Fixed set_code for {total_updated} cards")

if __name__ == "__main__":
    fix_set_codes() 