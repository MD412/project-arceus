# CircuitDS: Developer & Contributor Guide

This document provides essential information for developers and contributors working on the CircuitDS design system within Project Arceus.

## 1. Project Overview & Philosophy

CircuitDS is the dedicated design system for Project Arceus. Its primary goal is to provide a consistent, reusable, and well-documented set of UI components, styling guidelines, and interaction patterns.

**Core Philosophy:**
- **Source of Truth:** CircuitDS is the definitive source for all UI elements and their usage. Components and styles defined here should be consistently applied throughout the main application.
- **Consistency:** Adherence to defined design tokens (colors, spacing, typography, etc.) and layout components is crucial for visual and experiential consistency.
- **Modularity & Reusability:** Components are designed to be modular and reusable across different parts of the application.
- **Accessibility:** Components and patterns should be designed and implemented with accessibility (WCAG AA) as a primary consideration.

## 2. Directory Structure & Key Files

The design system documentation and core files are primarily located within the `app/(circuitds)/circuitds/` directory. The `(circuitds)` part is a Next.js route group, used for organizing routes and potentially applying a specific layout to the design system pages, separate from the main application.

**Key Locations:**

- **`app/(circuitds)/circuitds/`**: Root directory for the design system's documentation pages.
    - **`layout.tsx`**: Defines the main layout for all CircuitDS documentation pages. This includes the sidebar navigation (`AppNavigation`) and the main content area where individual page content is rendered.
    - **`page.tsx`**: The entry page for the `/circuitds` route (the design system homepage).
    - **`[topic_or_component_group]/page.tsx`**: Standard pattern for documentation pages. For example:
        - `colors/page.tsx`
        - `buttons/page.tsx`
        - `nesting-containers/page.tsx`

- **`components/`** (Located at the project root, e.g., `project-arceus/components/`):
    - **`layout/`**: Contains components used for structuring the documentation pages themselves.
        - `PageLayout.tsx`: Wraps the entire content of a documentation page, providing the main title and description.
        - `ContentSection.tsx`: Groups related content or examples under a common heading within a page. Styled as distinct bordered sections with consistent internal spacing (using `gap`).
        - `ExampleShowcase.tsx`: Displays individual examples, typically including a title, description, a live preview, and a code snippet.
    - **`ui/`**: Contains the actual UI components of the design system.
        - `AppNavigation.tsx`: The component used for sidebar navigation (used in CircuitDS layout and documented on the `menusidebar` page).
        - `Button.tsx`: An example of a core UI component.
        - *(New UI components should be added here.)*

- **Stylesheets:**
    - **`app/styles/circuit.css`**: The primary stylesheet for CircuitDS. Defines global styles, all design tokens (CSS custom properties for color, spacing, typography, radii, etc.), and base theming for the design system pages.
    - **`app/styles/globals.css`**: The global stylesheet for the entire application, which imports `circuit.css` among others.
    - **`components/ui/AppNavigation.css`**: Styles specific to the `AppNavigation` component's internal structure and default appearance.
    - **`app/styles/[layout_component_name].css`**: Styles for the documentation layout components, e.g.:
        - `app/styles/page-layout.css`
        - `app/styles/content-section.css`
        - `app/styles/example-showcase.css`
    - **Component-Specific Styles**: For UI components in `components/ui/`, their styles are typically co-located (e.g., `components/ui/Button.css`) or managed in a more general UI component stylesheet if preferred.
    - **`app/styles/circuitds-layout.css`**: Styles specific to the overall layout of the CircuitDS section (e.g., `.circuitds-sidebar`, `.circuitds-main-content`).

## 3. Core Layout Components for Documentation

The documentation pages within CircuitDS are built using a consistent set of layout components found in `components/layout/`:

- **`PageLayout`**: The outermost wrapper for a page's content. Handles the page title and introductory description.
- **`ContentSection`**: Used to divide a page into logical sections, each with a title. It provides consistent padding, borders, and background, and uses `flexbox` with `gap` to space its direct children evenly (e.g., paragraphs, `ExampleShowcase` components).
- **`ExampleShowcase`**: Used to display individual component examples or code snippets. It typically includes a title, description, a preview area, and a formatted code block.

Refer to the "Nesting Containers Guide" (`/circuitds/nesting-containers`) for detailed visual examples and code structure of how these components are used together.

## 4. Design Token Philosophy

All styling within CircuitDS (and by extension, the main application) should leverage the design tokens defined as CSS custom properties in `app/styles/circuit.css`.

- **Categories:** Tokens are provided for colors, spacing, typography (font families, sizes, weights, line heights), border radii, etc.
- **Naming Convention:** Tokens typically follow a pattern like `--sds-[category]-[value]` (e.g., `--sds-size-space-400`, `--sds-color-primary-500`) or semantic names for theme colors (e.g., `--background`, `--text-primary`, `--surface-background`).
- **Usage:** Always prefer using a token over hardcoded values to ensure consistency and ease of theming or future updates.

## 5. Semantic Structure & Accessibility

- **HTML Semantics:** Use appropriate HTML5 elements (`<article>`, `<section>`, `<nav>`, `<main>`, headings, etc.) to structure content logically. This is crucial for SEO and accessibility.
- **Heading Hierarchy:** Maintain a correct and sequential heading hierarchy (H1, H2, H3, etc.) on all pages. The `PageLayout` component typically provides the H1.
- **ARIA Attributes:** Ensure components like `AppNavigation` use appropriate ARIA attributes for roles, states, and properties where necessary.
- **Keyboard Navigation & Focus:** All interactive elements must be keyboard navigable with clearly visible focus states.
- **Color Contrast:** Adhere to WCAG AA color contrast guidelines.

## 6. Working with CircuitDS

### Adding a New Documentation Page (e.g., for a new guideline or component group)

1.  **Create Directory:** Add a new directory under `app/(circuitds)/circuitds/your-new-topic`.
2.  **Create `page.tsx`:** Inside this new directory, create a `page.tsx` file.
3.  **Structure Content:** Use `<PageLayout>`, `<ContentSection>`, and `<ExampleShowcase>` to build the page content. Define any code examples as string constants at the top of the file if they are complex.
4.  **Add to Navigation:** Update `app/(circuitds)/circuitds/layout.tsx` by adding a new `NavigationConfigItem` to the `circuitDSNavItems` array to include your new page in the sidebar.

### Defining and Documenting a New UI Component (e.g., Card, Modal)

1.  **Component Creation:**
    - Place the new component's source code in `components/ui/YourNewComponent.tsx`.
    - Style it using CSS custom properties (design tokens). Co-locate its styles in `components/ui/YourNewComponent.css` or add to a shared UI stylesheet.
2.  **Documentation Page:**
    - Create a new documentation page for it under `app/(circuitds)/circuitds/components/your-new-component/page.tsx` (or an appropriate category).
    - Document its purpose, props, variants, usage examples (using `ExampleShowcase`), and any specific implementation or accessibility notes.
    - Add it to the navigation in `app/(circuitds)/circuitds/layout.tsx`.

### Modifying Existing Components or Styles

- When modifying existing UI components or their styles, ensure changes are reflected in their documentation within CircuitDS.
- If changing design tokens in `app/styles/circuit.css`, be mindful of their global impact and update relevant documentation (e.g., the "Colors" or "Spacing" pages).

---
*This guide helps ensure consistency and a smooth development experience when working with CircuitDS. Please keep it updated as the design system evolves.*

---

## AI Data Section (For Automated Processing)

This section provides a structured summary of key information for AI agents and automated tools working with CircuitDS.

### 1. Key Files & Directories:

- **`app/(circuitds)/circuitds/`**: Root directory for CircuitDS documentation pages.
    - **`layout.tsx`**: Main layout for all CircuitDS documentation pages (sidebar navigation, main content area).
    - **`page.tsx`**: Entry page for the `/circuitds` route (design system homepage).
    - **`[topic_or_component_group]/page.tsx`**: Standard pattern for documentation pages (e.g., `colors/page.tsx`).
- **`components/`** (Project root):
    - **`layout/`**: Contains components for structuring documentation pages.
        - `PageLayout.tsx`: Outermost wrapper for page content (title, description).
        - `ContentSection.tsx`: Groups related content/examples with a heading.
        - `ExampleShowcase.tsx`: Displays individual examples (preview, code).
    - **`ui/`**: Contains the actual UI components of the design system.
        - `AppNavigation.tsx`: Sidebar navigation component.
        - `Button.tsx`: Example of a core UI component.
- **Stylesheets:**
    - **`app/styles/circuit.css`**: Primary stylesheet for CircuitDS. Defines global styles, all design tokens (CSS custom properties), and base theming.
    - **`app/styles/globals.css`**: Global stylesheet for the entire application, imports `circuit.css`.
    - **`components/ui/AppNavigation.css`**: Styles for the `AppNavigation` component.
    - **`app/styles/[layout_component_name].css`**: Styles for documentation layout components (e.g., `page-layout.css`).
    - **`app/styles/circuitds-layout.css`**: Styles specific to the CircuitDS section layout.

### 2. Core Documentation Layout Components:

- Path: `components/layout/`
- Components:
    - `PageLayout.tsx`
    - `ContentSection.tsx`
    - `ExampleShowcase.tsx`

### 3. Design Token Philosophy:

- **Source File**: `app/styles/circuit.css`
- **Format**: CSS Custom Properties.
- **Naming Convention**: `--sds-[category]-[value]` (e.g., `--sds-size-space-400`) or semantic (e.g., `--background`).
- **Core Principle**: Always prefer design tokens over hardcoded values for styling.

### 4. Workflow Summaries:

-   **Adding New Documentation Page**:
    1.  Create directory: `app/(circuitds)/circuitds/your-new-topic/`
    2.  Create `page.tsx` in the new directory.
    3.  Structure content using `PageLayout`, `ContentSection`, `ExampleShowcase`.
    4.  Add to navigation: Update `circuitDSNavItems` in `app/(circuitds)/circuitds/layout.tsx`.

-   **Defining & Documenting New UI Component**:
    1.  Component code: `components/ui/YourNewComponent.tsx`.
    2.  Component styles (co-located or shared): `components/ui/YourNewComponent.css`.
    3.  Documentation page: `app/(circuitds)/circuitds/components/your-new-component/page.tsx`.
    4.  Document purpose, props, variants, usage with `ExampleShowcase`.
    5.  Add to navigation: Update `circuitDSNavItems` in `app/(circuitds)/circuitds/layout.tsx`.

### 5. Change Propagation Mechanism:

- Changes to design tokens in `app/styles/circuit.css` (especially primitive tokens) automatically propagate to all components and styles that reference these tokens (either directly or via semantic tokens).
- This is achieved through the cascading nature of CSS custom properties and a structured token hierarchy (Primitives -> Semantics -> Component Styles).
- See `/circuitds/ai-ops` for detailed documentation on change propagation. 