#!/usr/bin/env python3
"""
SigLIP-based card identification using embedding similarity search
Drop-in replacement for CLIP with improved accuracy
"""
import io
import numpy as np
from PIL import Image
from typing import Dict, List, Optional, Tuple
import torch
import open_clip
from config import get_supabase_client
import requests
import time
from pathlib import Path
import os

# Get API key from environment
POKEMONTCG_API_KEY = os.getenv("POKEMONTCG_API_KEY")


class SigLIPCardIdentifier:
    def __init__(self, model_name: str = "google/siglip-so400m-patch14-384", 
                 pretrained: str = "webli", supabase_client=None):
        """Initialize SigLIP model for card identification"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[SigLIP] Loading SigLIP model {model_name} on {self.device}")
        
        # Load SigLIP model
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained, device=self.device
        )
        self.model.eval()
        print("[OK] SigLIP model loaded successfully")
        
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
                response = requests.get(url, timeout=15, headers=headers)
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

        # Final fallback
        fallback_name = f"Card {api_id}"
        self._name_cache[api_id] = fallback_name
        print(f"[FALLBACK] Using fallback name for {api_id}: {fallback_name}")
        return fallback_name

    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode a single image to embedding vector"""
        try:
            # Preprocess image for SigLIP
            processed_image = self.preprocess(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                # Get image features
                image_features = self.model.encode_image(processed_image)
                # Normalize features
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                
            return image_features.cpu().numpy().flatten()
        except Exception as e:
            print(f"[ERROR] Failed to encode image: {e}")
            return np.zeros(512)  # Return zero vector on error

    def encode_images_batch(self, images: List[Image.Image]) -> List[np.ndarray]:
        """Encode multiple images to embedding vectors (batch processing)"""
        if not images:
            return []
        
        try:
            # Preprocess all images
            processed_images = torch.stack([
                self.preprocess(img) for img in images
            ]).to(self.device)
            
            with torch.no_grad():
                # Get image features for all images
                image_features = self.model.encode_image(processed_images)
                # Normalize features
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                
            return image_features.cpu().numpy()
        except Exception as e:
            print(f"[ERROR] Failed to encode images batch: {e}")
            return [np.zeros(512) for _ in images]

    def identify_cards_batch(self, images: List[Image.Image], similarity_threshold: float = 0.75) -> List[Dict]:
        """Identify multiple cards using batch processing"""
        if not images:
            return []
        
        print(f"[SigLIP] Processing {len(images)} images in batch...")
        
        # Encode all images
        embeddings = self.encode_images_batch(images)
        
        results = []
        for i, embedding in enumerate(embeddings):
            # Find similar cards for this embedding
            similar_cards = self.find_similar_cards(embedding, similarity_threshold)
            
            if similar_cards:
                best_match = similar_cards[0]
                result = {
                    "success": True,
                    "card_id": best_match["card_id"],
                    "name": best_match["name"],
                    "confidence": best_match["similarity"],
                    "set_code": best_match.get("set_code"),
                    "card_number": best_match.get("card_number"),
                    "image_url": best_match.get("image_url"),
                    "rarity": best_match.get("rarity"),
                    "all_matches": similar_cards[:3]  # Top 3 matches
                }
            else:
                result = {
                    "success": False,
                    "confidence": 0.0,
                    "error": "No similar cards found"
                }
            
            results.append(result)
        
        return results

    def find_similar_cards(self, query_embedding: np.ndarray, 
                          similarity_threshold: float = 0.75,
                          max_results: int = 5) -> List[Dict]:
        """Find similar cards using cosine similarity"""
        try:
            # Query card embeddings from database
            response = self.supabase_client.from_("card_embeddings").select(
                "card_id, embedding, set_code, card_number, image_url, rarity"
            ).execute()
            
            if not response.data:
                print("[WARN] No card embeddings found in database")
                return []
            
            similarities = []
            for card_data in response.data:
                try:
                    # Parse embedding from database
                    stored_embedding = np.array(card_data["embedding"])
                    
                    # Calculate cosine similarity
                    similarity = np.dot(query_embedding, stored_embedding) / (
                        np.linalg.norm(query_embedding) * np.linalg.norm(stored_embedding)
                    )
                    
                    if similarity >= similarity_threshold:
                        # Resolve card name
                        card_name = self._get_name_from_api_id(card_data["card_id"])
                        
                        similarities.append({
                            "card_id": card_data["card_id"],
                            "name": card_name,
                            "similarity": float(similarity),
                            "set_code": card_data.get("set_code"),
                            "card_number": card_data.get("card_number"),
                            "image_url": card_data.get("image_url"),
                            "rarity": card_data.get("rarity")
                        })
                except Exception as e:
                    print(f"[WARN] Error processing card {card_data.get('card_id')}: {e}")
                    continue
            
            # Sort by similarity and return top matches
            similarities.sort(key=lambda x: x["similarity"], reverse=True)
            return similarities[:max_results]
            
        except Exception as e:
            print(f"[ERROR] Failed to find similar cards: {e}")
            return []

    def identify_card_from_crop(self, image_path_or_pil: str | Image.Image, 
                              similarity_threshold: float = 0.75) -> Dict:
        """Identify a single card from an image crop"""
        try:
            # Load image if path provided
            if isinstance(image_path_or_pil, str):
                image = Image.open(image_path_or_pil)
            else:
                image = image_path_or_pil
            
            # Encode image
            embedding = self.encode_image(image)
            
            # Find similar cards
            similar_cards = self.find_similar_cards(embedding, similarity_threshold)
            
            if similar_cards:
                best_match = similar_cards[0]
                return {
                    "success": True,
                    "card_id": best_match["card_id"],
                    "name": best_match["name"],
                    "confidence": best_match["similarity"],
                    "set_code": best_match.get("set_code"),
                    "card_number": best_match.get("card_number"),
                    "image_url": best_match.get("image_url"),
                    "rarity": best_match.get("rarity"),
                    "all_matches": similar_cards[:3]
                }
            else:
                return {
                    "success": False,
                    "confidence": 0.0,
                    "error": "No similar cards found"
                }
                
        except Exception as e:
            return {
                "success": False,
                "confidence": 0.0,
                "error": f"Identification failed: {str(e)}"
            }


def get_siglip_identifier(supabase_client=None) -> SigLIPCardIdentifier:
    """Factory function to create SigLIP identifier"""
    return SigLIPCardIdentifier(supabase_client=supabase_client)


def identify_card_from_crop(image_path_or_pil: str | Image.Image, 
                          similarity_threshold: float = 0.75,
                          supabase_client=None) -> Dict:
    """Convenience function for single card identification"""
    identifier = get_siglip_identifier(supabase_client)
    return identifier.identify_card_from_crop(image_path_or_pil, similarity_threshold) 