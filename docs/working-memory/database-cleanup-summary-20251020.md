# 🧹 Database Cleanup Summary

**Date:** October 20, 2025  
**Status:** ⚠️ Manual execution required (migrations out of sync)

---

## ✅ What We Found

### **Audit Results:**

| Table Name | Status | Action |
|------------|--------|--------|
| `pipeline_review_items` | ❌ **LEGACY** | Safe to drop - old tile review system |
| `jobs` | ❌ **DUPLICATE?** | Safe to drop if exists (duplicate of `job_queue`) |
| `scan_uploads` | ✅ **ACTIVE VIEW** | DO NOT DROP - is a view pointing to `scans` |
| `user_card_instances` | ⚠️ **UNKNOWN** | Needs investigation before dropping |
| `binder_page_uploads` | ❌ **RENAMED** | Already gone - was renamed to `scan_uploads` then made into view |

---

## 📊 Code References Found

### **`scan_uploads` (VIEW - Keep It!)**
- **Worker:** 25 references - actively used for status updates
- **API Routes:** 36 references across multiple endpoints
- **Purpose:** Compatibility view over `scans` table
- **Migration:** Created in `20250806_fix_missing_tables.sql`

### **`pipeline_review_items` (DROP IT)**
- **Code refs:** 0 in active code
- **Migration refs:** Only in initial schemas (20250605)
- **Last used:** Never in production
- **Safe to drop:** ✅ Yes

### **`jobs` (DROP IT if exists)**
- **Code refs:** 0 in active code  
- **Migration refs:** `20250610192251_create_jobs_table_and_policies.sql`
- **Duplicate of:** `job_queue` table
- **Safe to drop:** ✅ Yes

### **`user_card_instances` (INVESTIGATE)**
- **Code refs:** 0 in active code
- **Migration:** `20250101000003_user_card_instances.sql`
- **Purpose:** Individual card tracking (might overlap with `user_cards`)
- **Safe to drop:** ⚠️ Unknown - needs manual verification

---

## 🔧 Manual Cleanup Steps

**Due to migration sync issues, execute this manually in Supabase Studio:**

```sql
-- Step 1: Check what actually exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('pipeline_review_items', 'jobs', 'user_card_instances')
ORDER BY table_name;

-- Step 2: Check row counts (if tables exist)
SELECT 
    (SELECT count(*) FROM pipeline_review_items) AS pipeline_review_items_count,
    (SELECT count(*) FROM user_card_instances) AS user_card_instances_count;
    
-- Step 3: Drop confirmed legacy tables
-- ⚠️ Only run this after confirming Step 1 shows they exist and Step 2 shows 0 rows!

DROP TABLE IF EXISTS public.pipeline_review_items CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Step 4: Verify cleanup
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## 📝 Migration File Created

**File:** `supabase/migrations/20251020000000_cleanup_legacy_tables.sql`

**Status:** ⚠️ Not applied yet (migrations out of sync with remote)

**Next steps:**
1. Pull latest migrations: `npx supabase db pull`
2. Repair migration history if needed
3. Then apply cleanup migration: `npx supabase db push`

---

## ✅ What's Actually Clean

Your database architecture is **actually quite good!** The perceived "mess" was mostly:

1. **Historical artifacts:** Tables that were renamed during refactoring
2. **Compatibility layers:** Views that maintain backward compatibility
3. **Failed migrations:** Duplicate migration files that never ran

**Real cleanup needed:** Just 1-2 tables (if they even exist in production)

---

## 🎯 Recommendation

**Option A (Safe):** Run the manual SQL in Supabase Studio (Steps 1-4 above)

**Option B (Complete):** 
1. First: `npx supabase db pull` to sync local migrations
2. Then: `npx supabase db push` to apply cleanup migration

**Option C (Skip It):** These tables take <1MB space. If not sure, leave them!

---

## 📚 For Documentation

Update `SYSTEM_MAP.md` to reflect:
- `scan_uploads` is a VIEW, not a table
- `pipeline_review_items` was removed (legacy system)
- Active tables: cards, scans, card_detections, user_cards, job_queue, card_embeddings, card_keys, worker_health

