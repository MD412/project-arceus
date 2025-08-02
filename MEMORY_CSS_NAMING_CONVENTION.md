# CSS Naming Convention Best Practice

## Problem
Global CSS classes in `app/globals.css` conflict with component-specific CSS Modules, causing cascade issues when fine-tuning UI components.

## Solution: Component-Specific Naming Convention

### Rule: Prefix all component classes with the component name

**Before (conflicting):**
```css
/* dropzone.module.css */
.container {
  width: 100%;
}

.button {
  /* styles */
}
```

**After (specific):**
```css
/* dropzone.module.css */
.dropzoneWrapper {
  width: 100%;
}

.dropzoneButton {
  /* styles */
}
```

### Examples:
- **Dropzone component**: `dropzoneWrapper`, `dropzoneArea`, `dropzoneButton`
- **Button component**: `buttonPrimary`, `buttonSecondary`, `buttonIcon`
- **Card component**: `cardContainer`, `cardHeader`, `cardContent`

### Benefits:
1. **No global conflicts** - Component classes are unique
2. **Clear ownership** - Easy to see which component owns the styles
3. **Maintainable** - No need for `!important` or complex selectors
4. **Scalable** - Works across all components

### Implementation:
- Rename all component CSS classes with component prefix
- Update component JSX to use new class names
- No changes needed to global CSS

### Memory ID: CSS_NAMING_CONVENTION_2024 