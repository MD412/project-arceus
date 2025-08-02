# Component File Pattern Best Practice

## Problem
Mixing component exports and page exports in the same file creates runtime conflicts and errors.

## Solution: Separate Component Files (Option A)

### File Structure:
```
app/(circuitds)/circuitds/components/component-name/
├── ComponentName.tsx    # Pure component only
├── page.tsx             # Documentation page only  
└── component-name.module.css # Styles
```

### Rules:
1. **Component files** = Only component logic and exports
2. **Page files** = Only documentation/demo and imports
3. **CSS files** = Only styles for the component

### Examples:
**Component file (`Dropzone.tsx`):**
```tsx
export function Dropzone({ ... }) {
  // Component logic only
}
```

**Page file (`page.tsx`):**
```tsx
import { Dropzone } from './Dropzone';

export default function DropzonePage() {
  // Documentation/demo only
  return <Dropzone {...props} />;
}
```

### Benefits:
1. **No runtime conflicts** - Clear separation of concerns
2. **Reusable components** - Can import from anywhere
3. **Clean documentation** - Demo pages are separate
4. **Maintainable** - Easy to find and modify

### Memory ID: COMPONENT_FILE_PATTERN_2024 