# Japanese Card Support - Research & Implementation Plan

**Date:** October 20, 2025  
**Status:** Phase 1 - Manual Language Tagging

---

## 🔍 Research Findings

### **PokemonTCG.io API Structure**

**Key Findings:**
1. ✅ API DOES support Japanese cards
2. ❌ Local data only has English (`pokemon-tcg-data/cards/en/`)
3. ⚠️ API structure for JP cards needs verification (timeouts during research)

**Assumptions (to be verified later):**
- Japanese cards likely have DIFFERENT card IDs from English equivalents
- Example: `base1-4` (EN) vs. `jpbase1-4` or `sm6a-1` (JP)
- Set codes differ between regions
- Artwork may be identical or different

---

## 📋 Phase 1: Manual Language Tagging (Today)

### **Goal:** 
Allow users to manually tag cards as JP/EN without changing card metadata yet.

### **What We're Building:**

**1. Database Schema**
```sql
ALTER TABLE user_card_instances 
ADD COLUMN language TEXT DEFAULT 'en';

-- Index for language queries
CREATE INDEX idx_user_card_instances_language 
ON user_card_instances(language);
```

**2. API Endpoint**
```
PATCH /api/user-cards/[id]/language
Body: { "language": "jp" }
Response: Updated user_card_instance
```

**3. UI Components**

**Language Dropdown (CardDetailModal & CardCorrectionModal):**
- Compact dropdown with flag + code
- Options: 🇺🇸 EN | 🇯🇵 JP
- Saves to `user_card_instances.language`
- NO card metadata change yet (future phase)

**Display Formats:**
- **Grid View (TradingCard):** Small language code badge (e.g., "JP" in corner)
- **Table View (CollectionTable):** Flag emoji + code column (🇯🇵 JP)

---

## 🎨 UI Design Specifications

### **Language Dropdown Component**

```tsx
<LanguageSelect 
  value={cardInstance.language}
  onChange={handleLanguageChange}
  compact={true}
/>

// Renders:
// 🇺🇸 English
// 🇯🇵 日本語 (Japanese)
// 🇰🇷 한국어 (Korean) - future
// 🇨🇳 中文 (Chinese) - future
```

**Styling Notes:**
- Use native language names in dropdown
- Show flag + code in selected value
- Tooltip explains: "Card language/region"

### **Grid View Badge**
```tsx
<div className="card-language-badge">
  {language.toUpperCase()}
</div>

// Styles:
// - Small badge in top-right corner
// - Semi-transparent background
// - Only show if language !== 'en' (optional)
```

### **Table View Column**
```tsx
<TableCell>
  <span className="flag-emoji">{getFlag(language)}</span>
  <span className="language-code">{language.toUpperCase()}</span>
</TableCell>

// Example: 🇯🇵 JP
```

---

## 🔧 Implementation Checklist

### **Backend**
- [ ] Migration: Add `language` column to `user_card_instances`
- [ ] API: Create PATCH `/api/user-cards/[id]/language` endpoint
- [ ] Update collections query to SELECT language
- [ ] Add language to all instance SELECTs

### **Frontend**
- [ ] Create `LanguageSelect` component
- [ ] Add to CardDetailModal
- [ ] Add to CardCorrectionModal
- [ ] Show language code in TradingCard (grid)
- [ ] Show flag + code in CollectionTable
- [ ] Update TypeScript types for language field

### **Testing**
- [ ] Manual: Change language, verify persistence
- [ ] Manual: Check grid view shows badge
- [ ] Manual: Check table view shows flag
- [ ] Manual: Verify dropdown UI polish

---

## 🚀 Future Phases

### **Phase 2: Japanese Card Lookup (Later)**
- Download JP card data from pokemontcg.io
- Build mapping: EN card_id ↔ JP card_id
- When user changes language, look up equivalent card
- Update instance with JP card metadata

### **Phase 3: Japanese Embeddings (Later)**
- Build JP embeddings database
- Update worker to handle multi-language
- Add OCR language detection hint

### **Phase 4: Additional Languages (Later)**
- Korean (🇰🇷 KR)
- Traditional Chinese (🇹🇼 ZH-TW)  
- Simplified Chinese (🇨🇳 ZH-CN)
- French (🇫🇷 FR)
- German (🇩🇪 DE)
- Italian (🇮🇹 IT)
- Spanish (🇪🇸 ES)
- Portuguese (🇧🇷 PT)

---

## 📝 Notes

**Why Manual Tagging First?**
- Fast to implement (1-2 hours)
- Provides immediate value to users with JP cards
- Doesn't require complex API research/mapping
- Foundation for future phases

**API Research Needed:**
- Actual JP card ID format
- Set code differences
- How to map EN ↔ JP equivalents
- Artwork variations between regions

**UI Polish Focus:**
- User wants to fine-tune dropdown design
- Flag emojis must render correctly
- Compact design for modal space
- Clear visual language indicators

---

## 🎯 Success Criteria (Phase 1)

1. User can select language from dropdown in modals
2. Language persists to database
3. Grid view shows language code badge
4. Table view shows flag + language code
5. UI looks polished and intuitive

**Time Estimate:** 2-3 hours (including UI polish)




