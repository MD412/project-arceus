# 🚀 Normalized Card Ownership Architecture Deployment Plan

## Overview
This deployment migrates from the JSON blob approach to a proper normalized, multi-tenant card ownership architecture. This creates the foundation for collections, trading, deduplication, and price tracking.

## 📋 Pre-Deployment Checklist

### 1. Database Migration
```bash
# Run the migration in Supabase
psql -h db.xxx.supabase.co -U postgres -d postgres < supabase/migrations/20250101000001_normalized_card_ownership.sql
```

### 2. Verify Tables Created
Expected tables after migration:
- ✅ `cards` - Master card catalog
- ✅ `scans` - Upload events (replaces scan_uploads)
- ✅ `card_detections` - ML pipeline results
- ✅ `user_cards` - Individual card ownership records

### 3. Test Row Level Security
```sql
-- Should work (user sees own data)
SET session authorization 'user123';
SELECT * FROM scans WHERE user_id = 'user123';

-- Should be empty (user can't see others' data)  
SELECT * FROM scans WHERE user_id = 'other_user';
```

## 🔄 Deployment Steps

### Phase 1: Deploy New Architecture (Non-Breaking)
1. **Deploy Migration** - Creates new tables alongside existing ones
2. **Deploy New Worker** - `worker/normalized_worker.py` runs in parallel
3. **Update API Route** - Creates records in both old and new schemas
4. **Deploy Review Page** - `/scans/[id]/review` reads from new architecture

### Phase 2: Switch Traffic (Gradual)
1. **Test with Single Upload** - Verify end-to-end flow
2. **Monitor for Errors** - Check worker logs and database
3. **Switch Primary Worker** - Use normalized_worker.py instead of local_worker.py
4. **Update Frontend Queries** - Gradually migrate to new data structures

### Phase 3: Cleanup (After Validation)
1. **Remove Legacy Tables** - Drop scan_uploads, job_queue
2. **Remove Legacy Worker** - Delete local_worker.py
3. **Remove Legacy API Code** - Clean up route handlers

## 🧪 Testing Plan

### Test 1: End-to-End Upload Flow
```bash
# 1. Start new worker
python worker/normalized_worker.py

# 2. Upload via frontend
# Visit /upload and submit a binder image

# 3. Verify data creation
# Check that records appear in: scans, card_detections, user_cards

# 4. Visit review page
# Navigate to /scans/[id]/review and verify UI
```

### Test 2: Data Ownership & Security
```javascript
// Frontend test - user should only see their own scans
const { data } = await supabase.from('scans').select('*');
// Should only return current user's scans due to RLS

// Backend test - service role should see all data
const supabaseAdmin = createClient(url, serviceKey);
const { data } = await supabaseAdmin.from('scans').select('*');
// Should return all scans (bypasses RLS)
```

### Test 3: Card Enrichment & Deduplication
```python
# Worker test - verify card creation/finding
def test_find_or_create_card():
    enrichment = {
        "success": True,
        "card_name": "Charizard ex", 
        "set_name": "Scarlet & Violet"
    }
    
    # First call should create card
    card_id_1 = find_or_create_card(enrichment)
    
    # Second call should find existing card
    card_id_2 = find_or_create_card(enrichment) 
    
    assert card_id_1 == card_id_2  # Deduplication working
```

## 📊 Success Metrics

### Data Integrity
- ✅ All detected cards have corresponding user_cards records
- ✅ No orphaned detection or user_card records
- ✅ Card catalog grows without duplicates

### Performance
- ✅ Review page loads in < 2 seconds
- ✅ Worker processes 3x3 binder in < 30 seconds 
- ✅ Database queries use proper indexes

### User Experience
- ✅ Upload → Detection → Review flow works seamlessly
- ✅ Users can modify card conditions and see updates
- ✅ Card corrections persist and update collection

## 🚨 Rollback Plan

If issues occur during deployment:

### Immediate Rollback
```bash
# 1. Switch back to legacy worker
pkill -f normalized_worker.py
python worker/local_worker.py

# 2. Revert API route changes
git checkout HEAD~1 app/api/scans/route.ts
npm run build && npm run deploy

# 3. Hide review page (frontend only)
# Remove review page links from UI
```

### Data Recovery
```sql
-- If data corruption occurs, legacy tables still exist
-- Can restore from scan_uploads.results JSON blobs
SELECT id, results FROM scan_uploads WHERE processing_status = 'completed';
```

## 🎯 Post-Deployment Tasks

### Week 1: Monitoring
- Monitor error rates in worker logs
- Check RLS policy effectiveness
- Validate user card ownership accuracy

### Week 2: Feature Enhancement  
- Add real LLM enrichment (replace mock_enrich_card)
- Implement card correction UI
- Add bulk collection operations

### Week 3: Legacy Cleanup
- Archive old scan_uploads data
- Remove legacy worker and job_queue
- Optimize database indexes based on usage

## 🔑 Key Benefits Unlocked

After this deployment:

### ✅ **Proper Multi-Tenancy**
- Each card instance belongs to a specific user
- RLS policies ensure data security
- Ready for multiple users without data leakage

### ✅ **Collection Foundation**
- Users can track condition, quantity, value
- Deduplication across multiple scans
- Historical tracking of acquisitions

### ✅ **Trading & Marketplace Ready**
- Individual card UUIDs for trading references
- Condition and value tracking per card
- Clean ownership transfer mechanisms

### ✅ **Analytics & Insights**
- Collection value tracking over time
- Set completion statistics
- Rarity distribution analysis

This migration transforms Project Arceus from a simple detection tool into a comprehensive card collection management platform. 🎉 