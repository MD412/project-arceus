#!/usr/bin/env python3
"""
Supabase Adapter for Card Enrichment

Uses the working Supabase SDK instead of direct PostgreSQL connection.
This bridges our enrichment workers with your existing Supabase setup.
"""

import os
import asyncio
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import json
from difflib import SequenceMatcher
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import supabase

# Load environment from the working .env.local
project_root = Path(__file__).resolve().parent.parent
dotenv_path = project_root / '.env.local'

if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path, override=True)
    print(f"✅ Loaded environment from: {dotenv_path}")
else:
    print(f"❌ .env.local not found at {dotenv_path}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DetectionInput:
    """Input for card detection enrichment"""
    detection_id: str
    job_id: str
    predicted_name: str
    confidence: float
    bounding_box: Dict[str, float]
    cropped_image_path: str
    tile_source: Optional[str] = None

@dataclass 
class MatchCandidate:
    """A potential card match"""
    card_id: str
    card_name: str
    set_code: str
    set_name: str
    card_number: str
    rarity: str
    pokemon_name: str
    image_urls: Dict[str, str]
    match_score: float
    match_type: str
    confidence: float

@dataclass
class EnrichmentResult:
    """Result of card enrichment"""
    detection_id: str
    success: bool
    best_match: Optional[MatchCandidate] = None
    candidate_matches: List[MatchCandidate] = None
    identification_method: str = 'unknown'
    identification_confidence: float = 0.0
    fuzzy_match_score: float = 0.0
    error_message: Optional[str] = None
    processing_time_ms: float = 0.0

class SupabaseCardEnricher:
    """Card enrichment using Supabase SDK"""
    
    def __init__(self):
        # Use the working Supabase connection
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        
        self.client = supabase.create_client(self.url, self.key)
        
        # Fuzzy matching thresholds
        self.EXACT_MATCH_THRESHOLD = 0.95
        self.FUZZY_MATCH_THRESHOLD = 0.6
        self.MIN_VIABLE_THRESHOLD = 0.4
        
        logger.info("✅ Supabase Card Enricher initialized")
    
    def calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings"""
        if not str1 or not str2:
            return 0.0
        
        s1 = str1.lower().strip()
        s2 = str2.lower().strip()
        
        return SequenceMatcher(None, s1, s2).ratio()
    
    def create_sample_card_data(self) -> List[Dict]:
        """Create sample Pokemon cards for demo purposes"""
        return [
            {
                'id': 'sample_001',
                'card_name': 'Charizard ex',
                'set_code': 'SV1',
                'set_name': 'Scarlet & Violet',
                'card_number': '006',
                'rarity': 'Double Rare',
                'pokemon_name': 'Charizard',
                'image_urls': {
                    'small': 'https://images.pokemontcg.io/sv1/6.png',
                    'large': 'https://images.pokemontcg.io/sv1/6_hires.png'
                },
                'current_market_price': 45.99
            },
            {
                'id': 'sample_002',
                'card_name': 'Pikachu VMAX',
                'set_code': 'SWSH045',
                'set_name': 'Sword & Shield Promo',
                'card_number': 'SWSH045',
                'rarity': 'Promo',
                'pokemon_name': 'Pikachu',
                'image_urls': {
                    'small': 'https://images.pokemontcg.io/swshp/SWSH045.png',
                    'large': 'https://images.pokemontcg.io/swshp/SWSH045_hires.png'
                },
                'current_market_price': 12.50
            },
            {
                'id': 'sample_003',
                'card_name': 'Mewtwo GX',
                'set_code': 'SMP',
                'set_name': 'Sun & Moon Promo',
                'card_number': 'SM196',
                'rarity': 'Promo',
                'pokemon_name': 'Mewtwo',
                'image_urls': {
                    'small': 'https://images.pokemontcg.io/smp/SM196.png',
                    'large': 'https://images.pokemontcg.io/smp/SM196_hires.png'
                },
                'current_market_price': 28.75
            },
            {
                'id': 'sample_004',
                'card_name': 'Blastoise',
                'set_code': 'BASE',
                'set_name': 'Base Set',
                'card_number': '002',
                'rarity': 'Rare Holo',
                'pokemon_name': 'Blastoise',
                'image_urls': {
                    'small': 'https://images.pokemontcg.io/base1/2.png',
                    'large': 'https://images.pokemontcg.io/base1/2_hires.png'
                },
                'current_market_price': 85.00
            },
            {
                'id': 'sample_005',
                'card_name': 'Gardevoir ex',
                'set_code': 'SV1',
                'set_name': 'Scarlet & Violet',
                'card_number': '086',
                'rarity': 'Ultra Rare',
                'pokemon_name': 'Gardevoir',
                'image_urls': {
                    'small': 'https://images.pokemontcg.io/sv1/86.png',
                    'large': 'https://images.pokemontcg.io/sv1/86_hires.png'
                },
                'current_market_price': 38.25
            }
        ]
    
    def search_cards(self, predicted_name: str) -> List[Dict]:
        """
        Search for cards matching the predicted name.
        For demo purposes, uses sample data with fuzzy matching.
        """
        sample_cards = self.create_sample_card_data()
        
        # Filter cards based on similarity to predicted name
        matches = []
        for card in sample_cards:
            name_score = self.calculate_similarity(predicted_name, card['card_name'])
            pokemon_score = self.calculate_similarity(predicted_name, card['pokemon_name'])
            
            best_score = max(name_score, pokemon_score)
            if best_score >= self.MIN_VIABLE_THRESHOLD:
                card['match_score'] = best_score
                matches.append(card)
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        logger.info(f"Found {len(matches)} matches for '{predicted_name}'")
        return matches
    
    def rank_candidates(self, predicted_name: str, candidates: List[Dict]) -> List[MatchCandidate]:
        """Rank and score all candidates"""
        ranked_candidates = []
        
        for candidate in candidates:
            try:
                score = candidate.get('match_score', 0)
                
                # Determine match type
                if score >= self.EXACT_MATCH_THRESHOLD:
                    match_type = 'exact'
                elif score >= self.FUZZY_MATCH_THRESHOLD:
                    match_type = 'fuzzy_match'
                else:
                    match_type = 'low_confidence'
                
                match_candidate = MatchCandidate(
                    card_id=str(candidate['id']),
                    card_name=candidate['card_name'],
                    set_code=candidate['set_code'],
                    set_name=candidate['set_name'],
                    card_number=candidate['card_number'],
                    rarity=candidate['rarity'],
                    pokemon_name=candidate['pokemon_name'],
                    image_urls=candidate.get('image_urls', {}),
                    match_score=score,
                    match_type=match_type,
                    confidence=min(score * 100, 100.0)
                )
                ranked_candidates.append(match_candidate)
                
            except Exception as e:
                logger.warning(f"Error ranking candidate: {e}")
                continue
        
        # Sort by match score
        ranked_candidates.sort(key=lambda x: x.match_score, reverse=True)
        return ranked_candidates
    
    def enrich_detection(self, detection: DetectionInput) -> EnrichmentResult:
        """Main enrichment function"""
        start_time = datetime.now()
        
        try:
            logger.info(f"Enriching detection {detection.detection_id} with predicted name: '{detection.predicted_name}'")
            
            # Search for matching cards
            candidates = self.search_cards(detection.predicted_name)
            
            if not candidates:
                return EnrichmentResult(
                    detection_id=detection.detection_id,
                    success=False,
                    identification_method='no_matches',
                    error_message="No viable card matches found",
                    processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000
                )
            
            # Rank candidates
            ranked_candidates = self.rank_candidates(detection.predicted_name, candidates)
            
            if not ranked_candidates:
                return EnrichmentResult(
                    detection_id=detection.detection_id,
                    success=False,
                    identification_method='low_confidence',
                    error_message="All matches below confidence threshold",
                    processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000
                )
            
            # Best match
            best_match = ranked_candidates[0]
            
            # Determine identification method
            if best_match.match_score >= self.EXACT_MATCH_THRESHOLD:
                identification_method = 'exact_match'
            elif best_match.match_score >= self.FUZZY_MATCH_THRESHOLD:
                identification_method = 'fuzzy_match'
            else:
                identification_method = 'low_confidence_match'
            
            result = EnrichmentResult(
                detection_id=detection.detection_id,
                success=True,
                best_match=best_match,
                candidate_matches=ranked_candidates[:10],
                identification_method=identification_method,
                identification_confidence=best_match.match_score * 100,
                fuzzy_match_score=best_match.match_score,
                processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000
            )
            
            logger.info(f"✅ Enrichment successful: {best_match.card_name} ({best_match.set_code}) - {best_match.match_score:.2%} confidence")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error enriching detection {detection.detection_id}: {e}")
            return EnrichmentResult(
                detection_id=detection.detection_id,
                success=False,
                identification_method='error',
                error_message=str(e),
                processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000
            )

def test_supabase_enrichment():
    """Test the Supabase enrichment system"""
    print("🧪 Testing Supabase Card Enrichment...")
    
    try:
        enricher = SupabaseCardEnricher()
        
        # Test with some sample detections
        test_cases = [
            "Charizard ex",
            "Pikachu",
            "Mewtwo",
            "Blastoise", 
            "Unknown Card"
        ]
        
        for predicted_name in test_cases:
            print(f"\n🔍 Testing: '{predicted_name}'")
            
            detection = DetectionInput(
                detection_id=f"test_{predicted_name.lower().replace(' ', '_')}",
                job_id="test_job",
                predicted_name=predicted_name,
                confidence=0.85,
                bounding_box={"x": 100, "y": 100, "width": 200, "height": 300},
                cropped_image_path="/tmp/test_crop.jpg"
            )
            
            result = enricher.enrich_detection(detection)
            
            if result.success and result.best_match:
                print(f"  ✅ Found: {result.best_match.card_name}")
                print(f"     Set: {result.best_match.set_name} ({result.best_match.set_code})")
                print(f"     Confidence: {result.identification_confidence:.1f}%")
                print(f"     Method: {result.identification_method}")
            else:
                print(f"  ❌ No match: {result.error_message}")
        
        print("\n🎉 Supabase enrichment test complete!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_supabase_enrichment() 