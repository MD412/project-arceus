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
import requests
import time
from pathlib import Path
import os

# Get API key from environment
POKEMONTCG_API_KEY = os.getenv("POKEMONTCG_API_KEY")


class CLIPCardIdentifier:
    def __init__(self, model_name: str = "ViT-B-32-quickgelu", pretrained: str = "openai", supabase_client=None):
        """Initialize CLIP model for card identification"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[CLIP] Loading CLIP model {model_name} on {self.device}")
        
        # Use QuickGELU-enabled model to eliminate warning and improve performance
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained, device=self.device
        )
        self.model.eval()
        print("[OK] CLIP model loaded successfully")
        
        # Use provided client or create new one
        if supabase_client:
            self.supabase_client = supabase_client
            print("[OK] Using provided Supabase client")
        else:
            self.supabase_client = get_supabase_client()
            if not self.supabase_client:
                raise ValueError("Failed to initialize Supabase client")
        
        # Cache for API-resolved names to avoid duplicate API calls
        self._name_cache = {}

    def _get_name_from_api_id(self, api_id: str) -> str:
        """Resolve card name from Pokemon TCG API ID (cached) with retries."""
        if api_id in self._name_cache:
            return self._name_cache[api_id]

        # 1) Try database cache first
        try:
            response = (
                self.supabase_client
                .from_("card_embeddings")
                .select("name")
                .eq("card_id", api_id)
                .single()
                .execute()
            )
            if response.data and response.data.get("name"):
                card_name = response.data["name"]
                self._name_cache[api_id] = card_name
                print(f"[CACHE] Resolved {api_id} -> {card_name}")
                return card_name
        except Exception as e:
            # Non-fatal; fall through to API lookup
            print(f"[WARN] DB lookup failed for {api_id}: {e}")

        # 2) Fallback to external API with retries
        retries = 3
        backoff_factor = 0.5
        url = f"https://api.pokemontcg.io/v2/cards/{api_id}"
        headers = {
            "X-Api-Key": POKEMONTCG_API_KEY
        } if POKEMONTCG_API_KEY else {}

        for i in range(retries):
            try:
                response = requests.get(url, timeout=15, headers=headers) # Increased timeout and added headers
                if response.status_code == 200:
                    data = response.json()
                    card_name = data.get('data', {}).get('name', f"Card {api_id}")
                    self._name_cache[api_id] = card_name
                    print(f"[API] Resolved {api_id} -> {card_name}")
                    return card_name
                elif response.status_code in [429, 500, 502, 503, 504]:
                    # Server error or rate-limiting, worth retrying
                    print(f"[WARN] API returned {response.status_code} for {api_id}. Retrying...")
                else:
                    # Client error (e.g., 404), don't retry
                    print(f"[WARN] Failed to resolve {api_id}: HTTP {response.status_code}")
                    break
            except (requests.exceptions.RequestException, requests.exceptions.Timeout) as e:
                print(f"[WARN] Network error for {api_id}: {e}. Retrying...")

            # Exponential backoff
            time.sleep(backoff_factor * (2 ** i))

        # Fallback to formatted ID if all retries fail
        fallback = f"Card {api_id}"
        self._name_cache[api_id] = fallback
        return fallback

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
            print(f"[ERROR] Error encoding image: {e}")
            return None

    def encode_images_batch(self, images: List[Image.Image]) -> List[np.ndarray]:
        """Encode multiple images to CLIP embeddings in a batch for better performance"""
        try:
            # Preprocess all images
            image_tensors = []
            for image in images:
                image_tensor = self.preprocess(image).unsqueeze(0)
                image_tensors.append(image_tensor)
            
            # Stack into a single batch
            batch_tensor = torch.cat(image_tensors, dim=0).to(self.device)
            
            # Generate embeddings for entire batch
            with torch.no_grad():
                image_features = self.model.encode_image(batch_tensor)
                # Normalize for cosine similarity
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            # Convert to numpy arrays
            embeddings = image_features.cpu().numpy()
            return [embeddings[i] for i in range(len(images))]
            
        except Exception as e:
            print(f"[ERROR] Error encoding batch: {e}")
            # Fall back to individual encoding
            return [self.encode_image(img) for img in images]

    def identify_cards_batch(self, images: List[Image.Image], similarity_threshold: float = 0.75) -> List[Dict]:
        """Identify multiple cards in a batch for better performance"""
        print(f"[CLIP] Processing batch of {len(images)} cards...")
        
        # Encode all images at once
        embeddings = self.encode_images_batch(images)
        
        results = []
        for i, embedding in enumerate(embeddings):
            if embedding is None:
                results.append({
                    "success": False,
                    "error": "Failed to encode image",
                    "method": "clip_embedding"
                })
                continue
            
            # Search for similar cards
            similar_cards = self.find_similar_cards(
                embedding, 
                similarity_threshold=similarity_threshold,
                max_results=1  # Just get best match for speed
            )
            
            if not similar_cards:
                results.append({
                    "success": False,
                    "error": f"No cards found above similarity threshold {similarity_threshold}",
                    "method": "clip_embedding",
                    "similarity_threshold": similarity_threshold
                })
                continue
            
            # Take the best match
            best_match = similar_cards[0]
            results.append({
                "success": True,
                "method": "clip_embedding",
                "name": best_match['name'],
                "set_code": best_match['set_code'],
                "number": best_match['card_number'],
                "image_url": best_match['image_url'],
                "rarity": best_match['rarity'],
                "confidence": best_match['similarity'],
                "similarity": best_match['similarity'],
                "card_id": best_match['card_id']
            })
        
        return results

    def find_similar_cards(self, query_embedding: np.ndarray, 
                          similarity_threshold: float = 0.75,  # Updated based on training data analysis - non-cards score up to 0.815
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
            
            if not response.data:
                print(f"[WARN] No similar cards found above threshold {similarity_threshold}")
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
                # If database doesn't have proper name, use a better fallback
                name = row.get('name')
                if not name or name == 'Unknown Card':
                    name = self._get_name_from_api_id(api_id)
                
                set_code = row.get('set_code') or extracted_set
                card_number = row.get('card_number') or extracted_number
                
                result = {
                    'card_id': api_id,
                    'name': name,
                    'set_code': set_code, 
                    'card_number': card_number,
                    'image_url': row.get('image_url'),
                    'rarity': row.get('rarity'),
                    'similarity': similarity,
                    'confidence': similarity  # For compatibility with existing code
                }
                results.append(result)
            
            # Log just the best match for minimal debugging
            if results:
                best = results[0]
                print(f"[CLIP] Best match: {best['name']} ({best['similarity']:.3f})")
            
            return results
            
        except Exception as e:
            print(f"[ERROR] Error searching similar cards: {e}")
            return []

    def identify_card_from_crop(self, image_path_or_pil: str | Image.Image, 
                               similarity_threshold: float = 0.60) -> Dict:
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
            
            print(f"[CLIP] Identifying card using CLIP similarity search...")
            
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
            
            print(f"[MATCH] Best match: {best_match['name']} ({best_match['set_code']} {best_match['card_number']}) - {similarity_score:.3f} similarity")
            
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
            print(f"[ERROR] Error in CLIP card identification: {e}")
            return {
                "success": False,
                "error": str(e),
                "method": "clip_embedding"
            }

    def analyze_confidence_distribution(self, test_images_dir: str = "training_data/card_crops/not_a_card"):
        """
        Analyze CLIP confidence scores on known non-card images to find optimal threshold
        """
        import os
        from pathlib import Path
        
        print("[CLIP] Analyzing confidence distribution on training data...")
        
        non_card_scores = []
        
        # Test on "not a card" examples
        not_card_dir = Path(test_images_dir)
        if not_card_dir.exists():
            for img_file in not_card_dir.glob("*.jpg"):
                try:
                    result = self.identify_card_from_crop(str(img_file), similarity_threshold=0.0)
                    if result.get('similarity'):
                        non_card_scores.append(result['similarity'])
                        print(f"   Not-a-card '{img_file.name}': {result['similarity']:.3f}")
                except Exception as e:
                    print(f"   Error processing {img_file}: {e}")
        
        if non_card_scores:
            import numpy as np
            avg_non_card = np.mean(non_card_scores)
            max_non_card = np.max(non_card_scores)
            std_non_card = np.std(non_card_scores)
            
            print(f"\n[STATS] Non-card Statistics:")
            print(f"   Average similarity: {avg_non_card:.3f}")
            print(f"   Max similarity: {max_non_card:.3f}")
            print(f"   Std deviation: {std_non_card:.3f}")
            
            # Suggest threshold based on statistics
            suggested_threshold = max_non_card + (2 * std_non_card)
            suggested_threshold = min(suggested_threshold, 0.85)  # Cap at reasonable max
            
            print(f"\n[INFO] Suggested threshold: {suggested_threshold:.3f}")
            print(f"   (This would reject {sum(1 for s in non_card_scores if s >= suggested_threshold)}/{len(non_card_scores)} false positives)")
            
            return {
                'suggested_threshold': suggested_threshold,
                'non_card_stats': {
                    'mean': avg_non_card,
                    'max': max_non_card,
                    'std': std_non_card,
                    'samples': len(non_card_scores)
                }
            }
        
        return None

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