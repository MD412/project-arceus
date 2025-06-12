#!/usr/bin/env python3
"""
Demo Integration Script

Demonstrates how to integrate the enrichment worker with the existing
vision pipeline to show real card names in your demo.

This bridges the gap between:
1. Computer vision detection results 
2. Card enrichment/identification
3. UI display with real card metadata

Usage:
    python demo_integration.py --job-id <job_id>
    python demo_integration.py --test-single
"""

import asyncio
import logging
import argparse
import os
import json
from typing import List, Dict, Any
from datetime import datetime

# Import our workers
from enrichment_worker import CardEnricher, DetectionInput, EnrichmentResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DemoIntegrator:
    """Integrates vision pipeline with card enrichment for demo purposes"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.enricher = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.enricher = CardEnricher(self.database_url)
        await self.enricher.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.enricher:
            await self.enricher.__aexit__(exc_type, exc_val, exc_tb)
    
    async def get_job_detections(self, job_id: str) -> List[Dict]:
        """Fetch all detections for a job from the database"""
        async with self.enricher.db_pool.acquire() as conn:
            query = """
                SELECT 
                    id,
                    job_id,
                    detection_confidence,
                    bounding_box,
                    cropped_image_path,
                    tile_source,
                    pokemon_card_id,
                    identification_method,
                    identification_confidence,
                    created_at
                FROM card_detections 
                WHERE job_id = $1
                ORDER BY detection_confidence DESC
            """
            rows = await conn.fetch(query, job_id)
            return [dict(row) for row in rows]
    
    async def get_card_metadata(self, card_id: str) -> Dict:
        """Get full card metadata for display"""
        async with self.enricher.db_pool.acquire() as conn:
            query = """
                SELECT 
                    id,
                    card_name,
                    set_code,
                    set_name,
                    card_number,
                    rarity,
                    pokemon_name,
                    pokemon_types,
                    hp,
                    image_urls,
                    artist,
                    current_market_price,
                    holographic,
                    first_edition
                FROM pokemon_cards 
                WHERE id = $1
            """
            row = await conn.fetchrow(query, card_id)
            return dict(row) if row else None
    
    def simulate_vision_predictions(self, detections: List[Dict]) -> List[str]:
        """
        Simulate what your computer vision model would predict for card names.
        In your real integration, this would come from OCR or vision model output.
        
        For the demo, we'll generate some realistic predictions based on common cards.
        """
        demo_predictions = [
            "Charizard ex", "Pikachu V", "Mewtwo GX", "Blastoise", "Venusaur",
            "Gardevoir ex", "Lucario", "Rayquaza", "Dragonite", "Alakazam",
            "Machamp", "Gengar", "Lapras", "Snorlax", "Eevee"
        ]
        
        predictions = []
        for i, detection in enumerate(detections):
            # Use a different prediction for each detection
            prediction = demo_predictions[i % len(demo_predictions)]
            predictions.append(prediction)
        
        return predictions
    
    async def enrich_job_detections(self, job_id: str, use_simulation: bool = True) -> List[Dict]:
        """
        Enrich all detections for a job with card identification.
        
        Args:
            job_id: The vision job ID to process
            use_simulation: If True, use simulated predictions. If False, use actual OCR/vision results.
        """
        logger.info(f"Starting enrichment for job {job_id}")
        
        # Get existing detections
        detections = await self.get_job_detections(job_id)
        
        if not detections:
            logger.warning(f"No detections found for job {job_id}")
            return []
        
        logger.info(f"Found {len(detections)} detections to enrich")
        
        # Get predictions (simulated for demo)
        if use_simulation:
            predictions = self.simulate_vision_predictions(detections)
        else:
            # TODO: Integrate with actual OCR/vision model
            predictions = ["Unknown Card"] * len(detections)
        
        # Create enrichment inputs
        enrichment_inputs = []
        for detection, predicted_name in zip(detections, predictions):
            # Skip if already enriched
            if detection['pokemon_card_id']:
                logger.info(f"Detection {detection['id']} already enriched, skipping")
                continue
            
            enrichment_input = DetectionInput(
                detection_id=str(detection['id']),
                job_id=str(detection['job_id']),
                predicted_name=predicted_name,
                confidence=detection['detection_confidence'],
                bounding_box=detection['bounding_box'],
                cropped_image_path=detection['cropped_image_path'],
                tile_source=detection['tile_source']
            )
            enrichment_inputs.append(enrichment_input)
        
        if not enrichment_inputs:
            logger.info("All detections already enriched")
            return await self.format_demo_results(detections)
        
        # Perform enrichment
        enrichment_results = await self.enricher.enrich_batch(enrichment_inputs)
        
        # Format results for demo display
        demo_results = await self.format_demo_results(detections, enrichment_results)
        
        return demo_results
    
    async def format_demo_results(self, detections: List[Dict], 
                                 enrichment_results: List[EnrichmentResult] = None) -> List[Dict]:
        """Format results for demo display with card metadata"""
        demo_results = []
        
        for i, detection in enumerate(detections):
            result = {
                'detection_id': str(detection['id']),
                'bounding_box': detection['bounding_box'],
                'cropped_image_path': detection['cropped_image_path'],
                'detection_confidence': detection['detection_confidence'],
                'tile_source': detection['tile_source'],
                'status': 'unknown'
            }
            
            # Check if we have enrichment results for this detection
            enrichment_result = None
            if enrichment_results:
                # Find matching enrichment result
                for er in enrichment_results:
                    if er.detection_id == str(detection['id']):
                        enrichment_result = er
                        break
            
            # Get card metadata if identified
            card_id = detection['pokemon_card_id']
            if enrichment_result and enrichment_result.success:
                card_id = enrichment_result.best_match.card_id
            
            if card_id:
                card_metadata = await self.get_card_metadata(card_id)
                if card_metadata:
                    result.update({
                        'status': 'identified',
                        'card_name': card_metadata['card_name'],
                        'set_name': card_metadata['set_name'],
                        'set_code': card_metadata['set_code'],
                        'card_number': card_metadata['card_number'],
                        'rarity': card_metadata['rarity'],
                        'pokemon_name': card_metadata['pokemon_name'],
                        'pokemon_types': card_metadata['pokemon_types'],
                        'hp': card_metadata['hp'],
                        'image_urls': card_metadata['image_urls'],
                        'artist': card_metadata['artist'],
                        'market_price': card_metadata['current_market_price'],
                        'holographic': card_metadata['holographic'],
                        'first_edition': card_metadata['first_edition'],
                        'identification_confidence': detection.get('identification_confidence', 0),
                        'identification_method': detection.get('identification_method', 'unknown')
                    })
                else:
                    result['status'] = 'error'
                    result['error'] = 'Card metadata not found'
            else:
                result['status'] = 'unidentified'
                result['error'] = 'No card match found'
                
                # Add enrichment error details if available
                if enrichment_result and not enrichment_result.success:
                    result['error'] = enrichment_result.error_message
            
            demo_results.append(result)
        
        return demo_results
    
    def print_demo_summary(self, job_id: str, results: List[Dict]):
        """Print a nice summary for the demo"""
        print(f"\n🎯 DEMO RESULTS FOR JOB {job_id}")
        print("=" * 60)
        
        identified = [r for r in results if r['status'] == 'identified']
        unidentified = [r for r in results if r['status'] == 'unidentified']
        errors = [r for r in results if r['status'] == 'error']
        
        print(f"📊 SUMMARY:")
        print(f"  Total Detections: {len(results)}")
        print(f"  ✅ Identified: {len(identified)}")
        print(f"  ❓ Unidentified: {len(unidentified)}")
        print(f"  ❌ Errors: {len(errors)}")
        print(f"  Success Rate: {len(identified)/len(results)*100:.1f}%")
        
        print(f"\n🃏 IDENTIFIED CARDS:")
        for result in identified[:10]:  # Show top 10
            confidence = result.get('identification_confidence', 0)
            price = result.get('market_price')
            price_str = f"${price:.2f}" if price else "N/A"
            
            print(f"  • {result['card_name']}")
            print(f"    Set: {result['set_name']} ({result['set_code']} #{result['card_number']})")
            print(f"    Rarity: {result['rarity']} | Price: {price_str} | Confidence: {confidence:.1f}%")
            print(f"    Method: {result.get('identification_method', 'unknown')}")
            print()
        
        if len(identified) > 10:
            print(f"  ... and {len(identified) - 10} more identified cards")
        
        if unidentified:
            print(f"\n❓ UNIDENTIFIED DETECTIONS: {len(unidentified)}")
            for result in unidentified[:3]:
                print(f"  • Detection {result['detection_id']}: {result.get('error', 'Unknown error')}")
        
        print("\n🚀 Ready for demo! This shows real card names instead of placeholders.")

async def test_single_enrichment():
    """Test enrichment with a single simulated detection"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://localhost/arceus')
    
    async with DemoIntegrator(database_url) as integrator:
        # Create a test detection
        test_detection = DetectionInput(
            detection_id="demo-test-123",
            job_id="demo-job-456",
            predicted_name="Charizard ex",
            confidence=0.85,
            bounding_box={"x": 100, "y": 100, "width": 200, "height": 300},
            cropped_image_path="/tmp/demo_crop.jpg"
        )
        
        print("🧪 Testing single card enrichment...")
        result = await integrator.enricher.enrich_detection(test_detection)
        
        print(f"\n📋 Test Result:")
        print(f"Success: {result.success}")
        
        if result.success and result.best_match:
            match = result.best_match
            print(f"✅ Identified: {match.card_name}")
            print(f"Set: {match.set_name} ({match.set_code})")
            print(f"Confidence: {result.identification_confidence:.1f}%")
            print(f"Match Type: {result.identification_method}")
            
            # Get full metadata
            card_metadata = await integrator.get_card_metadata(match.card_id)
            if card_metadata:
                price = card_metadata.get('current_market_price')
                print(f"Market Price: ${price:.2f}" if price else "Price: N/A")
                print(f"Rarity: {card_metadata.get('rarity')}")
                print(f"Artist: {card_metadata.get('artist')}")
        else:
            print(f"❌ Failed: {result.error_message}")

async def main():
    """Main demo function"""
    parser = argparse.ArgumentParser(description='Pokemon Card Enrichment Demo')
    parser.add_argument('--job-id', type=str, help='Process specific job ID')
    parser.add_argument('--test-single', action='store_true', help='Test single enrichment')
    parser.add_argument('--database-url', type=str, 
                       default=os.getenv('DATABASE_URL', 'postgresql://localhost/arceus'),
                       help='Database connection URL')
    
    args = parser.parse_args()
    
    if args.test_single:
        await test_single_enrichment()
        return
    
    if not args.job_id:
        parser.error("Must specify --job-id or --test-single")
    
    try:
        async with DemoIntegrator(args.database_url) as integrator:
            # Process the job
            results = await integrator.enrich_job_detections(args.job_id, use_simulation=True)
            
            # Print demo summary
            integrator.print_demo_summary(args.job_id, results)
            
            # Save results to file for UI integration
            output_file = f"demo_results_{args.job_id}.json"
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            print(f"\n💾 Results saved to {output_file}")
            print("🔗 Wire this into your UI to show real card names!")
            
    except Exception as e:
        logger.error(f"Demo failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 