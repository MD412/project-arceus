# CSS Debugging Protocol

**When user says "this CSS issue is difficult" or shows repeated failed attempts:**

## The Systematic Approach

1. **STOP guessing.** CSS issues that persist after 2-3 attempts need full system analysis.

2. **Map the ENTIRE hierarchy:**
   - Read all ancestor components (React/HTML)
   - Read ALL CSS files that could apply (inheritance, cascading)
   - Document the tree structure in your response
   - Include: element type, classes, relevant CSS properties

3. **Trace the constraint chain:**
   - For layout issues: check EVERY parent's display/flex/grid/height/width
   - For overflow: check EVERY ancestor's overflow/max-height/max-width
   - For positioning: check EVERY ancestor's position/z-index/transform
   - **Percentage values only work if parent has defined dimension**

4. **Look for cascade conflicts:**
   - Base styles → Component styles → Modifier classes
   - CSS modules vs global styles
   - Specificity wars (.class vs .parent .class vs .parent.modifier .class)
   - Inherited properties bubbling up

5. **Common CSS "gotchas" in this codebase:**
   - Flexbox: missing `min-height: 0` prevents shrinking
   - Percentages: need defined parent dimensions
   - `height: 100%` chains must be unbroken from root
   - Modal/Portal: may need `overflow: hidden` on ancestors
   - Tabs: TabsContent adds padding + forces `height: 100%` on children

6. **Document your analysis:**
   ```
   Structure:
   parent (props)
     └─ child (props)
         └─ target (props)
   
   Problem: [identify the break in the chain]
   Fix: [explain WHY this fixes it]
   ```

## The Key Insight

**CSS problems that seem "impossible" usually have ONE missing link in a constraint chain.** Don't patch symptoms - find the break, fix the chain.

---

**Use this when:**
- User says "think hard" / "this is difficult" / "very tricky"
- Same element misbehaves after multiple attempts
- User provides screenshots showing layout breaks
- Issue involves nested flex/grid containers or modals

**Success signal:** You can explain the fix in terms of "the constraint chain was broken at X"

