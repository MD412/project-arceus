"""
Phase 5b: Auto-Learning System - Training Feedback Processor

This script harvests user corrections from the training_feedback table,
generates embeddings using CLIP, and updates the gallery templates to
improve model accuracy over time.

Usage:
    python scripts/process_training_feedback.py [--batch-size 100] [--dry-run]

The Factory Pipeline:
    1. HARVEST: Query unprocessed corrections from training_feedback
    2. FILTER: Validate crop exists, card exists, not duplicate
    3. EMBED: Generate 512-dim CLIP embeddings
    4. EVALUATE: Check distinction gap (similarity difference)
    5. STORE: Save .npy files + update template_metadata
    6. REBUILD: Update prototypes for affected cards
    7. MARK COMPLETE: Set processed_at timestamp
"""

import os
import sys
import argparse
import logging
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
from typing import List, Dict, Optional, Tuple

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client, Client
from worker.openclip_embedder import OpenCLIPEmbedder
from worker.config import get_supabase_config

# Configuration
GALLERY_BASE_PATH = Path("gallery")
MAX_USER_TEMPLATES_PER_CARD = 10
MIN_DISTINCTION_GAP = 0.15  # Minimum similarity difference to keep template
MIN_QUALITY_SCORE = 0.6

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(message)s',
    datefmt='%H:%M:%S'
)

logger = logging.getLogger(__name__)


class TrainingFeedbackProcessor:
    """Processes user corrections into improved ML templates."""
    
    def __init__(self, supabase_client: Client, embedder: OpenCLIPEmbedder, dry_run: bool = False):
        self.supabase = supabase_client
        self.embedder = embedder
        self.dry_run = dry_run
        self.stats = {
            'harvested': 0,
            'filtered_out': 0,
            'embedded': 0,
            'stored': 0,
            'rejected_low_quality': 0,
            'rejected_no_gap': 0,
            'cards_rebuilt': 0,
            'errors': 0
        }
    
    def run(self, batch_size: int = 100):
        """Main processing loop."""
        logger.info("=" * 60)
        logger.info("Phase 5b: Training Feedback Processor Starting")
        logger.info("=" * 60)
        logger.info(f"Batch size: {batch_size}")
        logger.info(f"Dry run: {self.dry_run}")
        logger.info("")
        
        # Step 1: Harvest
        corrections = self.harvest_corrections(batch_size)
        if not corrections:
            logger.info("✓ No unprocessed corrections found. All caught up!")
            return
        
        # Step 2-7: Process each correction
        processed_card_ids = set()
        for correction in corrections:
            try:
                card_id = self.process_correction(correction)
                if card_id:
                    processed_card_ids.add(card_id)
            except Exception as e:
                logger.error(f"✗ Error processing {correction['id']}: {e}")
                self.stats['errors'] += 1
        
        # Step 6: Rebuild prototypes for affected cards
        if processed_card_ids and not self.dry_run:
            logger.info("")
            logger.info(f"Rebuilding prototypes for {len(processed_card_ids)} cards...")
            for card_id in processed_card_ids:
                try:
                    self.rebuild_prototype(card_id)
                    self.stats['cards_rebuilt'] += 1
                except Exception as e:
                    logger.error(f"✗ Failed to rebuild {card_id}: {e}")
        
        # Print summary
        self.print_summary()
    
    def harvest_corrections(self, batch_size: int) -> List[Dict]:
        """Step 1: Query unprocessed corrections from training_feedback."""
        logger.info("[STEP 1] Harvesting corrections...")
        
        try:
            response = self.supabase.table('training_feedback').select(
                'id, scan_id, detection_id, crop_storage_path, '
                'predicted_card_id, prediction_score, corrected_card_id, '
                'corrected_by, created_at'
            ).is_('processed_at', 'null').limit(batch_size).execute()
            
            corrections = response.data
            self.stats['harvested'] = len(corrections)
            
            logger.info(f"  Found {len(corrections)} unprocessed corrections")
            
            # Filter for actual corrections (not just logged predictions)
            corrections_with_fixes = [c for c in corrections if c.get('corrected_card_id')]
            logger.info(f"  {len(corrections_with_fixes)} have user corrections")
            
            return corrections_with_fixes
            
        except Exception as e:
            logger.error(f"✗ Harvest failed: {e}")
            return []
    
    def process_correction(self, correction: Dict) -> Optional[str]:
        """Steps 2-5: Filter, embed, evaluate, and store a single correction."""
        correction_id = correction['id']
        wrong_card = correction.get('predicted_card_id')
        correct_card = correction.get('corrected_card_id')
        crop_path = correction.get('crop_storage_path')
        
        logger.info(f"Processing: {wrong_card} → {correct_card}")
        
        # Step 2: Filter
        if not self.filter_correction(correction):
            self.stats['filtered_out'] += 1
            if not self.dry_run:
                self.mark_processed(correction_id, 'rejected')
            return None
        
        # Step 3: Embed
        try:
            embedding = self.generate_embedding(crop_path)
            if embedding is None:
                raise ValueError("Embedding generation failed")
            self.stats['embedded'] += 1
        except Exception as e:
            logger.error(f"  ✗ Embedding failed: {e}")
            self.stats['errors'] += 1
            return None
        
        # Step 4: Evaluate quality
        quality_score, distinction_gap = self.evaluate_template(
            embedding, correct_card, wrong_card
        )
        
        logger.info(f"  Quality: {quality_score:.2f}, Gap: {distinction_gap:.2f}")
        
        if quality_score < MIN_QUALITY_SCORE:
            logger.info(f"  ✗ Rejected: Low quality ({quality_score:.2f})")
            self.stats['rejected_low_quality'] += 1
            if not self.dry_run:
                self.mark_processed(correction_id, 'rejected_quality')
            return None
        
        if distinction_gap < MIN_DISTINCTION_GAP:
            logger.info(f"  ✗ Rejected: Ambiguous ({distinction_gap:.2f} gap)")
            self.stats['rejected_no_gap'] += 1
            if not self.dry_run:
                self.mark_processed(correction_id, 'rejected_ambiguous')
            return None
        
        # Step 5: Store
        if not self.dry_run:
            template_id = self.store_template(
                embedding, correct_card, correction_id, 
                quality_score, [wrong_card] if wrong_card else []
            )
            
            if template_id:
                self.update_confusion_matrix(wrong_card, correct_card, distinction_gap)
                self.mark_processed(correction_id, 'processed')
                self.stats['stored'] += 1
                logger.info(f"  ✓ Stored template for {correct_card}")
                return correct_card
        else:
            logger.info(f"  [DRY RUN] Would store template for {correct_card}")
            return correct_card
        
        return None
    
    def filter_correction(self, correction: Dict) -> bool:
        """Step 2: Validate correction is worth processing."""
        crop_path = correction.get('crop_storage_path')
        correct_card = correction.get('corrected_card_id')
        
        # Must have crop path
        if not crop_path:
            logger.info("  ✗ No crop path")
            return False
        
        # Must have corrected card ID
        if not correct_card:
            logger.info("  ✗ No corrected card ID")
            return False
        
        # Check if crop exists in storage
        try:
            self.supabase.storage.from_('card-crops').download(crop_path)
        except Exception:
            logger.info(f"  ✗ Crop not found: {crop_path}")
            return False
        
        # Check if we're at template cap for this card
        user_template_count = self.count_user_templates(correct_card)
        if user_template_count >= MAX_USER_TEMPLATES_PER_CARD:
            logger.info(f"  ⚠ At template cap ({MAX_USER_TEMPLATES_PER_CARD}), will replace lowest quality")
        
        return True
    
    def generate_embedding(self, crop_path: str) -> Optional[np.ndarray]:
        """Step 3: Generate CLIP embedding from crop image."""
        try:
            # Download crop from storage
            crop_bytes = self.supabase.storage.from_('card-crops').download(crop_path)
            
            # Generate embedding using CLIP
            embedding = self.embedder.embed_image_bytes(crop_bytes)
            
            return embedding
        except Exception as e:
            logger.error(f"  ✗ Embedding generation failed: {e}")
            return None
    
    def evaluate_template(
        self, embedding: np.ndarray, correct_card: str, wrong_card: Optional[str]
    ) -> Tuple[float, float]:
        """Step 4: Evaluate if template is high quality and distinctive."""
        # TODO: Implement actual quality metrics (sharpness, etc)
        # For now, use distinction gap as proxy for quality
        quality_score = 0.8  # Placeholder
        
        # Calculate distinction gap
        distinction_gap = 0.0
        if wrong_card and wrong_card != correct_card:
            # Load prototypes
            correct_proto = self.load_prototype(correct_card)
            wrong_proto = self.load_prototype(wrong_card)
            
            if correct_proto is not None and wrong_proto is not None:
                sim_correct = self.cosine_similarity(embedding, correct_proto)
                sim_wrong = self.cosine_similarity(embedding, wrong_proto)
                distinction_gap = sim_correct - sim_wrong
                
                # Use gap as quality indicator too
                quality_score = min(1.0, 0.5 + distinction_gap)
        
        return quality_score, distinction_gap
    
    def store_template(
        self, embedding: np.ndarray, card_id: str, feedback_id: str,
        quality_score: float, distinguishes_from: List[str]
    ) -> Optional[str]:
        """Step 5: Save template to disk and update metadata."""
        try:
            # Create gallery directory for card if needed
            card_dir = GALLERY_BASE_PATH / f"card_{card_id.replace('-', '_')}"
            user_dir = card_dir / "user_corrections"
            user_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate filename
            timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
            filename = f"user_{timestamp}.npy"
            template_path = user_dir / filename
            
            # Check if at cap, replace lowest quality if needed
            user_count = self.count_user_templates(card_id)
            if user_count >= MAX_USER_TEMPLATES_PER_CARD:
                self.replace_lowest_quality_template(card_id)
            
            # Save embedding
            np.save(template_path, embedding)
            
            # Insert metadata
            response = self.supabase.table('template_metadata').insert({
                'card_id': card_id,
                'template_type': 'user_correction',
                'source_feedback_id': feedback_id,
                'embedding_path': str(template_path),
                'quality_score': quality_score,
                'distinguishes_from': distinguishes_from
            }).execute()
            
            return response.data[0]['id'] if response.data else None
            
        except Exception as e:
            logger.error(f"  ✗ Failed to store template: {e}")
            return None
    
    def rebuild_prototype(self, card_id: str):
        """Step 6: Rebuild prototype for card from all templates."""
        try:
            card_dir = GALLERY_BASE_PATH / f"card_{card_id.replace('-', '_')}"
            
            # Load all templates
            templates = []
            
            # Official templates
            official_dir = card_dir / "official"
            if official_dir.exists():
                for npy_file in official_dir.glob("*.npy"):
                    templates.append(np.load(npy_file))
            
            # User correction templates
            user_dir = card_dir / "user_corrections"
            if user_dir.exists():
                for npy_file in user_dir.glob("*.npy"):
                    templates.append(np.load(npy_file))
            
            if not templates:
                logger.warning(f"  ⚠ No templates found for {card_id}")
                return
            
            # Compute new prototype (mean of all templates)
            prototype = np.mean(templates, axis=0)
            
            # Save prototype
            prototype_path = card_dir / "prototype.npy"
            np.save(prototype_path, prototype)
            
            logger.info(f"  ✓ Rebuilt {card_id} prototype from {len(templates)} templates")
            
        except Exception as e:
            logger.error(f"  ✗ Prototype rebuild failed: {e}")
            raise
    
    def count_user_templates(self, card_id: str) -> int:
        """Count existing user templates for a card."""
        try:
            response = self.supabase.rpc('count_user_templates', {'p_card_id': card_id}).execute()
            return response.data or 0
        except:
            return 0
    
    def replace_lowest_quality_template(self, card_id: str):
        """Replace the lowest quality user template when at cap."""
        try:
            response = self.supabase.rpc('get_lowest_quality_template', {'p_card_id': card_id}).execute()
            template_id = response.data
            
            if template_id:
                # Get template path
                meta = self.supabase.table('template_metadata').select('embedding_path').eq('id', template_id).single().execute()
                template_path = Path(meta.data['embedding_path'])
                
                # Delete file and metadata
                if template_path.exists():
                    template_path.unlink()
                
                self.supabase.table('template_metadata').delete().eq('id', template_id).execute()
                logger.info(f"  ⚠ Replaced lowest quality template for {card_id}")
        except Exception as e:
            logger.error(f"  ✗ Failed to replace template: {e}")
    
    def update_confusion_matrix(self, wrong_card: Optional[str], correct_card: str, similarity: float):
        """Update confusion matrix with this correction."""
        if not wrong_card or wrong_card == correct_card:
            return
        
        try:
            self.supabase.rpc('update_card_confusion', {
                'p_wrong': wrong_card,
                'p_correct': correct_card,
                'p_similarity': 1.0 - similarity  # Convert gap to similarity
            }).execute()
        except Exception as e:
            logger.error(f"  ⚠ Confusion matrix update failed: {e}")
    
    def mark_processed(self, correction_id: str, status: str):
        """Step 7: Mark correction as processed in training_feedback."""
        try:
            self.supabase.table('training_feedback').update({
                'processed_at': datetime.now(timezone.utc).isoformat(),
                'training_status': status
            }).eq('id', correction_id).execute()
        except Exception as e:
            logger.error(f"  ⚠ Failed to mark processed: {e}")
    
    def load_prototype(self, card_id: str) -> Optional[np.ndarray]:
        """Load prototype embedding for a card."""
        try:
            card_dir = GALLERY_BASE_PATH / f"card_{card_id.replace('-', '_')}"
            prototype_path = card_dir / "prototype.npy"
            
            if prototype_path.exists():
                return np.load(prototype_path)
        except:
            pass
        return None
    
    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    def print_summary(self):
        """Print processing summary."""
        logger.info("")
        logger.info("=" * 60)
        logger.info("PROCESSING SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Corrections harvested:      {self.stats['harvested']}")
        logger.info(f"Filtered out:               {self.stats['filtered_out']}")
        logger.info(f"Embeddings generated:       {self.stats['embedded']}")
        logger.info(f"Templates stored:           {self.stats['stored']}")
        logger.info(f"Rejected (low quality):     {self.stats['rejected_low_quality']}")
        logger.info(f"Rejected (ambiguous):       {self.stats['rejected_no_gap']}")
        logger.info(f"Cards with rebuilt protos:  {self.stats['cards_rebuilt']}")
        logger.info(f"Errors:                     {self.stats['errors']}")
        logger.info("=" * 60)


def main():
    parser = argparse.ArgumentParser(description='Phase 5b: Process training feedback into ML improvements')
    parser.add_argument('--batch-size', type=int, default=100, help='Number of corrections to process')
    parser.add_argument('--dry-run', action='store_true', help='Run without making changes')
    args = parser.parse_args()
    
    # Initialize clients
    config = get_supabase_config()
    supabase = create_client(config['url'], config['service_key'])
    embedder = OpenCLIPEmbedder()
    
    # Run processor
    processor = TrainingFeedbackProcessor(supabase, embedder, dry_run=args.dry_run)
    processor.run(batch_size=args.batch_size)


if __name__ == '__main__':
    main()

