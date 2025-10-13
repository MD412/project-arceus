# ML Feedback Loop Architecture
## Learning from User Corrections to Improve Card Detection

### Overview
This document outlines the architecture for building a machine learning feedback loop that learns from user corrections when they fix misidentified cards. The system progressively improves detection accuracy by capturing correction patterns and retraining models based on validated user feedback.

## 1. Capture Correction Events

When a user corrects a card identification, we capture detailed information about what went wrong and what the correct answer should be.

```typescript
// POST /api/corrections endpoint
{
  detection_id: "uuid",
  original_crop_url: "scans/scan_id/crop_1.jpg",
  incorrect_prediction: {
    card_id: "flareon-vmax-18",
    confidence: 0.87,
    embedding_vector: [...]  // Optional: store for analysis
  },
  user_correction: {
    card_id: "pikachu-vmax-tg29",
    timestamp: "2025-01-15T10:30:00Z",
    user_id: "user-uuid",
    correction_reason: "wrong_character"  // Optional categorization
  }
}
```

## 2. Training Data Storage Structure

### Database Schema

```sql
-- Main corrections table for storing all user feedback
CREATE TABLE ml_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Image data
  crop_image_url text NOT NULL,
  crop_embedding vector(512),  -- CLIP/SigLIP embedding
  scan_id uuid REFERENCES scans(id),
  
  -- AI's incorrect prediction
  predicted_card_id text NOT NULL,
  predicted_confidence float NOT NULL,
  predicted_embedding vector(512),
  
  -- Human correction
  correct_card_id text NOT NULL,
  correction_confidence float DEFAULT 1.0,  -- User reliability score
  
  -- Metadata
  user_id uuid REFERENCES users(id),
  created_at timestamp DEFAULT NOW(),
  
  -- Validation tracking
  is_validated boolean DEFAULT false,
  validation_count int DEFAULT 1,
  consensus_reached_at timestamp,
  
  -- Analysis fields
  error_category text,  -- e.g., 'similar_character', 'lighting_issue'
  difficulty_score float  -- How hard this case is
);

-- Index for finding similar corrections
CREATE INDEX idx_corrections_card_pairs 
  ON ml_corrections(predicted_card_id, correct_card_id);

-- Index for finding corrections by image
CREATE INDEX idx_corrections_crop_url 
  ON ml_corrections(crop_image_url);
```

### Consensus Tracking Table

```sql
-- Track multiple users' opinions on the same crop
CREATE TABLE ml_correction_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_image_url text NOT NULL,
  card_id text NOT NULL,
  user_id uuid REFERENCES users(id),
  confidence float DEFAULT 1.0,
  created_at timestamp DEFAULT NOW(),
  
  UNIQUE(crop_image_url, user_id)
);
```

## 3. Smart Retraining Strategy

### Option A: Fine-tune Embeddings

Periodically retrain the embedding model using validated corrections:

```python
import torch
from torch.nn import TripletMarginLoss

class EmbeddingFineTuner:
    def __init__(self, base_model, corrections_db):
        self.model = base_model
        self.corrections = corrections_db
        
    def create_triplets(self, min_validations=3):
        """Create training triplets from corrections."""
        corrections = self.corrections.get_validated(min_validations)
        
        triplets = []
        for correction in corrections:
            triplets.append({
                'anchor': correction.crop_embedding,      # The scan
                'positive': correction.correct_embedding, # Correct card
                'negative': correction.predicted_embedding # Wrong guess
            })
        return triplets
    
    def retrain(self, epochs=10, lr=1e-5):
        """Fine-tune model on correction triplets."""
        triplets = self.create_triplets()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)
        criterion = TripletMarginLoss(margin=1.0)
        
        for epoch in range(epochs):
            for batch in self.batch_triplets(triplets):
                optimizer.zero_grad()
                
                anchor_out = self.model(batch['anchor'])
                positive_out = self.model(batch['positive'])
                negative_out = self.model(batch['negative'])
                
                loss = criterion(anchor_out, positive_out, negative_out)
                loss.backward()
                optimizer.step()
```

### Option B: Correction Layer

Build a lightweight correction network on top of the existing model:

```python
import torch.nn as nn

class CorrectionLayer(nn.Module):
    """Learns common misclassification patterns."""
    
    def __init__(self, embedding_dim=512, num_cards=15000):
        super().__init__()
        self.pattern_encoder = nn.Sequential(
            nn.Linear(embedding_dim + num_cards, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.ReLU()
        )
        
        self.correction_head = nn.Sequential(
            nn.Linear(128, num_cards),
            nn.Softmax(dim=1)
        )
        
    def forward(self, clip_embedding, initial_predictions):
        # Concatenate embedding with initial predictions
        features = torch.cat([clip_embedding, initial_predictions], dim=1)
        
        # Learn correction patterns
        patterns = self.pattern_encoder(features)
        
        # Output adjusted predictions
        corrected = self.correction_head(patterns)
        
        # Blend with original (learnable weighting)
        return 0.7 * initial_predictions + 0.3 * corrected
```

## 4. Intelligent Feedback Collection

### Priority Scoring System

```typescript
interface CorrectionPriority {
  confidenceGap: number;     // How wrong was the AI?
  patternFrequency: number;  // How often does this mistake happen?
  userTrustScore: number;    // How reliable is this user?
  consensusLevel: number;    // How many users agree?
}

class FeedbackPrioritizer {
  calculatePriority(correction: Correction): number {
    const factors = {
      // High confidence failures are most valuable
      confidenceGap: Math.abs(correction.predicted_confidence - 0.5) * 2,
      
      // Repeated patterns indicate systematic issues
      patternFrequency: this.getSimilarCorrectionCount(correction) / 10,
      
      // Trust users with good track records
      userTrustScore: this.getUserAccuracyScore(correction.user_id),
      
      // Multiple users agreeing increases confidence
      consensusLevel: this.getConsensusScore(correction.crop_url)
    };
    
    // Weighted combination
    return (
      factors.confidenceGap * 0.3 +
      factors.patternFrequency * 0.3 +
      factors.userTrustScore * 0.2 +
      factors.consensusLevel * 0.2
    );
  }
  
  async getUserAccuracyScore(userId: string): Promise<number> {
    // Track how often this user's corrections align with consensus
    const userCorrections = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_validated = true) as correct,
        COUNT(*) as total
      FROM ml_corrections
      WHERE user_id = $1
    `, [userId]);
    
    return userCorrections.correct / userCorrections.total;
  }
}
```

## 5. Progressive Learning System

### Three-Tier Approach

```python
class ProgressiveLearningSystem:
    def __init__(self):
        self.heuristics = HeuristicCorrector()
        self.embedding_adjuster = EmbeddingAdjuster()
        self.model_updater = ModelUpdater()
    
    def predict_with_corrections(self, image, base_prediction):
        """Apply corrections at multiple levels."""
        
        # Tier 1: Immediate heuristic corrections (ms latency)
        prediction = self.heuristics.apply_rules(image, base_prediction)
        
        # Tier 2: Embedding space adjustments (updated weekly)
        if self.embedding_adjuster.has_updates():
            prediction = self.embedding_adjuster.adjust(prediction)
        
        # Tier 3: Full model updates (monthly, if needed)
        if self.model_updater.is_active():
            prediction = self.model_updater.predict(image)
        
        return prediction


class HeuristicCorrector:
    """Fast, rule-based corrections for known issues."""
    
    def __init__(self):
        self.rules = {
            'pikachu_vmax_variants': self.check_surfing_vs_regular,
            'gold_cards': self.check_texture_pattern,
            'promo_cards': self.check_promo_markers,
            'evolution_stages': self.check_evolution_consistency
        }
    
    def check_surfing_vs_regular(self, image, prediction):
        """Distinguish between Surfing Pikachu and regular Pikachu."""
        if 'pikachu' in prediction.card_name.lower():
            # Check for water-type energy symbols
            has_water = self.detect_water_energy(image)
            if has_water and 'surfing' not in prediction.card_name.lower():
                return self.find_surfing_variant(prediction)
        return prediction
```

## 6. Validation & Consensus

### Multi-User Validation

```sql
-- Function to check if correction has reached consensus
CREATE OR REPLACE FUNCTION check_correction_consensus(
  p_crop_url text,
  p_min_votes int DEFAULT 3,
  p_agreement_threshold float DEFAULT 0.7
) RETURNS TABLE(
  consensus_card_id text,
  confidence float,
  vote_count int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    card_id,
    COUNT(*)::float / total_votes.count as confidence,
    COUNT(*)::int as vote_count
  FROM ml_correction_votes
  CROSS JOIN (
    SELECT COUNT(*) as count
    FROM ml_correction_votes
    WHERE crop_image_url = p_crop_url
  ) as total_votes
  WHERE crop_image_url = p_crop_url
  GROUP BY card_id, total_votes.count
  HAVING COUNT(*)::float / total_votes.count >= p_agreement_threshold
    AND COUNT(*) >= p_min_votes
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to mark corrections as validated
CREATE OR REPLACE FUNCTION update_correction_validation()
RETURNS TRIGGER AS $$
DECLARE
  consensus_result RECORD;
BEGIN
  -- Check for consensus
  SELECT * INTO consensus_result
  FROM check_correction_consensus(NEW.crop_image_url);
  
  IF consensus_result IS NOT NULL THEN
    -- Update all corrections for this crop
    UPDATE ml_corrections
    SET 
      is_validated = true,
      validation_count = consensus_result.vote_count,
      consensus_reached_at = NOW()
    WHERE crop_image_url = NEW.crop_image_url
      AND correct_card_id = consensus_result.consensus_card_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_consensus
AFTER INSERT ON ml_correction_votes
FOR EACH ROW
EXECUTE FUNCTION update_correction_validation();
```

## 7. Feedback UI Enhancement

### Confidence Indicators

```tsx
// components/correction/ConfidenceIndicator.tsx
interface ConfidenceIndicatorProps {
  confidence: number;
  hasBeenCorrectedBefore: boolean;
  similarCorrectionCount: number;
}

export function ConfidenceIndicator({
  confidence,
  hasBeenCorrectedBefore,
  similarCorrectionCount
}: ConfidenceIndicatorProps) {
  const getConfidenceColor = () => {
    if (confidence > 0.9) return 'var(--color-success)';
    if (confidence > 0.7) return 'var(--color-warning)';
    return 'var(--color-error)';
  };
  
  return (
    <div className="ai-confidence-indicator">
      <div className="confidence-bar">
        <div 
          className="confidence-fill"
          style={{
            width: `${confidence * 100}%`,
            backgroundColor: getConfidenceColor()
          }}
        />
      </div>
      
      <div className="confidence-details">
        <span>AI Confidence: {(confidence * 100).toFixed(0)}%</span>
        
        {confidence < 0.7 && (
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon size={14} />
            </TooltipTrigger>
            <TooltipContent>
              Low confidence - your correction helps us learn!
            </TooltipContent>
          </Tooltip>
        )}
        
        {hasBeenCorrectedBefore && (
          <Badge variant="outline">
            Common mistake • {similarCorrectionCount} similar corrections
          </Badge>
        )}
      </div>
    </div>
  );
}

// Feedback toast after correction
export function CorrectionFeedback({ correction }) {
  return (
    <Toast>
      <div className="correction-feedback">
        <CheckCircle className="text-success" />
        <div>
          <p>Thanks! Your correction helps improve detection for everyone.</p>
          {correction.similarCount > 5 && (
            <p className="text-muted">
              {correction.similarCount} others made this same correction.
            </p>
          )}
          {correction.confidence < 0.5 && (
            <p className="text-muted">
              This was a particularly tricky one - extra valuable feedback!
            </p>
          )}
        </div>
      </div>
    </Toast>
  );
}
```

## 8. Smart Deployment Strategy

### A/B Testing Framework

```python
class ModelDeployment:
    def __init__(self):
        self.stable_model = load_model('stable')
        self.experimental_model = None
        self.beta_users = set()
        self.metrics = MetricsCollector()
    
    def get_model_for_user(self, user_id: str):
        """Route users to appropriate model version."""
        # Check if experimental model exists and user is in beta
        if self.experimental_model and user_id in self.beta_users:
            return self.experimental_model
        return self.stable_model
    
    def gradual_rollout(self, new_model, target_percentage=100):
        """Gradually roll out new model based on performance."""
        stages = [
            (0.01, 7),   # 1% for 1 week
            (0.05, 7),   # 5% for 1 week  
            (0.10, 7),   # 10% for 1 week
            (0.25, 3),   # 25% for 3 days
            (0.50, 3),   # 50% for 3 days
            (1.00, 0),   # 100% (full rollout)
        ]
        
        for percentage, days in stages:
            self.set_rollout_percentage(new_model, percentage)
            
            # Monitor metrics
            metrics = self.metrics.compare_models(days)
            
            if metrics['new_accuracy'] < metrics['old_accuracy'] * 0.95:
                # New model is >5% worse, rollback
                self.rollback()
                raise ModelRollbackException("Performance regression detected")
            
            if metrics['new_accuracy'] > metrics['old_accuracy'] * 1.05:
                # New model is >5% better, accelerate rollout
                self.set_rollout_percentage(new_model, 1.0)
                break
    
    def set_rollout_percentage(self, model, percentage):
        """Set what percentage of users get the new model."""
        self.experimental_model = model
        
        # Clear and repopulate beta users
        self.beta_users.clear()
        all_users = self.get_all_user_ids()
        sample_size = int(len(all_users) * percentage)
        
        # Use consistent hashing for stable assignment
        for user_id in all_users:
            if hash(user_id) % 100 < percentage * 100:
                self.beta_users.add(user_id)
```

### Monitoring & Metrics

```python
class MetricsCollector:
    def __init__(self, db):
        self.db = db
    
    async def track_prediction(self, user_id, model_version, prediction, actual=None):
        """Track all predictions for analysis."""
        await self.db.execute("""
            INSERT INTO ml_metrics (
                user_id, model_version, prediction_id,
                predicted_card, confidence, actual_card,
                is_correct, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        """, user_id, model_version, prediction.id, 
            prediction.card_id, prediction.confidence,
            actual, actual == prediction.card_id if actual else None)
    
    def compare_models(self, days=7):
        """Compare model performance over time period."""
        return self.db.fetch_one("""
            SELECT 
                model_version,
                COUNT(*) as total_predictions,
                AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) as accuracy,
                AVG(confidence) as avg_confidence,
                AVG(CASE 
                    WHEN is_correct THEN confidence 
                    ELSE 1 - confidence 
                END) as calibration_score
            FROM ml_metrics
            WHERE timestamp > NOW() - INTERVAL '%s days'
            GROUP BY model_version
        """, days)
```

## 9. Implementation Roadmap

### Phase 1: Data Collection (Week 1-2)
- [ ] Create corrections database tables
- [ ] Implement `/api/corrections` endpoint
- [ ] Add correction UI in modal
- [ ] Start collecting user feedback

### Phase 2: Analysis & Heuristics (Week 3-4)
- [ ] Analyze common correction patterns
- [ ] Build heuristic rules for top mistakes
- [ ] Implement HeuristicCorrector class
- [ ] Deploy quick fixes

### Phase 3: Consensus System (Week 5-6)
- [ ] Build multi-user validation
- [ ] Create consensus tracking
- [ ] Implement trust scoring
- [ ] Add validation UI indicators

### Phase 4: Model Retraining (Week 7-10)
- [ ] Set up training pipeline
- [ ] Implement triplet loss fine-tuning
- [ ] Build correction layer network
- [ ] Create A/B testing framework

### Phase 5: Deployment & Monitoring (Week 11-12)
- [ ] Implement gradual rollout
- [ ] Set up metrics dashboard
- [ ] Create rollback procedures
- [ ] Document learnings

## Key Insights

1. **Start Simple**: Begin with data collection and heuristic rules before complex ML
2. **Trust but Verify**: Use consensus to validate corrections before training
3. **Layer Approach**: Heuristics → Embeddings → Full Model (increasing complexity)
4. **Gradual Rollout**: Test improvements carefully with small user groups first
5. **Feedback Loop**: Show users their impact to encourage more corrections

## Estimated Impact

Based on similar systems, we can expect:
- **15-25% reduction** in misclassification rate after Phase 2
- **30-40% reduction** after Phase 4
- **50-60% reduction** after 6 months of learning

The system becomes increasingly valuable as more corrections accumulate, creating a network effect where each user's contribution benefits everyone.
