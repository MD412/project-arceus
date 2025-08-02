# GPT-4o Mini Vision Integration - Testing Plan

## 🎯 Success Metrics

### Primary Success Criteria
- **Accuracy**: ≥90% correct card identification (vs 60-70% CLIP alone)
- **Cost**: ≤$2/month at projected usage (100 crops/day)
- **Latency**: ≤5 seconds average response time
- **Coverage**: Handle cards not in our 250-card CLIP database

### Secondary Success Criteria
- **Fallback Flow**: Graceful degradation when GPT fails/times out
- **Budget Safety**: Hard stop at daily spending limit ($0.10/day)
- **Observability**: Clear logging of costs, tokens, and confidence scores

## 🧪 Testing Strategy

### Phase 1: Prompt Engineering (Current)
**Objective**: Design optimal prompt for Pokemon card identification

**Test Dataset**: 
- Use existing crop images from `worker/output/`
- ~50 diverse card crops (different sets, rarities, conditions)

**Success Criteria**:
- ≥95% accuracy on test crops
- Consistent JSON schema responses
- <3 second average response time

**Deliverables**:
- `test_gpt4_prompt.py` - Prompt validation script
- Optimized prompt template
- JSON response schema

### Phase 2: Integration Testing
**Objective**: Test CLIP → GPT fallback pipeline

**Test Scenarios**:
- CLIP high confidence (≥0.80) → Skip GPT
- CLIP medium confidence (0.50-0.79) → Call GPT
- CLIP low confidence (<0.50) → Call GPT
- GPT timeout/error → Fallback to manual review

**Success Criteria**:
- Correct routing based on CLIP confidence
- Cost tracking accuracy (±$0.001)
- Error handling without crashes

**Deliverables**:
- `test_gpt4_integration.py` - Integration test suite
- `HybridCardIdentifier` with GPT fallback
- Cost monitoring dashboard

### Phase 3: End-to-End Testing
**Objective**: Full pipeline validation

**Test Flow**:
1. Upload real scan → Job queue
2. Worker processes → YOLO detection
3. CLIP search → GPT fallback (if needed)
4. Database caching → Results display

**Success Criteria**:
- <10 second total pipeline latency
- Successful database updates
- Real-time UI updates

**Deliverables**:
- `test_end_to_end.py` - Full pipeline tests
- Performance benchmarks
- Production readiness checklist

## 📊 Cost Monitoring Strategy

### Budget Controls
- Daily spending cap: $0.10
- Monthly spending cap: $2.00
- Alert at 80% of daily budget
- Hard stop at 100% of daily budget

### Cost Tracking
```python
# Track per request:
- Input tokens
- Output tokens  
- Total cost ($)
- Response time (ms)
- Success/failure status
```

### Reporting
- Daily cost summary
- Token usage trends
- Accuracy vs cost analysis

## 🔍 Test Data Requirements

### Test Image Categories
1. **High Quality Cards** (pristine condition, good lighting)
2. **Poor Quality Cards** (damaged, blurry, poor lighting)
3. **Edge Cases** (multiple cards, partial cards, non-Pokemon cards)
4. **Rare/Uncommon Sets** (not in CLIP database)

### Ground Truth Data
- Manual verification of card IDs
- Pokemon TCG API validation
- Community expert review (if needed)

## 🚨 Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement exponential backoff
- **Timeout Handling**: 10s timeout with retry logic
- **Malformed Responses**: JSON schema validation
- **Database Failures**: Transaction rollback on errors

### Cost Risks
- **Runaway Spending**: Hard budget caps
- **Token Explosion**: Input size limits (1024x1024 max)
- **Retry Loops**: Max 3 retries per request

### Quality Risks
- **Hallucinations**: Cross-validate with Pokemon TCG API
- **Bias**: Test across different card sets/eras
- **Edge Cases**: Comprehensive negative testing

## 📈 Success Validation

### Automated Tests
- Unit tests for each component
- Integration tests for full flow
- Performance tests for latency/cost
- Regression tests for accuracy

### Manual Validation
- Expert review of edge cases
- User acceptance testing
- Cost/benefit analysis vs alternatives

### Production Monitoring
- Real-time accuracy tracking
- Cost dashboard
- Error rate monitoring
- User satisfaction metrics

---

**Next Steps**: Start with Phase 1 prompt engineering using existing crop images in `worker/output/`. 