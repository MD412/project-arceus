#!/usr/bin/env python3
"""
Unit tests for worker components
Tests CLIP lookup, image processing, and card identification
"""
import pytest
import numpy as np
from pathlib import Path
import sys

# Add worker directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "worker"))

from clip_lookup import CLIPCardIdentifier
from PIL import Image


class TestCLIPLookup:
    """Test CLIP card identification functionality"""
    
    @pytest.fixture
    def clip_identifier(self):
        """Provide a CLIP identifier instance"""
        return CLIPCardIdentifier()
    
    def test_embedding_generation(self, clip_identifier):
        """Test CLIP embedding generation from image"""
        # Use test fixture image
        image_path = Path(__file__).parent.parent / "ocr" / "fixtures" / "pikachu_crop.jpg"
        
        if not image_path.exists():
            pytest.skip(f"Test image not found: {image_path}")
        
        embedding = clip_identifier.encode_image_from_path(str(image_path))
        
        assert embedding is not None
        assert embedding.shape == (512,)  # CLIP ViT-B/32 dimension
        assert -1 <= embedding.min() <= embedding.max() <= 1
        assert np.isfinite(embedding).all()
    
    def test_similarity_calculation(self, clip_identifier):
        """Test cosine similarity calculation"""
        # Create two random embeddings
        embedding1 = np.random.randn(512)
        embedding1 = embedding1 / np.linalg.norm(embedding1)  # Normalize
        
        embedding2 = np.random.randn(512)
        embedding2 = embedding2 / np.linalg.norm(embedding2)  # Normalize
        
        # Test similarity with itself (should be 1.0)
        self_similarity = np.dot(embedding1, embedding1)
        assert abs(self_similarity - 1.0) < 0.0001
        
        # Test similarity with different embedding (should be between -1 and 1)
        cross_similarity = np.dot(embedding1, embedding2)
        assert -1 <= cross_similarity <= 1
    
    def test_image_preprocessing(self, clip_identifier):
        """Test image preprocessing for CLIP"""
        # Create a test image
        test_image = Image.new('RGB', (100, 100), color='red')
        
        # Process it
        processed = clip_identifier.preprocess_image(test_image)
        
        assert processed is not None
        assert hasattr(processed, 'shape')
        assert processed.shape[0] == 1  # Batch dimension


class TestImageProcessing:
    """Test image processing utilities"""
    
    def test_image_resize_maintains_aspect_ratio(self):
        """Test that image resizing maintains aspect ratio"""
        from worker import resize_image_if_needed
        
        # Create test image
        test_image = Image.new('RGB', (3000, 4000), color='blue')
        
        # Resize it
        resized = resize_image_if_needed(test_image, max_size=2048)
        
        # Check dimensions
        assert resized.width <= 2048
        assert resized.height <= 2048
        
        # Check aspect ratio maintained
        original_ratio = test_image.width / test_image.height
        resized_ratio = resized.width / resized.height
        assert abs(original_ratio - resized_ratio) < 0.01
    
    def test_crop_extraction(self):
        """Test extracting card crops from bounding boxes"""
        # Create test image
        test_image = Image.new('RGB', (1000, 1000), color='white')
        
        # Test bounding box
        bbox = [100, 100, 300, 400]  # x1, y1, x2, y2
        
        crop = test_image.crop(bbox)
        
        assert crop.width == 200  # x2 - x1
        assert crop.height == 300  # y2 - y1


class TestDatabaseOperations:
    """Test database operations"""
    
    @pytest.mark.skip(reason="Requires database connection")
    def test_job_dequeue(self):
        """Test job dequeue operation"""
        # This would test the dequeue_and_start_job function
        pass
    
    @pytest.mark.skip(reason="Requires database connection")
    def test_scan_creation(self):
        """Test creating a new scan record"""
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 