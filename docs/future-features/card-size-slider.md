# Card Size Slider - Future Feature

**Status:** Disabled (2025-10-16)  
**Location:** Collection page (`app/(app)/page.tsx`)

## Overview

A floating UI control that allows users to dynamically adjust the size of card thumbnails in grid view. The slider provides continuous control from 120px to 300px, with the preference persisted to localStorage.

## Implementation Details

### State Management
- `cardSize` state: Stores current card size (default: 200px)
- Persisted to localStorage on change
- Loaded from localStorage on mount

### UI Component
- Floating glassmorphism card in bottom-right corner
- Only visible in grid view mode when cards exist
- Range input: 120px - 300px (step: 20px)
- Live size indicator showing current pixel value

### Grid Integration
- CSS variable `--card-min-width` set on `.collection-page`
- Grid uses `repeat(auto-fill, minmax(var(--card-min-width), 1fr))`
- Replaces fixed breakpoint-based column counts with dynamic sizing

## Why Disabled

Needs fine-tuning before production:
- Original responsive breakpoints were carefully tuned for specific viewport sizes
- Dynamic sizing may need min/max constraints per viewport
- Edge cases to handle (very small/large screens)
- UX polish needed (animations, presets vs continuous)

## To Re-enable

### 1. Uncomment state in `app/(app)/page.tsx`
```tsx
const [cardSize, setCardSize] = useState<number>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cardSize');
    return saved ? parseInt(saved, 10) : 200;
  }
  return 200;
});

useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cardSize', cardSize.toString());
  }
}, [cardSize]);
```

### 2. Uncomment slider UI (before Modal)
```tsx
{filters.viewMode === 'grid' && (localCards?.length ?? 0) > 0 && (
  <div className="card-size-slider">
    <label htmlFor="card-size-range">Card Size</label>
    <input
      id="card-size-range"
      type="range"
      min="120"
      max="300"
      step="20"
      value={cardSize}
      onChange={(e) => setCardSize(parseInt(e.target.value, 10))}
    />
    <span className="size-label">{cardSize}px</span>
  </div>
)}
```

### 3. Add CSS variable to `.collection-page`
```css
.collection-page {
  /* ... existing styles ... */
  --card-min-width: ${cardSize}px;
}
```

### 4. Update grid CSS in `app/styles/trading-card.css`
Replace breakpoint-based columns with:
```css
.card-grid {
  display: grid;
  gap: var(--sds-size-space-400);
  grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width, 200px), 1fr));
  grid-auto-rows: auto;
  padding: 0 12px;
}
```

## Improvements for Future

1. **Preset Sizes**: Consider 3-4 fixed presets (Small/Medium/Large/XL) instead of continuous
2. **Smart Constraints**: Adjust min/max per viewport breakpoint
3. **Animation**: Smooth transitions when size changes
4. **Accessibility**: Keyboard shortcuts, ARIA labels
5. **Visual Feedback**: Show column count preview as you drag
6. **Mobile UX**: Consider different placement or hiding on mobile
7. **Persist per-device**: Maybe use different sizes for mobile vs desktop

## Files Modified

- `app/(app)/page.tsx` - Component logic and UI
- `app/styles/trading-card.css` - Grid styles (CSS commented inline)
- Slider styles are preserved in page.tsx `<style jsx>` block

## Original Author Notes

> "I did a lot of math resizing calcs to get it just right tho"

The original grid breakpoints were carefully tuned. Dynamic sizing is fun but needs refinement to match the polish of the fixed breakpoints.



