#!/usr/bin/env python3
"""
Hybrid Card Identifier with Self-Growing Embedding Database
Combines CLIP similarity search with Pokemon TCG API fallback
Automatically caches new card embeddings for future scans
"""
import io
import requests
import numpy as np
from PIL import Image
from typing import Dict, List, Optional
import open_clip
import torch
from config import get_supabase_client
from pokemon_tcg_api import PokemonTCGAPI
from clip_lookup import CLIPCardIdentifier

class HybridCardIdentifier:
    def __init__(self, api_key: Optional[str] = None, supabase_client=None):
        """Initialize hybrid identifier with CLIP + Pokemon TCG API"""
        # Initialize CLIP identifier
        self.clip_identifier = CLIPCardIdentifier(supabase_client=supabase_client)
        
        # Initialize Pokemon TCG API
        self.tcg_api = PokemonTCGAPI(api_key=api_key)
        
        # Use provided client or create new one
        if supabase_client:
            self.supabase_client = supabase_client
        else:
            self.supabase_client = get_supabase_client()
            
        print("🔧 Hybrid identifier initialized (CLIP + TCG API + Self-Growing DB)")

    async def cache_new_card_embedding(self, tcg_card_data: Dict) -> bool:
        """
        Download card image, generate CLIP embedding, and cache in database
        This makes our database grow smarter over time!
        """
        try:
            card_id = tcg_card_data['id']
            image_url = tcg_card_data['images']['large']
            
            print(f"📥 Caching new card embedding: {tcg_card_data['name']} ({card_id})")
            
            # Check if already exists
            existing = self.supabase_client.from_('card_embeddings').select('card_id').eq('card_id', card_id).execute()
            if existing.data:
                print(f"   ✅ Embedding already cached for {card_id}")
                return True
            
            # Download card image
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Load and encode image
            card_image = Image.open(io.BytesIO(response.content)).convert('RGB')
            embedding = self.clip_identifier.encode_image(card_image)
            
            if embedding is None:
                print(f"   ❌ Failed to generate embedding for {card_id}")
                return False
            
            # Store in database
            embedding_data = {
                'card_id': card_id,
                'embedding': embedding.tolist(),  # Convert numpy to list for JSON
                'image_url': image_url,
                'name': tcg_card_data['name'],
                'set_code': tcg_card_data.get('set', {}).get('id', ''),
                'card_number': tcg_card_data.get('number', ''),
                'rarity': tcg_card_data.get('rarity', '')
            }
            
            result = self.supabase_client.from_('card_embeddings').insert(embedding_data).execute()
            
            if result.data:
                print(f"   ✅ Cached embedding for {tcg_card_data['name']} - DB grew by +1 card!")
                return True
            else:
                print(f"   ❌ Failed to insert embedding for {card_id}")
                return False
                
        except Exception as e:
            print(f"   🔥 Error caching embedding for {card_id}: {e}")
            return False

    def analyze_confidence(self, clip_result: Dict) -> str:
        """Analyze CLIP result confidence to determine next action"""
        if not clip_result.get('success'):
            return "UNKNOWN"
        
        similarity = clip_result.get('similarity', 0.0)
        
        if similarity >= 0.85:
            return "CONFIDENT"
        elif similarity >= 0.60:
            return "UNCERTAIN" 
        else:
            return "UNKNOWN"

    async def pokemon_tcg_visual_search(self, crop_path: str) -> Dict:
        """
        Smart Pokemon TCG API search using visual hints
        More targeted than random searching
        """
        try:
            print("🔍 Trying Pokemon TCG API visual search...")
            
            # Extract any readable text hints from the crop
            # (You could add OCR here for hints, but keeping it simple for now)
            
            # Search popular/recent sets first (more likely to be scanned)
            popular_sets = [
                'swsh12',  # Silver Tempest  
                'sv1',     # Scarlet & Violet Base
                'sv2',     # Paldea Evolved
                'sv3',     # Obsidian Flames
                'sv4'      # Paradox Rift
            ]
            
            candidates = []
            for set_code in popular_sets[:3]:  # Limit to prevent API abuse
                set_cards = self.tcg_api.search_cards(f'set.id:{set_code}')
                candidates.extend(set_cards[:50])  # Max 50 per set
                
            if not candidates:
                # Fallback to broader search
                candidates = self.tcg_api.search_cards('supertype:pokemon')[:100]
            
            print(f"   📋 Got {len(candidates)} candidates from TCG API")
            
            # Compare crop with candidate images using CLIP
            best_match = None
            best_similarity = 0.0
            
            crop_image = Image.open(crop_path).convert('RGB')
            crop_embedding = self.clip_identifier.encode_image(crop_image)
            
            for i, candidate in enumerate(candidates[:20]):  # Limit comparisons
                try:
                    # Download candidate image
                    img_response = requests.get(candidate['images']['large'], timeout=5)
                    img_response.raise_for_status()
                    
                    candidate_image = Image.open(io.BytesIO(img_response.content)).convert('RGB')
                    candidate_embedding = self.clip_identifier.encode_image(candidate_image)
                    
                    # Calculate similarity
                    similarity = np.dot(crop_embedding, candidate_embedding) / (
                        np.linalg.norm(crop_embedding) * np.linalg.norm(candidate_embedding)
                    )
                    
                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_match = candidate
                        
                    if i > 0 and i % 5 == 0:
                        print(f"   🔄 Compared {i+1}/{min(20, len(candidates))} candidates...")
                        
                except Exception as e:
                    print(f"   ⚠️ Error comparing candidate {candidate.get('name', 'unknown')}: {e}")
                    continue
            
            if best_similarity >= 0.75:  # High confidence threshold for TCG API
                print(f"   🎯 TCG API match: {best_match['name']} ({best_similarity:.3f} similarity)")
                return {
                    'success': True,
                    'card': best_match,
                    'confidence': best_similarity,
                    'method': 'tcg_api_visual'
                }
            else:
                print(f"   ❌ No good TCG API matches (best: {best_similarity:.3f})")
                return {'success': False, 'error': 'No confident TCG API matches'}
                
        except Exception as e:
            print(f"   🔥 Error in TCG API search: {e}")
            return {'success': False, 'error': f'TCG API error: {e}'}

    async def identify_card_hybrid(self, crop_path: str, confidence_threshold: float = 0.85) -> Dict:
        """
        Main hybrid identification function
        1. Try CLIP first (fast)
        2. Fall back to Pokemon TCG API if uncertain
        3. Cache new cards for future scans (self-growing database!)
        """
        print(f"🔄 Starting hybrid card identification...")
        
        # Step 1: Try CLIP first
        clip_result = self.clip_identifier.identify_card_from_crop(
            crop_path, 
            similarity_threshold=confidence_threshold
        )
        
        confidence_level = self.analyze_confidence(clip_result)
        
        if confidence_level == "CONFIDENT":
            print(f"✅ CLIP confident match: {clip_result['name']} ({clip_result['similarity']:.3f})")
            return {
                'success': True,
                'method': 'clip_confident',
                'name': clip_result['name'],
                'set_code': clip_result['set_code'],
                'number': clip_result['number'],
                'image_url': clip_result['image_url'],
                'rarity': clip_result['rarity'],
                'confidence': clip_result['similarity']
            }
        
        # Step 2: CLIP uncertain/failed - try Pokemon TCG API
        print(f"🔄 CLIP uncertain ({clip_result.get('similarity', 0):.3f}) - trying TCG API fallback...")
        
        tcg_result = await self.pokemon_tcg_visual_search(crop_path)
        
        if tcg_result['success']:
            tcg_card = tcg_result['card']
            
            # Step 3: Cache this new card for future scans! 🌱
            await self.cache_new_card_embedding(tcg_card)
            
            return {
                'success': True,
                'method': 'tcg_api_fallback',
                'name': tcg_card['name'],
                'set_code': tcg_card.get('set', {}).get('id', ''),
                'number': tcg_card.get('number', ''),
                'image_url': tcg_card['images']['large'],
                'rarity': tcg_card.get('rarity', ''),
                'confidence': tcg_result['confidence']
            }
        
        # Step 4: Both methods failed
        return {
            'success': False,
            'method': 'hybrid_failed',
            'error': 'Both CLIP and TCG API failed to identify card',
            'clip_best_similarity': clip_result.get('similarity', 0),
            'tcg_error': tcg_result.get('error', 'Unknown TCG error')
        }

# Convenience function for backward compatibility
async def identify_card_from_crop_hybrid(crop_path: str, supabase_client=None, api_key: str = None) -> Dict:
    """
    Backward-compatible wrapper for hybrid identification
    """
    identifier = HybridCardIdentifier(api_key=api_key, supabase_client=supabase_client)
    return await identifier.identify_card_hybrid(crop_path) 