# Test Data for Project Arceus E2E Tests

## 📁 Required Test Images

For the comprehensive E2E tests to run successfully, you need the following test images:

### 1. Sample Pokemon Binder (`sample_pokemon_binder.jpg`)
- **Purpose**: Main test image for complete user flow
- **Requirements**: 
  - Contains 3-10 Pokemon cards
  - Mix of different card types (regular, EX, GX, etc.)
  - Various confidence levels for Bicameral AI testing
  - Clear enough for YOLO detection
- **Recommended Size**: 1920x1080 or similar

### 2. Single Pokemon Card (`single_pokemon_card.jpg`)
- **Purpose**: Simple single-card identification test
- **Requirements**:
  - Single Pokemon card, well-lit
  - Known card for validation (e.g., Charizard, Pikachu)
  - High quality for accurate identification

### 3. Mixed Quality Cards (`mixed_quality_cards.jpg`)
- **Purpose**: Tests edge cases and error handling
- **Requirements**:
  - Mix of clear and blurry cards
  - Some partially obscured cards
  - Mix of holographic and regular cards
  - Tests preprocessing variants

## 🔧 Setup Instructions

### Option 1: Use Your Own Images
1. Place your test images in this directory
2. Ensure filenames match the expected names above
3. Run tests: `npm run test:e2e`

### Option 2: Generate Test Images
```bash
# Create placeholder test images (for development)
npm run generate:test-images

# This will create basic test images that work with the test structure
```

### Option 3: Download Sample Images
```bash
# Download curated test images (if available)
npm run download:test-data

# This downloads pre-validated test images that work well with the AI system
```

## 📊 Test Image Validation

To validate your test images work well with the system:

```bash
# Test image processing locally
cd worker
python -c "
from hybrid_card_identifier_v3 import test_bicameral_integration
test_bicameral_integration()
"

# Run CLIP accuracy validation
python __tests__/ocr/test_clip_accuracy.py
```

## 🎯 Expected Test Results

### Bicameral AI Analysis
- **Agreement Scores**: Should vary from 0.0 to 1.0
- **Recommendations**: Mix of trust_clip, trust_ocr, manual_review
- **Processing Time**: <2 minutes for most images

### Review UI Testing
- **Card Detection**: At least 1 card detected
- **Confidence Filtering**: Should work across all levels
- **Keyboard Navigation**: All shortcuts functional

### Performance Benchmarks
- **Upload Time**: <30 seconds
- **Processing Time**: <2 minutes
- **Review Load**: <5 seconds
- **Navigation Response**: <1 second

## 🚫 What NOT to Include

- **Copyrighted Images**: Don't include official Pokemon artwork
- **Personal Photos**: Keep test images generic
- **Large Files**: Keep under 10MB per image
- **Inappropriate Content**: Keep it family-friendly

## 📝 Test Image Metadata

For each test image, you can optionally create a `.json` metadata file:

```json
{
  "filename": "sample_pokemon_binder.jpg",
  "description": "Mixed Pokemon cards for comprehensive testing",
  "expected_cards": [
    {"name": "Charizard ex", "confidence": "high"},
    {"name": "Pikachu", "confidence": "medium"},
    {"name": "Unknown Card", "confidence": "low"}
  ],
  "test_scenarios": [
    "bicameral_agreement_analysis",
    "keyboard_navigation",
    "bulk_feedback",
    "collection_management"
  ],
  "performance_expectations": {
    "processing_time_ms": 90000,
    "cards_detected": 5,
    "high_confidence_cards": 2
  }
}
```

## 🔄 Updating Test Images

When updating test images:

1. **Backup Old Images**: Keep previous versions for regression testing
2. **Update Expectations**: Modify test assertions if needed
3. **Validate Changes**: Run full test suite to ensure compatibility
4. **Document Changes**: Update this README with any new requirements

---

**These test images are crucial for validating the complete Bicameral AI system. Quality test data ensures reliable E2E test results and catches regressions early.** 🧪✨ 