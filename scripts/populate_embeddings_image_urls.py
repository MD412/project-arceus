#!/usr/bin/env python3
"""
Populate image URLs in the card_embeddings table by fetching from Pokemon TCG API
This fixes the collections page image loading issue
"""
import os
import json
import time
import requests
from typing import Dict, Optional
from config import get_supabase_client

class EmbeddingsImagePopulator:
    def __init__(self):
        self.supabase_client = get_supabase_client()
        self.pokemontcg_api_key = os.getenv('POKEMONTCG_API_KEY')
        if not self.pokemontcg_api_key:
            print("⚠️  POKEMONTCG_API_KEY not found in environment")
            print("   API calls will be rate-limited to 1000/day")
        
        # Cache to avoid duplicate API calls
        self.card_cache = {}
        
    def fetch_card_from_api(self, card_id: str) -> Optional[Dict]:
        """Fetch card details from Pokemon TCG API"""
        if card_id in self.card_cache:
            return self.card_cache[card_id]
            
        try:
            url = f"https://api.pokemontcg.io/v2/cards/{card_id}"
            headers = {}
            if self.pokemontcg_api_key:
                headers['X-Api-Key'] = self.pokemontcg_api_key
                
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                card_data = data.get('data', {})
                
                result = {
                    'name': card_data.get('name', ''),
                    'set_code': card_data.get('set', {}).get('id', ''),
                    'card_number': card_data.get('number', ''),
                    'image_url': card_data.get('images', {}).get('small', ''),
                    'rarity': card_data.get('rarity', ''),
                }
                
                self.card_cache[card_id] = result
                return result
                
            elif response.status_code == 404:
                print(f"   Card {card_id} not found in API")
                return None
            else:
                print(f"   API error for {card_id}: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"   Error fetching {card_id}: {e}")
            return None
    
    def populate_embeddings_metadata(self, batch_size: int = 50, max_cards: int = None):
        """Populate image URLs and metadata in card_embeddings table"""
        print("🔄 Starting embeddings metadata population...")
        
        # Get embeddings that need image URLs
        response = self.supabase_client.from_('card_embeddings').select('card_id').is_('image_url', None).execute()
        
        if not response.data:
            print("✅ All embeddings already have image URLs!")
            return
            
        embeddings_to_update = response.data
        total = len(embeddings_to_update)
        
        if max_cards:
            embeddings_to_update = embeddings_to_update[:max_cards]
            total = len(embeddings_to_update)
            
        print(f"📊 Found {total} embeddings needing image URLs")
        
        updated_count = 0
        failed_count = 0
        
        for i, embedding in enumerate(embeddings_to_update):
            card_id = embedding['card_id']
            
            if i % 10 == 0:
                print(f"   Progress: {i}/{total} ({(i/total*100):.1f}%)")
            
            # Fetch from API
            card_data = self.fetch_card_from_api(card_id)
            
            if card_data and card_data.get('image_url'):
                try:
                    # Update the embedding record
                    update_response = self.supabase_client.from_('card_embeddings').update({
                        'name': card_data['name'],
                        'set_code': card_data['set_code'], 
                        'card_number': card_data['card_number'],
                        'image_url': card_data['image_url'],
                        'rarity': card_data['rarity']
                    }).eq('card_id', card_id).execute()
                    
                    if update_response.data:
                        updated_count += 1
                    else:
                        print(f"   Failed to update embedding for {card_id}")
                        failed_count += 1
                        
                except Exception as e:
                    print(f"   Database error updating {card_id}: {e}")
                    failed_count += 1
            else:
                failed_count += 1
            
            # Rate limiting - be nice to the API
            if not self.pokemontcg_api_key:
                time.sleep(0.1)  # 10 requests per second without API key
            else:
                time.sleep(0.02)  # 50 requests per second with API key
                
        print(f"\n✅ Embedding population complete!")
        print(f"   Updated: {updated_count}")
        print(f"   Failed: {failed_count}")
        print(f"   Total processed: {updated_count + failed_count}")
        
        return {
            'updated': updated_count,
            'failed': failed_count,
            'total': total
        }

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Populate image URLs in card embeddings')
    parser.add_argument('--max-cards', type=int, help='Maximum number of cards to process (for testing)')
    parser.add_argument('--batch-size', type=int, default=50, help='Batch size for API calls')
    
    args = parser.parse_args()
    
    populator = EmbeddingsImagePopulator()
    result = populator.populate_embeddings_metadata(
        batch_size=args.batch_size,
        max_cards=args.max_cards
    )
    
    if result:
        print(f"\n🎯 Summary: {result['updated']} cards updated, {result['failed']} failed")

if __name__ == '__main__':
    main()