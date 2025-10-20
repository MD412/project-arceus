# Context Handoff - October 21, 2025 @ 12:00 AM

**Branch:** `main`  
**Status:** ⚠️ Language support in progress - search UX needs redesign

---

## 🎯 Session Accomplishments

### 1. Set Name Display ✅ SHIPPED
- Fixed all cards showing cryptic codes (swsh12 → Silver Tempest)
- 38,822 rows backfilled with human-readable names
- 8 files updated across full stack
- **Impact:** Major UX improvement - users see readable set names everywhere

### 2. Database Cleanup ✅ SHIPPED
- Dropped legacy tables (pipeline_review_items, jobs)
- Synced migration history (48 migrations)
- Documented table architecture
- **Impact:** Cleaner database, better understanding of backend

### 3. Language Support Research 🔄 IN PROGRESS
- Researched multi-language card architecture
- Created implementation plan (3 phases)
- Started building foundation
- **Discovered critical UX issue:** Search doesn't filter by language

---

## 🚨 Critical UX Discovery: Japanese Card Search Problem

### **The Problem**
User scans Japanese Zeraora VSTAR → Opens "Replace Card" → Searches "Zeraora VSTAR" → Only sees English version

**Why This Matters:**
- Same card exists in EN and JP with different card IDs
- Current search shows all results regardless of language
- User can't find the correct JP version
- This breaks the correction flow for Japanese cards

### **Solution Needed**
Redesign CardSearchInput to include language filtering:
- Add language toggle (🇺🇸 EN | 🇯🇵 JP | All)
- Filter search results by selected language
- Show flag badges in search results
- Default to card's current language

**Priority:** HIGH - blocks JP card support

---

## 📁 Files Modified

### Language Support (Partial Implementation)
- `app/api/user-cards/[id]/language/route.ts` - NEW (language update endpoint)
- `app/api/collections/route.ts` - Query user_cards (fixed table name)
- `components/ui/CardDetailModal.tsx` - Language handler (not wired yet)
- `components/ui/DraggableCardGrid.tsx` - Language prop passing
- `lib/languages.ts` - NEW (language utilities, 10 languages)

### Set Name Feature (Complete)
- `worker/worker.py` - Extract set_name from embeddings
- `app/api/scans/[id]/approve/route.ts` - Propagate set_name
- `scripts/build_card_embeddings.py` - Capture set.name from source
- 5 frontend components updated

### Migrations
- `20251020000002_add_language_to_user_card_instances.sql`
- `20251020000003_add_language_to_user_cards.sql`

**Note:** LanguageSelect components were deleted (user rethinking approach)

---

## 🐛 Known Issues

### 1. Language Dropdown Not Functional
**Status:** Code written but not wired to page component  
**Impact:** Can't actually change card language yet  
**Fix:** Wire `onLanguageChange` handler in parent page component

### 2. Search Doesn't Filter by Language
**Status:** Critical blocker for JP card support  
**Impact:** Users can't find Japanese cards in search  
**Fix:** Redesign CardSearchInput with language filter UI  
**Priority:** HIGH

### 3. LanguageSelect Component Deleted
**Status:** User removed components during design rethink  
**Impact:** Need to rebuild or redesign approach  
**Next:** Discuss preferred UI pattern

---

## 🔍 What's Next

### Immediate (Next Session - 1-2 hours)

**1. Redesign Search with Language Filter**
- Add language toggle to CardSearchInput
- Filter API results by language
- Show flags in search results
- Default to current card's language

**2. Complete Language Handler Wiring**
- Add handler to page component
- Test language change persistence
- Verify badge/flag display

**3. UI Design Review**
- Review language filter UX
- Polish dropdown/toggle styling
- Get user approval on design

### Short-term (This Week)

**4. Japanese Card Database**
- Research pokemontcg.io JP card structure
- Download JP card data
- Build JP embeddings
- Map EN ↔ JP equivalents

**5. CardCorrectionModal Integration**
- Add language selector to correction flow
- Allow language selection during scan review

### Medium-term (Later)

**6. OCR Language Detection**
- Detect Japanese text in scans
- Auto-suggest correct language
- Provide one-click toggle

---

## 📊 Architecture Decisions Made

### Language Storage Strategy
**Decision:** Store language at instance level (user_cards), not card definition  
**Rationale:**  
- Same card (EN Pikachu) can appear in multiple languages in one collection
- User has 2 EN copies + 1 JP copy = 3 separate instances
- Each instance has its own language tag

### Search Filter Approach
**Decision:** Explicit language filter (not auto-detection yet)  
**Rationale:**
- Phase 1: Manual control (user selects before search)
- Phase 2: Auto-detect from scan context
- Phase 3: OCR-based smart suggestions

### UI Display Pattern
**Proposed:**
- Grid view: Language badge overlay (only if not EN)
- Table view: Flag emoji + code column
- Search: Language toggle above search box
- Results: Flag badge prefix

---

## 🎓 Technical Learnings

### Table Structure Clarity
Confirmed active tables:
- ✅ `user_cards` - ACTIVE (current collection data)
- ❌ `user_card_instances` - LEGACY (created but unused)

**Action Required:** Audit and potentially drop `user_card_instances`

### API vs Embeddings
- pokemontcg.io DOES support Japanese cards
- JP cards have different card IDs from EN equivalents
- Need to build separate JP embeddings database
- Can't rely on visual matching alone (same artwork, different text)

---

## 🔧 Code Status

### ✅ Working
- Set name display (100%)
- Database structure (language columns exist)
- Language utilities library
- API endpoint structure

### ⚠️ Needs Work
- Language dropdown handler wiring
- Search language filtering
- LanguageSelect component (deleted, needs redesign)

### 📝 Not Started
- JP card data download
- JP embeddings build
- EN ↔ JP card mapping
- OCR language detection

---

## 📖 Quick Reference

### Search Language Filter Implementation
```tsx
// CardSearchInput.tsx - Add language state
const [searchLanguage, setSearchLanguage] = useState<'en' | 'jp' | 'all'>('all');

// Filter results
const filteredResults = results.filter(card => 
  searchLanguage === 'all' || card.language === searchLanguage
);
```

### Language Display Utilities
```tsx
// lib/languages.ts
formatLanguageDisplay('jp', 'flag-code') // → "🇯🇵 JP"
getFlag('jp') // → "🇯🇵"
```

---

## 🚀 Session Stats

- **Duration:** ~5 hours
- **Features Shipped:** 2 (set names, DB cleanup)
- **Features Started:** 1 (language support)
- **Files Modified:** 26
- **Files Created:** 26 (some deleted for redesign)
- **Commits:** 2
- **Database Rows Updated:** 38,822+
- **Lines of Code:** ~1,500+

---

## 🎯 Success Criteria (Next Session)

**Must Have:**
1. Search filters by language
2. JP cards findable in search results
3. Language change persists to database

**Nice to Have:**
4. Language badge displays in grid
5. Flag displays in table
6. Auto-detect language from scan context

---

**Status:** Foundation laid, search redesign needed for full JP support 🇯🇵

