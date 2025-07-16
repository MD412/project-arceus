# Main Worker Integration Plan - HybridCardIdentifierV2

## 🎯 Integration Strategy

### Current State Analysis
**Current worker.py:**
- Uses `clip_lookup.py` with 50% threshold
- 60-70% similarity scores
- No GPT fallback
- Manual review for failures

**Target State:**
- Use `HybridCardIdentifierV2` 
- 95%+ accuracy with cost control
- Smart CLIP → GPT routing
- Self-growing database

## 🔄 Integration Steps

### Step 1: Worker Module Integration
**File:** `worker/worker.py`

**Current Import:**
```python
from clip_lookup import CLIPCardIdentifier
```

**New Import:**
```python
from hybrid_card_identifier_v2 import HybridCardIdentifierV2
```

**Current Usage:**
```python
identifier = CLIPCardIdentifier(supabase_client=supabase_client)
result = identifier.identify_card_from_crop(crop_path, similarity_threshold=0.50)
```

**New Usage:**
```python
identifier = HybridCardIdentifierV2(supabase_client=supabase_client, gpt_daily_budget=0.10)
result = identifier.identify_card(crop_path)
```

### Step 2: Response Schema Mapping
**Current CLIP Response:**
```python
{
    'card_id': str,
    'name': str,
    'similarity': float
}
```

**New Hybrid Response:**
```python
{
    'success': bool,
    'method': 'clip' | 'gpt' | 'cached',
    'card': {
        'id': str,
        'name': str,
        'set_code': str,
        'number': str,
        'confidence': float
    },
    'cost_usd': float,
    'response_time_ms': int
}
```

**Mapping Logic:**
```python
def map_hybrid_to_worker_format(hybrid_result):
    if hybrid_result['success']:
        return {
            'card_id': hybrid_result['card']['id'],
            'name': hybrid_result['card']['name'],
            'confidence': hybrid_result['card']['confidence'],
            'method': hybrid_result['method'],
            'cost': hybrid_result['cost_usd']
        }
    else:
        return {
            'card_id': None,
            'name': 'Unknown',
            'confidence': 0.0,
            'method': 'failed',
            'cost': hybrid_result['cost_usd']
        }
```

### Step 3: Database Schema Updates
**Add tracking columns to `card_detections`:**
```sql
ALTER TABLE card_detections ADD COLUMN identification_method TEXT DEFAULT 'clip';
ALTER TABLE card_detections ADD COLUMN identification_cost DECIMAL(8,6) DEFAULT 0.0;
ALTER TABLE card_detections ADD COLUMN identification_confidence DECIMAL(3,2);
```

### Step 4: Cost Tracking Integration
**Add daily cost monitoring:**
```python
def log_identification_costs(scan_id, total_cost, method_breakdown):
    # Log to worker_logs table
    supabase.table('worker_logs').insert({
        'scan_id': scan_id,
        'log_type': 'cost_tracking',
        'message': f'Total ID cost: ${total_cost:.4f}',
        'metadata': method_breakdown
    }).execute()
```

## 🧪 Testing Strategy

### Unit Tests
**File:** `test_worker_integration.py`

**Test Cases:**
1. **High CLIP Confidence Path**
   - Mock CLIP result (85% similarity)
   - Verify GPT not called
   - Check cost = $0.00

2. **GPT Fallback Path**
   - Mock CLIP result (65% similarity)
   - Mock GPT success (90% confidence)
   - Verify both called in sequence
   - Check cost = ~$0.002

3. **Database Persistence**
   - Verify card_detections updated
   - Check new tracking columns
   - Validate cost logging

4. **Error Handling**
   - Mock GPT timeout
   - Mock CLIP failure
   - Verify graceful degradation

### Integration Tests
**File:** `test_end_to_end_pipeline.py`

**Test Flow:**
1. **Setup Test Scan**
   - Upload test image
   - Verify job queued

2. **Worker Processing**
   - YOLO detection
   - Hybrid identification
   - Database updates

3. **Results Validation**
   - Check scan status = 'ready'
   - Verify card_detections created
   - Validate cost tracking

4. **Performance Metrics**
   - Total pipeline latency < 10s
   - Identification accuracy > 90%
   - Cost per scan < $0.05

### Regression Tests
**File:** `test_accuracy_regression.py`

**Purpose:** Prevent accuracy degradation over time

**Test Dataset:**
- 50 validated card crops
- Known ground truth IDs
- Mix of easy/hard cases

**Success Criteria:**
- Accuracy ≥ 95% (vs previous run)
- Cost ≤ $0.10 total
- No performance regression

**Automated CI:**
```yaml
- name: Regression Test
  run: |
    python test_accuracy_regression.py
    if [ $? -ne 0 ]; then
      echo "❌ Accuracy regression detected!"
      exit 1
    fi
```

## 📊 Monitoring & Observability

### Real-time Dashboards
**Cost Tracking:**
- Daily GPT spend vs budget
- Cost per identification
- Method breakdown (CLIP vs GPT)

**Performance Metrics:**
- Identification accuracy
- Response time percentiles
- Error rates by method

**Business Metrics:**
- Cards processed per day
- Revenue per identification
- Customer satisfaction

### Alerting
**Budget Alerts:**
- 80% daily budget used
- Unusual cost spikes
- GPT API failures

**Performance Alerts:**
- Accuracy drops below 90%
- Latency exceeds 10s
- Error rate > 5%

## 🚀 Rollout Plan

### Phase 1: Shadow Mode (1 week)
- Run both old and new systems
- Compare results side-by-side
- No user-facing changes
- Validate accuracy/cost

### Phase 2: Gradual Rollout (1 week)
- 10% traffic to new system
- Monitor metrics closely
- Rollback plan ready
- A/B test results

### Phase 3: Full Production (ongoing)
- 100% traffic to hybrid system
- Continuous monitoring
- Cost optimization
- Performance tuning

## ✅ Production Readiness Checklist

### Code Quality
- [ ] Unit tests (>90% coverage)
- [ ] Integration tests pass
- [ ] Regression tests pass
- [ ] Code review completed
- [ ] Documentation updated

### Infrastructure
- [ ] Environment variables set
- [ ] OpenAI API key configured
- [ ] Database migrations applied
- [ ] Monitoring dashboards ready
- [ ] Alerting rules configured

### Performance
- [ ] Load testing completed
- [ ] Cost projections validated
- [ ] Accuracy benchmarks met
- [ ] Latency targets achieved
- [ ] Error handling tested

### Security
- [ ] API keys secured
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] Audit logging enabled

---

**Next Action:** Start with Step 1 - Worker Module Integration 