# Manual Test Protocol: Scan Tab UX Redesign

**Date:** October 20, 2025  
**Feature:** Card Detail Modal - Scan Tab Side-by-Side Layout  
**Priority:** High

---

## 🎯 What Changed

### Old UX
- **Card tab:** Had replace functionality in right column
- **Scan tab:** Just centered scan image
- **Footer:** Replace button

### New UX
- **Scan tab:** 2-column side-by-side comparison
  - **Left:** Original scan crop
  - **Right:** "AI Identified As" panel with card preview + Replace button
- **Card tab:** Simplified to collection details only
- **Footer:** Only "Remove from Collection" button

---

## ✅ Manual Testing Checklist

### Desktop Testing (>768px)

#### 1. Open Card Detail Modal
- [ ] Navigate to http://localhost:3000
- [ ] Click any card in your collection
- [ ] Modal opens successfully

#### 2. Verify Card Tab (Default)
- [ ] Card tab is active by default
- [ ] Shows card details (name, number, set, etc.)
- [ ] No replace functionality visible
- [ ] Clean, focused layout

#### 3. Verify Scan Tab - Side-by-Side Layout
- [ ] Click "Scan" tab
- [ ] **Left column:** Original scan crop visible
- [ ] **Right column:** "AI Identified As" heading visible
- [ ] **Right column:** Identified card preview shows correct card image
- [ ] **Right column:** Card name and metadata (#{number} • {setCode}) visible
- [ ] **Right column:** "Replace Card" button visible
- [ ] Both columns displayed **side-by-side** (not stacked)
- [ ] Scan image **contained within modal** (no vertical overflow)
- [ ] Gap between columns (var(--sds-size-space-600) = 24px)

#### 4. Test Replace Card Flow
- [ ] Click "Replace Card" button
- [ ] Right column switches to replace mode
- [ ] "Search for Correct Card" heading visible
- [ ] Search input appears and is focused
- [ ] "Cancel" button visible
- [ ] Left column (scan crop) remains visible
- [ ] Click "Cancel"
- [ ] Returns to "AI Identified As" panel
- [ ] **Optional:** Type card name, select from results, verify replacement works

#### 5. Verify Image Containment
- [ ] Scan image does not overflow modal height
- [ ] Identified card preview sized appropriately (max-width: 200px)
- [ ] No horizontal scrolling required
- [ ] Images properly centered in their containers

#### 6. Verify Footer
- [ ] Footer shows only "Remove from Collection" button
- [ ] No quantity controls
- [ ] No additional replace button

---

### Mobile Testing (<768px)

Use browser DevTools responsive mode or physical device:

#### 7. Mobile: Modal Sizing
- [ ] Set viewport to 375x667 (iPhone SE) or similar
- [ ] Modal width: 95vw
- [ ] Modal height: 90vh
- [ ] No content cut off

#### 8. Mobile: Scan Tab Stacked Layout
- [ ] Click "Scan" tab
- [ ] **Layout stacks vertically** (not side-by-side)
- [ ] Scan crop appears **on top**
- [ ] "AI Identified As" panel appears **below**
- [ ] Gap between sections (var(--sds-size-space-400) = 16px)
- [ ] Scan image max-height: 50vh (doesn't dominate screen)
- [ ] Identified preview max-width: 150px (smaller on mobile)

#### 9. Mobile: Replace Flow
- [ ] Click "Replace Card"
- [ ] Search input still functional
- [ ] Can scroll to see all content
- [ ] Cancel button accessible

---

### Edge Cases

#### 10. Cards Without Scan Data
- [ ] Find a card added manually (no rawCropUrl)
- [ ] Open card detail modal
- [ ] **Scan tab should not appear** (conditional render)
- [ ] Only Card and Market tabs visible

#### 11. Long Card Names
- [ ] Find card with very long name
- [ ] Open Scan tab
- [ ] Card name wraps properly in identified preview
- [ ] Doesn't break layout

#### 12. Card Correction Modal Isolation
- [ ] Go to /scans/review (scan review flow)
- [ ] Open a detection needing correction
- [ ] Verify card-correction-modal still has proper padding
- [ ] Layout not affected by card-detail-modal changes

---

## 🐛 Known Issues / What to Watch For

1. **Image overflow:** If scan image overflows modal, check:
   - `.card-detail-modal__scan-view .card-detail-modal__section` has `flex: 1; min-height: 0`
   - All parents in flexbox chain have defined height

2. **Missing Scan tab:** If Scan tab doesn't appear:
   - Verify card has `rawCropUrl` property
   - Check conditional render: `{displayCard.rawCropUrl && <TabsContent value="scan">}`

3. **Layout breaking on mobile:** Verify media query at line 353 is active

---

## 📸 Visual Reference

### Expected Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│  CARD DETAIL                                        ✕   │
├─────────────────────────────────────────────────────────┤
│  [Card] [Scan] [Market]                                │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │                     │  │  AI IDENTIFIED AS       │  │
│  │   Original Scan     │  │                         │  │
│  │   Crop Image        │  │  ┌───────────────┐     │  │
│  │                     │  │  │ Card Preview  │     │  │
│  │                     │  │  │               │     │  │
│  │                     │  │  └───────────────┘     │  │
│  │                     │  │  Card Name              │  │
│  │                     │  │  #123 • BASE1           │  │
│  └─────────────────────┘  │                         │  │
│                            │  ┌─────────────────┐   │  │
│                            │  │ Replace Card    │   │  │
│                            │  └─────────────────┘   │  │
│                            └─────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  [Remove from Collection]                               │
└─────────────────────────────────────────────────────────┘
```

### Expected Mobile Layout (Stacked)

```
┌─────────────────────────┐
│  CARD DETAIL        ✕   │
├─────────────────────────┤
│  [Card][Scan][Market]   │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │                   │  │
│  │  Original Scan    │  │
│  │  Crop Image       │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  AI IDENTIFIED AS       │
│  ┌─────────────┐        │
│  │  Preview    │        │
│  └─────────────┘        │
│  Card Name              │
│  #123 • BASE1           │
│                         │
│  ┌─────────────────┐    │
│  │  Replace Card   │    │
│  └─────────────────┘    │
├─────────────────────────┤
│  [Remove from Coll...]  │
└─────────────────────────┘
```

---

## ✅ Test Result Summary

**Tester:**  
**Date:**  
**Result:** ☐ Pass / ☐ Fail  

**Issues Found:**

1. 
2. 
3. 

**Notes:**


---

## 📁 Files Involved

- **Component:** `components/ui/CardDetailModal.tsx` (lines 177-238)
- **CSS:** `app/styles/card-detail-modal.css` (lines 3-235, 353-402)
- **Related:** `app/styles/card-correction-modal.css` (isolation verification)

---

**Next Steps After Testing:**
- [ ] Mark todos complete
- [ ] Document any bugs found
- [ ] Commit all changes with session summary [[memory:3951949]]

