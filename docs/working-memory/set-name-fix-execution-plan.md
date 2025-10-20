# Set Name Fix - Complete Execution Plan

**Date:** October 20, 2025  
**Status:** Ready to execute  
**Est. Time:** 5-10 minutes

---

## 📋 What We're Fixing

**Problem:** UI shows serialized set codes (swsh12, sv8pt5) instead of readable names (Silver Tempest, Surging Sparks)

**Root Cause:** 
1. `card_embeddings` doesn't have `set_name` column
2. Cards created from embeddings inherit NULL `set_name`
3. `build_card_embeddings.py` never extracted `set.name` from API

---

## ✅ Code Changes (Already Complete)

### **Frontend** 
- ✅ CardDetailModal.tsx - Shows set_name in header + scan tab
- ✅ CollectionTable.tsx - Shows set_name in Set column
- ✅ CardCorrectionModal.tsx - Shows set_name in header
- ✅ TradingCard.tsx - Shows set_name in card meta
- ✅ DraggableCardGrid.tsx - Passes set_name to all cards

### **Backend**
- ✅ worker/worker.py - Selects + inserts set_name when creating cards
- ✅ app/api/scans/[id]/approve/route.ts - Selects + inserts set_name
- ✅ app/api/collections/route.ts - Already selects set_name (was there)

### **Data Pipeline**
- ✅ scripts/build_card_embeddings.py - Now extracts `card.set.name` from JSON

---

## 🔧 Manual Execution Required

### **Step 1: Run SQL Script** (3 min)

**File:** `scripts/complete-set-name-fix.sql`

**What it does:**
1. Adds `set_name` column to `card_embeddings`
2. Creates mapping function (set_code → set_name)
3. Backfills `card_embeddings` with set names
4. Backfills `cards` with set names
5. Shows verification results

**How to run:**
1. Open Supabase Studio → SQL Editor
2. Copy contents of `scripts/complete-set-name-fix.sql`
3. Paste and click "Run"
4. Check output shows successful updates

**Expected output:**
```
✅ card_embeddings: X rows updated
✅ cards: Y rows updated  
✅ Sample rows show set names populated
```

---

### **Step 2: Verify in UI** (30 sec)

1. Refresh http://localhost:3000
2. Check collection page
3. Verify all cards show readable set names:
   - ❌ Before: "SWSH12", "SV8PT5", "SWSHP"
   - ✅ After: "Silver Tempest", "Surging Sparks: Blooming Evolutions", "SWSH Black Star Promos"

---

## 🔄 Future Behavior

### **For Existing Cards (After SQL Backfill)**
- ✅ All cards in `cards` table have set_name
- ✅ All embeddings in `card_embeddings` have set_name

### **For New Cards (After Code Updates)**

**Scenario A: New embeddings created**
- `build_card_embeddings.py` runs
- Extracts `card.set.name` from source JSON
- Stores in `card_embeddings.set_name`

**Scenario B: Worker creates card from embedding**
- Selects `set_name` from `card_embeddings`
- Inserts into `cards.set_name`
- ✅ Set name displays in UI immediately

**Scenario C: Approval creates card from embedding**
- Same as Scenario B
- ✅ Set name displays in UI immediately

---

## 🚨 Edge Cases Handled

### **Unknown Set Codes**
- SQL function uses `ELSE code` as fallback
- Will show set code if not in mapping (better than blank)

### **NULL set_code**
- Won't update (WHERE condition filters these out)
- Frontend handles gracefully (already does)

### **Future Set Releases**
- Add to SQL function mapping in `complete-set-name-fix.sql`
- OR re-run `build_card_embeddings.py` to get fresh data from API

---

## 📁 Files Modified

### **Code (Committed Today)**
1. `components/ui/CardDetailModal.tsx` - L126, L222
2. `components/ui/CollectionTable.tsx` - L149
3. `components/ui/CardCorrectionModal.tsx` - L48, L84
4. `components/ui/TradingCard.tsx` - L19-20, L102
5. `components/ui/DraggableCardGrid.tsx` - L128, L210, L304
6. `worker/worker.py` - L195, L209
7. `app/api/scans/[id]/approve/route.ts` - L88, L94
8. `scripts/build_card_embeddings.py` - L102

### **SQL Scripts (Run Manually)**
1. `scripts/complete-set-name-fix.sql` - Complete backfill script
2. `supabase/migrations/20251020000001_add_set_name_to_embeddings.sql` - Schema migration

---

## 🎯 Success Criteria

**After execution:**
- ✅ `card_embeddings.set_name` column exists
- ✅ All embeddings with set_code have set_name populated
- ✅ All cards with set_code have set_name populated
- ✅ UI shows "Silver Tempest" instead of "swsh12"
- ✅ Future cards automatically get set_name

---

## 🔍 Verification Queries

Run these after SQL execution to verify:

```sql
-- Check card_embeddings coverage
SELECT 
  COUNT(*) FILTER (WHERE set_name IS NOT NULL) AS has_name,
  COUNT(*) FILTER (WHERE set_name IS NULL AND set_code IS NOT NULL) AS missing_name,
  COUNT(*) AS total
FROM card_embeddings;

-- Check cards coverage
SELECT 
  COUNT(*) FILTER (WHERE set_name IS NOT NULL) AS has_name,
  COUNT(*) FILTER (WHERE set_name IS NULL AND set_code IS NOT NULL) AS missing_name,
  COUNT(*) AS total
FROM cards;

-- Show random samples
SELECT card_id, set_code, set_name FROM card_embeddings WHERE set_name IS NOT NULL LIMIT 10;
SELECT name, set_code, set_name FROM cards WHERE set_name IS NOT NULL LIMIT 10;
```

---

## 📊 Execution Status

- [x] Code updates complete
- [ ] SQL script execution (manual - user runs in Supabase Studio)
- [ ] UI verification

**Next:** Run `scripts/complete-set-name-fix.sql` in Supabase Studio


