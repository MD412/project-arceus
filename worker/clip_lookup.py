#!/usr/bin/env python3
"""
CLIP-based card identification using embedding similarity search
Replaces OCR-based approach with more robust image matching
"""
import io
import numpy as np
from PIL import Image
from typing import Dict, List, Optional, Tuple
import open_clip
import torch
from config import get_supabase_client

class CLIPCardIdentifier:
    def __init__(self, model_name: str = "ViT-B-32-quickgelu", pretrained: str = "openai", supabase_client=None):
        """Initialize CLIP model for card identification"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🎯 Loading CLIP model {model_name} on {self.device}")
        
        # Use QuickGELU-enabled model to eliminate warning and improve performance
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained, device=self.device
        )
        self.model.eval()
        print("✅ CLIP model loaded successfully")
        
        # Use provided client or create new one
        if supabase_client:
            self.supabase_client = supabase_client
            print("✅ Using provided Supabase client")
        else:
            self.supabase_client = get_supabase_client()
            if not self.supabase_client:
                raise ValueError("Failed to initialize Supabase client")

    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode a PIL Image to CLIP embedding vector (512-D)"""
        try:
            # Preprocess image and add batch dimension
            image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
            
            # Generate embedding
            with torch.no_grad():
                image_features = self.model.encode_image(image_tensor)
                # Normalize for cosine similarity
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            # Convert to numpy and remove batch dimension
            embedding = image_features.cpu().numpy().squeeze()
            return embedding
            
        except Exception as e:
            print(f"🔥 Error encoding image: {e}")
            return None

    def find_similar_cards(self, query_embedding: np.ndarray, 
                          similarity_threshold: float = 0.50,  # Optimized threshold
                          max_results: int = 5) -> List[Dict]:
        """Find cards with similar embeddings using pgvector cosine similarity"""
        try:
            # Convert numpy array to list for JSON serialization
            embedding_list = query_embedding.tolist()
            
            # Use the RPC function for similarity search with JOIN to cards table
            response = self.supabase_client.rpc('search_similar_cards', {
                'query_embedding': embedding_list,
                'similarity_threshold': 1.0 - similarity_threshold,  # Convert to cosine distance
                'max_results': max_results
            }).execute()
            
            # Also get top matches regardless of threshold for debugging
            debug_response = self.supabase_client.rpc('search_similar_cards', {
                'query_embedding': embedding_list,
                'similarity_threshold': 0.0,  # Get all matches
                'max_results': 5
            }).execute()
            
            # Log top matches for debugging
            if debug_response.data:
                print(f"🔍 Top similarity scores (all):")
                for i, row in enumerate(debug_response.data[:3]):
                    similarity = 1.0 - row['distance']
                    api_id = row['card_id']
                    name = row['name'] if row['name'] != 'Unknown Card' else f"Card {api_id}"
                    print(f"   {i+1}. {name} ({api_id}): {similarity:.3f}")
            
            if not response.data:
                print(f"❌ No similar cards found above threshold {similarity_threshold}")
                print(f"   💡 Try lowering threshold or adding more cards to database")
                return []
            
            results = []
            for row in response.data:
                # pgvector returns cosine distance, convert to similarity
                similarity = 1.0 - row['distance']
                
                # Extract card info from API ID (e.g., 'dp4-3' -> set='dp4', number='3')
                api_id = row['card_id']
                parts = api_id.split('-', 1)
                extracted_set = parts[0] if len(parts) > 0 else ''
                extracted_number = parts[1] if len(parts) > 1 else ''
                
                # Use JOIN data if available, otherwise fall back to extracted info
                name = row['name'] if row['name'] != 'Unknown Card' else f"Card {api_id}"
                set_code = row['set_code'] if row['set_code'] else extracted_set
                card_number = row['card_number'] if row['card_number'] else extracted_number
                
                result = {
                    'card_id': api_id,
                    'name': name,
                    'set_code': set_code, 
                    'card_number': card_number,
                    'image_url': row['image_url'],
                    'rarity': row['rarity'],
                    'similarity': similarity,
                    'confidence': similarity  # For compatibility with existing code
                }
                results.append(result)
                
            print(f"✅ Found {len(results)} similar cards (threshold: {similarity_threshold})")
            return results
            
        except Exception as e:
            print(f"🔥 Error searching similar cards: {e}")
            return []

    def identify_card_from_crop(self, image_path_or_pil: str | Image.Image, 
                               similarity_threshold: float = 0.50) -> Dict:
        """
        Main card identification function - replaces OCR-based approach
        
        Args:
            image_path_or_pil: File path to image or PIL Image object
            similarity_threshold: Minimum similarity for match
            
        Returns:
            Dict with identification results, compatible with existing pipeline
        """
        try:
            # Load image
            if isinstance(image_path_or_pil, str):
                image = Image.open(image_path_or_pil).convert('RGB')
            else:
                image = image_path_or_pil.convert('RGB')
            
            print(f"🔍 Identifying card using CLIP similarity search...")
            
            # Encode the crop image
            query_embedding = self.encode_image(image)
            if query_embedding is None:
                return {
                    "success": False,
                    "error": "Failed to encode image",
                    "method": "clip_embedding"
                }
            
            # Search for similar cards
            similar_cards = self.find_similar_cards(
                query_embedding, 
                similarity_threshold=similarity_threshold,
                max_results=3  # Get top 3 matches
            )
            
            if not similar_cards:
                return {
                    "success": False,
                    "error": f"No cards found above similarity threshold {similarity_threshold}",
                    "method": "clip_embedding",
                    "similarity_threshold": similarity_threshold
                }
            
            # Take the best match
            best_match = similar_cards[0]
            similarity_score = best_match['similarity']
            
            print(f"🎯 Best match: {best_match['name']} ({best_match['set_code']} {best_match['card_number']}) - {similarity_score:.3f} similarity")
            
            # Return in format expected by existing pipeline
            return {
                "success": True,
                "method": "clip_embedding",
                "name": best_match['name'],
                "set_code": best_match['set_code'],
                "number": best_match['card_number'],
                "image_url": best_match['image_url'],
                "rarity": best_match['rarity'],
                "confidence": similarity_score,
                "similarity": similarity_score,
                "card_id": best_match['card_id'],
                "all_matches": similar_cards,  # Include all matches for debugging
                "estimated_value": None  # Could be added later
            }
            
        except Exception as e:
            print(f"🔥 Error in CLIP card identification: {e}")
            return {
                "success": False,
                "error": str(e),
                "method": "clip_embedding"
            }

# Global instance for reuse (models are expensive to load)
_clip_identifier = None

def get_clip_identifier(supabase_client=None) -> CLIPCardIdentifier:
    """Get or create global CLIP identifier instance"""
    global _clip_identifier
    if _clip_identifier is None:
        _clip_identifier = CLIPCardIdentifier(supabase_client=supabase_client)
    return _clip_identifier

def identify_card_from_crop(image_path_or_pil: str | Image.Image, 
                           use_clip: bool = True, 
                           similarity_threshold: float = 0.85,
                           supabase_client=None) -> Dict:
    """
    Main card identification function - drop-in replacement for OCR version
    
    Args:
        image_path_or_pil: Image path or PIL Image
        use_clip: Whether to use CLIP (True) or fall back to OCR (False)  
        similarity_threshold: Minimum similarity for CLIP matching
        supabase_client: Optional Supabase client to reuse
        
    Returns:
        Identification result dict
    """
    if use_clip:
        identifier = get_clip_identifier(supabase_client=supabase_client)
        return identifier.identify_card_from_crop(image_path_or_pil, similarity_threshold)
    else:
        # Fallback to original OCR method
        from pokemon_tcg_api import identify_card_from_crop as ocr_identify
        if isinstance(image_path_or_pil, Image.Image):
            # OCR method expects file path, so save temporarily
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                image_path_or_pil.save(tmp.name)
                result = ocr_identify(tmp.name)
                import os
                os.unlink(tmp.name)
                return result
        else:
            return ocr_identify(image_path_or_pil) 