# Card Detail Modal - Testing Checklist

**Date:** October 17, 2025  
**Feature:** Tabbed modal with no-scroll design

---

## ✅ What Changed

### Layout
- ✅ Added tab navigation (Card, Scan, Market)
- ✅ Eliminated vertical scrolling in main view
- ✅ Fixed-height modal with proper overflow handling
- ✅ Flexbox-based layout for consistent spacing

### Components
- ✅ New `Tabs` component (reusable)
- ✅ Tab styling with active states
- ✅ Content organized into logical sections

---

## 🧪 Testing Checklist

### Desktop Testing

#### **Card Tab**
- [ ] Modal opens at correct size (80vw × 75vh, max 1200px × 800px)
- [ ] Card image displays fully (no clipping top/bottom)
- [ ] Image maintains aspect ratio
- [ ] Image fills available space appropriately
- [ ] Right panel shows collection details
- [ ] Quantity controls work (+/-)
- [ ] No vertical scrolling on main layout
- [ ] Details panel scrolls if content overflows

#### **Scan Tab** (if rawCropUrl exists)
- [ ] Tab only appears when scan data available
- [ ] Original scan crop displays centered
- [ ] Image scales appropriately
- [ ] Description text is readable
- [ ] No clipping or overflow issues

#### **Market Tab**
- [ ] Placeholder price displays ($24.99)
- [ ] "Coming soon" message shows
- [ ] Layout is clean and centered

#### **Tab Navigation**
- [ ] Tabs are clickable
- [ ] Active tab highlights in blue
- [ ] Hover states work
- [ ] Content switches instantly
- [ ] No layout shift when switching tabs

#### **Footer Actions**
- [ ] Quantity controls always visible
- [ ] "Replace Card" button works
- [ ] "Remove from Collection" button works
- [ ] Replace mode shows search input
- [ ] Cancel button exits replace mode

---

### Mobile Testing (< 768px)

#### **Responsive Layout**
- [ ] Modal fills screen (95vw × 90vh)
- [ ] Tabs stack properly
- [ ] Tab labels remain readable
- [ ] Content scrolls within tabs
- [ ] Footer actions stack vertically
- [ ] Touch targets are large enough

#### **Card Tab (Mobile)**
- [ ] Layout switches to vertical (column)
- [ ] Image appears at top (max 40vh)
- [ ] Details panel below image
- [ ] No horizontal overflow
- [ ] Pinch-to-zoom disabled on modal

---

### Edge Cases

#### **Various Card Types**
- [ ] Standard cards (portrait)
- [ ] Landscape cards (if any exist)
- [ ] Cards with missing images (fallback URL)
- [ ] Cards without scan data (no Scan tab)
- [ ] Extra tall card images

#### **Content Overflow**
- [ ] Long card names wrap properly
- [ ] Many collection details scroll smoothly
- [ ] Scan images larger than viewport scale down
- [ ] Market tab with future pricing charts

#### **Interactions**
- [ ] Opening modal doesn't cause page scroll
- [ ] Closing modal (X button) works
- [ ] Closing modal (backdrop click) works
- [ ] ESC key closes modal (if implemented)
- [ ] Tab state resets when reopening modal
- [ ] Quantity persists during tab switches

---

## 🐛 Known Issues (To Watch For)

### Potential Problems
- ⚠️ Tab content height might not fill on some browsers
- ⚠️ Scan images might overflow on very small screens
- ⚠️ Footer might overlap content if viewport is too short
- ⚠️ Replace mode search might conflict with tabs

### Browser Compatibility
- Test in Chrome (primary)
- Test in Firefox
- Test in Safari (flexbox quirks)
- Test in Edge

---

## 📸 Screenshots to Capture

1. **Card tab** - Main view with image + details
2. **Scan tab** - Original crop display
3. **Market tab** - Pricing placeholder
4. **Tab navigation** - Active state highlight
5. **Mobile view** - Vertical layout
6. **Replace mode** - Search input state

---

## ✨ Success Criteria

### Must Have
- ✅ No scrolling on main Card tab layout
- ✅ All content visible without clipping
- ✅ Tabs work smoothly
- ✅ Mobile responsive

### Nice to Have
- ✅ Smooth tab transitions
- ✅ Keyboard navigation
- ✅ Loading states
- ✅ Empty states

---

## 🔄 Next Steps After Testing

1. **If bugs found:**
   - Document specific issue
   - Note browser/device
   - Screenshot if visual
   - Fix and retest

2. **If all good:**
   - Update handoff document
   - Mark modal refactor as complete
   - Move to next priority feature

3. **Future enhancements:**
   - Add keyboard shortcuts (← → for tabs)
   - Add tab transition animations
   - Implement real pricing in Market tab
   - Add card text/abilities display

---

**Test Environment:**
- Dev server: `npm run dev`
- Test pages:
  - Main collection page: http://localhost:3000
  - Design system docs: http://localhost:3000/circuitds/modal

