#!/usr/bin/env python3
"""
Card Enrichment Worker

Takes detection results from the computer vision pipeline and enriches them with 
card identification from the master catalog using fuzzy matching.

Usage:
    from enrichment_worker import CardEnricher
    
    enricher = CardEnricher(database_url)
    result = await enricher.enrich_detection(detection_data)
"""

import asyncio
import asyncpg
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import json
from difflib import SequenceMatcher
import re
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DetectionInput:
    """Input structure for card detection enrichment"""
    detection_id: str
    job_id: str
    predicted_name: str
    confidence: float
    bounding_box: Dict[str, float]
    cropped_image_path: str
    tile_source: Optional[str] = None
    additional_context: Optional[Dict] = None

@dataclass 
class MatchCandidate:
    """Represents a potential card match"""
    card_id: str
    card_name: str
    set_code: str
    set_name: str
    card_number: str
    rarity: str
    pokemon_name: str
    image_urls: Dict[str, str]
    match_score: float
    match_type: str  # 'exact', 'fuzzy_name', 'fuzzy_pokemon', 'set_context'
    confidence: float

@dataclass
class EnrichmentResult:
    """Result of card enrichment process"""
    detection_id: str
    success: bool
    best_match: Optional[MatchCandidate] = None
    candidate_matches: List[MatchCandidate] = None
    identification_method: str = 'unknown'
    identification_confidence: float = 0.0
    fuzzy_match_score: float = 0.0
    error_message: Optional[str] = None
    processing_time_ms: float = 0.0

class CardEnricher:
    """Enriches card detections with database lookups and fuzzy matching"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.db_pool = None
        
        # Fuzzy matching thresholds
        self.EXACT_MATCH_THRESHOLD = 0.95
        self.FUZZY_MATCH_THRESHOLD = 0.6
        self.MIN_VIABLE_THRESHOLD = 0.4
        
        # Common card name patterns for cleaning
        self.CARD_NAME_PATTERNS = [
            r'\s+ex\s*$',           # "Charizard ex"
            r'\s+EX\s*$',           # "Charizard EX" 
            r'\s+GX\s*$',           # "Charizard GX"
            r'\s+V\s*$',            # "Charizard V"
            r'\s+VMAX\s*$',         # "Charizard VMAX"
            r'\s+VSTAR\s*$',        # "Charizard VSTAR"
            r'\s+&\s+\w+\s*$',      # "Pikachu & Zekrom"
            r'\s*\(\d+/\d+\)\s*$',  # "(25/25)"
            r'\s*#\d+\s*$',         # "#25"
        ]
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.db_pool = await asyncpg.create_pool(self.database_url, min_size=2, max_size=10)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.db_pool:
            await self.db_pool.close()
    
    def clean_card_name(self, name: str) -> str:
        """Clean card name by removing common suffixes and patterns"""
        if not name:
            return ""
        
        cleaned = name.strip()
        
        # Apply regex patterns to remove suffixes
        for pattern in self.CARD_NAME_PATTERNS:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        return cleaned
    
    def extract_pokemon_name(self, card_name: str) -> str:
        """Extract the base Pokemon name from a card name"""
        if not card_name:
            return ""
        
        # Clean the name first
        cleaned = self.clean_card_name(card_name)
        
        # Split on common delimiters and take the first part
        parts = re.split(r'[&\-\s]+', cleaned)
        return parts[0].strip() if parts else cleaned
    
    def calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings using SequenceMatcher"""
        if not str1 or not str2:
            return 0.0
        
        # Normalize strings
        s1 = str1.lower().strip()
        s2 = str2.lower().strip()
        
        return SequenceMatcher(None, s1, s2).ratio()
    
    def calculate_composite_score(self, predicted_name: str, candidate: Dict) -> Tuple[float, str]:
        """Calculate a composite match score using multiple criteria"""
        scores = {}
        
        # Direct name match
        name_score = self.calculate_similarity(predicted_name, candidate['card_name'])
        scores['name'] = name_score
        
        # Pokemon name match
        predicted_pokemon = self.extract_pokemon_name(predicted_name)
        pokemon_score = self.calculate_similarity(predicted_pokemon, candidate['pokemon_name'])
        scores['pokemon'] = pokemon_score
        
        # Keywords match (if available)
        keyword_score = 0.0
        if candidate.get('keywords'):
            predicted_words = set(predicted_name.lower().split())
            candidate_keywords = set(candidate['keywords'])
            if predicted_words and candidate_keywords:
                intersection = predicted_words.intersection(candidate_keywords)
                keyword_score = len(intersection) / len(predicted_words.union(candidate_keywords))
        scores['keywords'] = keyword_score
        
        # Determine best match type and score
        if name_score >= self.EXACT_MATCH_THRESHOLD:
            return name_score, 'exact'
        elif name_score >= self.FUZZY_MATCH_THRESHOLD:
            return name_score, 'fuzzy_name'
        elif pokemon_score >= self.FUZZY_MATCH_THRESHOLD:
            return pokemon_score, 'fuzzy_pokemon'
        elif keyword_score >= self.FUZZY_MATCH_THRESHOLD:
            return keyword_score, 'keyword_match'
        else:
            # Weighted composite score
            composite = (name_score * 0.5 + pokemon_score * 0.3 + keyword_score * 0.2)
            return composite, 'composite'
    
    async def search_exact_matches(self, predicted_name: str) -> List[Dict]:
        """Search for exact card name matches"""
        async with self.db_pool.acquire() as conn:
            query = """
                SELECT id, card_name, set_code, set_name, card_number, rarity, 
                       pokemon_name, image_urls, keywords, current_market_price
                FROM pokemon_cards 
                WHERE LOWER(card_name) = LOWER($1)
                ORDER BY current_market_price DESC NULLS LAST
                LIMIT 10
            """
            rows = await conn.fetch(query, predicted_name)
            return [dict(row) for row in rows]
    
    async def search_fuzzy_matches(self, predicted_name: str, limit: int = 20) -> List[Dict]:
        """Search for fuzzy matches using trigram similarity"""
        async with self.db_pool.acquire() as conn:
            # Enable pg_trgm extension for similarity search (if available)
            try:
                cleaned_name = self.clean_card_name(predicted_name)
                pokemon_name = self.extract_pokemon_name(predicted_name)
                
                query = """
                    SELECT id, card_name, set_code, set_name, card_number, rarity,
                           pokemon_name, image_urls, keywords, current_market_price,
                           SIMILARITY(card_name, $1) as name_sim,
                           SIMILARITY(pokemon_name, $2) as pokemon_sim
                    FROM pokemon_cards 
                    WHERE SIMILARITY(card_name, $1) > 0.3 
                       OR SIMILARITY(pokemon_name, $2) > 0.3
                       OR card_name ILIKE '%' || $3 || '%'
                       OR pokemon_name ILIKE '%' || $3 || '%'
                    ORDER BY GREATEST(
                        SIMILARITY(card_name, $1), 
                        SIMILARITY(pokemon_name, $2)
                    ) DESC
                    LIMIT $4
                """
                rows = await conn.fetch(query, predicted_name, pokemon_name, cleaned_name, limit)
                
            except Exception as e:
                # Fallback to ILIKE search if trigram similarity isn't available
                logger.warning(f"Trigram similarity not available, using ILIKE fallback: {e}")
                
                query = """
                    SELECT id, card_name, set_code, set_name, card_number, rarity,
                           pokemon_name, image_urls, keywords, current_market_price
                    FROM pokemon_cards 
                    WHERE card_name ILIKE '%' || $1 || '%'
                       OR pokemon_name ILIKE '%' || $2 || '%'
                    ORDER BY 
                        CASE WHEN card_name ILIKE $1 THEN 1 ELSE 2 END,
                        current_market_price DESC NULLS LAST
                    LIMIT $3
                """
                rows = await conn.fetch(query, predicted_name, 
                                      self.extract_pokemon_name(predicted_name), limit)
            
            return [dict(row) for row in rows]
    
    async def search_set_context_matches(self, predicted_name: str, set_hints: List[str] = None) -> List[Dict]:
        """Search with additional set context if available"""
        if not set_hints:
            return []
        
        async with self.db_pool.acquire() as conn:
            # Create dynamic query for multiple sets
            set_placeholders = ', '.join([f'${i+2}' for i in range(len(set_hints))])
            
            query = f"""
                SELECT id, card_name, set_code, set_name, card_number, rarity,
                       pokemon_name, image_urls, keywords, current_market_price
                FROM pokemon_cards 
                WHERE (card_name ILIKE '%' || $1 || '%' OR pokemon_name ILIKE '%' || $1 || '%')
                  AND (set_code IN ({set_placeholders}) OR set_name ILIKE ANY($3))
                ORDER BY current_market_price DESC NULLS LAST
                LIMIT 15
            """
            
            set_name_patterns = [f'%{hint}%' for hint in set_hints]
            rows = await conn.fetch(query, predicted_name, *set_hints, set_name_patterns)
            return [dict(row) for row in rows]
    
    def rank_candidates(self, predicted_name: str, candidates: List[Dict]) -> List[MatchCandidate]:
        """Rank and score all candidates"""
        ranked_candidates = []
        
        for candidate in candidates:
            try:
                score, match_type = self.calculate_composite_score(predicted_name, candidate)
                
                if score >= self.MIN_VIABLE_THRESHOLD:
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
                        confidence=min(score * 100, 100.0)  # Convert to percentage
                    )
                    ranked_candidates.append(match_candidate)
                    
            except Exception as e:
                logger.warning(f"Error ranking candidate {candidate.get('id')}: {e}")
                continue
        
        # Sort by match score
        ranked_candidates.sort(key=lambda x: x.match_score, reverse=True)
        return ranked_candidates
    
    async def store_enrichment_result(self, detection: DetectionInput, result: EnrichmentResult) -> None:
        """Store the enrichment result in the database"""
        try:
            async with self.db_pool.acquire() as conn:
                # Update the card_detections table with enrichment results
                await conn.execute("""
                    UPDATE card_detections 
                    SET pokemon_card_id = $1,
                        identification_method = $2,
                        identification_confidence = $3,
                        fuzzy_match_score = $4,
                        candidate_matches = $5
                    WHERE id = $6
                """, 
                    result.best_match.card_id if result.best_match else None,
                    result.identification_method,
                    result.identification_confidence,
                    result.fuzzy_match_score,
                    json.dumps([asdict(c) for c in result.candidate_matches[:5]]) if result.candidate_matches else None,
                    detection.detection_id
                )
                
                logger.info(f"Stored enrichment result for detection {detection.detection_id}")
                
        except Exception as e:
            logger.error(f"Error storing enrichment result: {e}")
    
    async def enrich_detection(self, detection: DetectionInput) -> EnrichmentResult:
        """Main enrichment function - identify a detected card"""
        start_time = datetime.now()
        
        try:
            logger.info(f"Enriching detection {detection.detection_id} with predicted name: '{detection.predicted_name}'")
            
            # Step 1: Try exact matches first
            exact_matches = await self.search_exact_matches(detection.predicted_name)
            
            # Step 2: Try fuzzy matches
            fuzzy_matches = await self.search_fuzzy_matches(detection.predicted_name)
            
            # Step 3: Try set context matches if hints available
            set_hints = []
            if detection.additional_context:
                set_hints = detection.additional_context.get('set_hints', [])
            
            context_matches = []
            if set_hints:
                context_matches = await self.search_set_context_matches(detection.predicted_name, set_hints)
            
            # Combine all candidates and remove duplicates
            all_candidates = []
            seen_ids = set()
            
            for candidate_list in [exact_matches, fuzzy_matches, context_matches]:
                for candidate in candidate_list:
                    if candidate['id'] not in seen_ids:
                        all_candidates.append(candidate)
                        seen_ids.add(candidate['id'])
            
            if not all_candidates:
                return EnrichmentResult(
                    detection_id=detection.detection_id,
                    success=False,
                    identification_method='no_matches',
                    error_message="No viable card matches found",
                    processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000
                )
            
            # Rank all candidates
            ranked_candidates = self.rank_candidates(detection.predicted_name, all_candidates)
            
            if not ranked_candidates:
                return EnrichmentResult(
                    detection_id=detection.detection_id,
                    success=False,
                    identification_method='low_confidence',
                    error_message="All matches below confidence threshold",
                    processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000
                )
            
            # Best match is the highest scored candidate
            best_match = ranked_candidates[0]
            
            # Determine final identification method and confidence
            if best_match.match_score >= self.EXACT_MATCH_THRESHOLD:
                identification_method = 'exact_match'
                confidence = best_match.match_score
            elif best_match.match_score >= self.FUZZY_MATCH_THRESHOLD:
                identification_method = 'fuzzy_match'
                confidence = best_match.match_score
            else:
                identification_method = 'low_confidence_match'
                confidence = best_match.match_score
            
            result = EnrichmentResult(
                detection_id=detection.detection_id,
                success=True,
                best_match=best_match,
                candidate_matches=ranked_candidates[:10],  # Top 10 candidates
                identification_method=identification_method,
                identification_confidence=confidence * 100,  # Convert to percentage
                fuzzy_match_score=best_match.match_score,
                processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000
            )
            
            # Store result in database
            await self.store_enrichment_result(detection, result)
            
            logger.info(f"Enrichment complete for {detection.detection_id}: "
                       f"Found {best_match.card_name} ({best_match.set_code}) "
                       f"with {confidence:.2%} confidence")
            
            return result
            
        except Exception as e:
            logger.error(f"Error enriching detection {detection.detection_id}: {e}")
            return EnrichmentResult(
                detection_id=detection.detection_id,
                success=False,
                identification_method='error',
                error_message=str(e),
                processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000
            )

    async def enrich_batch(self, detections: List[DetectionInput]) -> List[EnrichmentResult]:
        """Enrich multiple detections in parallel"""
        logger.info(f"Starting batch enrichment of {len(detections)} detections")
        
        tasks = [self.enrich_detection(detection) for detection in detections]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions in the results
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Exception in batch enrichment for detection {i}: {result}")
                final_results.append(EnrichmentResult(
                    detection_id=detections[i].detection_id,
                    success=False,
                    identification_method='error',
                    error_message=str(result)
                ))
            else:
                final_results.append(result)
        
        successful = sum(1 for r in final_results if r.success)
        logger.info(f"Batch enrichment complete: {successful}/{len(detections)} successful")
        
        return final_results

# Convenience functions for integration
async def enrich_single_detection(database_url: str, detection: DetectionInput) -> EnrichmentResult:
    """Convenience function to enrich a single detection"""
    async with CardEnricher(database_url) as enricher:
        return await enricher.enrich_detection(detection)

async def enrich_job_detections(database_url: str, job_id: str) -> List[EnrichmentResult]:
    """Enrich all detections for a specific job"""
    async with CardEnricher(database_url) as enricher:
        async with enricher.db_pool.acquire() as conn:
            # Fetch all unprocessed detections for this job
            rows = await conn.fetch("""
                SELECT id, job_id, bounding_box, cropped_image_path, tile_source
                FROM card_detections 
                WHERE job_id = $1 AND pokemon_card_id IS NULL
            """, job_id)
            
            detections = []
            for row in rows:
                # For now, use a placeholder predicted name - this would come from OCR/vision model
                detection = DetectionInput(
                    detection_id=str(row['id']),
                    job_id=str(row['job_id']),
                    predicted_name="Unknown Card",  # TODO: integrate with OCR/vision results
                    confidence=0.5,
                    bounding_box=row['bounding_box'],
                    cropped_image_path=row['cropped_image_path'],
                    tile_source=row['tile_source']
                )
                detections.append(detection)
            
            if detections:
                return await enricher.enrich_batch(detections)
            else:
                logger.info(f"No unprocessed detections found for job {job_id}")
                return []

# Example usage and testing
async def test_enrichment():
    """Test function to demonstrate enrichment capabilities"""
    database_url = "postgresql://localhost/arceus"  # Update with your DB URL
    
    # Test detection
    test_detection = DetectionInput(
        detection_id="test-123",
        job_id="job-456", 
        predicted_name="Charizard ex",
        confidence=0.85,
        bounding_box={"x": 100, "y": 100, "width": 200, "height": 300},
        cropped_image_path="/tmp/test_crop.jpg"
    )
    
    try:
        result = await enrich_single_detection(database_url, test_detection)
        
        print(f"Enrichment Result:")
        print(f"Success: {result.success}")
        if result.best_match:
            print(f"Best Match: {result.best_match.card_name}")
            print(f"Set: {result.best_match.set_name} ({result.best_match.set_code})")
            print(f"Confidence: {result.identification_confidence:.1f}%")
            print(f"Match Type: {result.identification_method}")
        else:
            print(f"Error: {result.error_message}")
            
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    # Run test
    asyncio.run(test_enrichment())
