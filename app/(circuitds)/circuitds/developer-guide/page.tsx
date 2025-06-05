'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import Link from 'next/link'; // Import Link for internal navigation

// Helper component for rendering code blocks if not using a dedicated one
const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre
    style={{
      background: 'var(--surface-preview-background)',
      padding: 'var(--sds-size-space-400)',
      borderRadius: 'var(--sds-size-radius-100)',
      overflowX: 'auto',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-family-mono)',
      fontSize: 'var(--font-body-code)',
      border: '1px solid var(--border-subtle)'
    }}
  >
    <code>{children}</code>
  </pre>
);

export default function DeveloperGuidePage() {
  return (
    <PageLayout
      title="CircuitDS: Developer & Contributor Guide"
      description="This document provides essential information for developers and contributors working on the CircuitDS design system within Project Arceus."
    >
      <ContentSection title="1. Project Overview & Philosophy" headingLevel={2}>
        <p className="body-medium">
          CircuitDS is the dedicated design system for Project Arceus. Its primary goal is to provide a consistent, reusable, and well-documented set of UI components, styling guidelines, and interaction patterns.
        </p>
        <h3 className="h4" style={{ marginTop: 'var(--sds-size-space-500)', marginBottom: 'var(--sds-size-space-200)' }}>Core Philosophy:</h3>
        <ul className="list-disc pl-6 body-medium">
          <li><strong>Source of Truth:</strong> CircuitDS is the definitive source for all UI elements and their usage. Components and styles defined here should be consistently applied throughout the main application.</li>
          <li><strong>Consistency:</strong> Adherence to defined design tokens (colors, spacing, typography, etc.) and layout components is crucial for visual and experiential consistency.</li>
          <li><strong>Modularity & Reusability:</strong> Components are designed to be modular and reusable across different parts of the application.</li>
          <li><strong>Accessibility:</strong> Components and patterns should be designed and implemented with accessibility (WCAG AA) as a primary consideration.</li>
        </ul>
      </ContentSection>

      <ContentSection title="2. Directory Structure & Key Files" headingLevel={2}>
        <p className="body-medium">
          The design system documentation and core files are primarily located within the <code>app/(circuitds)/circuitds/</code> directory. The <code>(circuitds)</code> part is a Next.js route group, used for organizing routes and potentially applying a specific layout to the design system pages, separate from the main application.
        </p>
        <h3 className="h4" style={{ marginTop: 'var(--sds-size-space-500)', marginBottom: 'var(--sds-size-space-200)' }}>Key Locations:</h3>
        <ul className="list-disc pl-6 body-medium">
          <li>
            <strong><code>app/(circuitds)/circuitds/</code></strong>: Root directory for the design system's documentation pages.
            <ul className="list-circle pl-6">
              <li><strong><code>layout.tsx</code></strong>: Defines the main layout for all CircuitDS documentation pages. This includes the sidebar navigation (<code>AppNavigation</code>) and the main content area where individual page content is rendered.</li>
              <li><strong><code>page.tsx</code></strong>: The entry page for the <code>/circuitds</code> route (the design system homepage).</li>
              <li>
                <strong><code>[topic_or_component_group]/page.tsx</code></strong>: Standard pattern for documentation pages. For example:
                <ul className="list-disc pl-6">
                    <li><code>colors/page.tsx</code></li>
                    <li><code>buttons/page.tsx</code></li>
                    <li><code>nesting-containers/page.tsx</code></li>
                </ul>
              </li>
            </ul>
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)'}}>
            <strong><code>components/</code></strong> (Located at the project root, e.g., <code>project-arceus/components/</code>):
            <ul className="list-circle pl-6">
              <li>
                <strong><code>layout/</code></strong>: Contains components used for structuring the documentation pages themselves.
                <ul className="list-disc pl-6">
                  <li><code>PageLayout.tsx</code>: Wraps the entire content of a documentation page, providing the main title and description.</li>
                  <li><code>ContentSection.tsx</code>: Groups related content or examples under a common heading within a page. Styled as distinct bordered sections with consistent internal spacing (using <code>gap</code>).</li>
                  <li><code>ExampleShowcase.tsx</code>: Displays individual examples, typically including a title, description, a live preview, and a code snippet.</li>
                </ul>
              </li>
              <li>
                <strong><code>ui/</code></strong>: Contains the actual UI components of the design system.
                <ul className="list-disc pl-6">
                  <li><code>AppNavigation.tsx</code>: The component used for sidebar navigation (used in CircuitDS layout and documented on the <code>menusidebar</code> page).</li>
                  <li><code>Button.tsx</code>: An example of a core UI component.</li>
                  <li><em>(New UI components should be added here.)</em></li>
                </ul>
              </li>
            </ul>
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)'}}>
            <strong>Stylesheets:</strong>
            <ul className="list-circle pl-6">
              <li><strong><code>app/styles/circuit.css</code></strong>: The primary stylesheet for CircuitDS. Defines global styles, all design tokens (CSS custom properties for color, spacing, typography, radii, etc.), and base theming for the design system pages.</li>
              <li><strong><code>app/styles/globals.css</code></strong>: The global stylesheet for the entire application, which imports <code>circuit.css</code> among others.</li>
              <li><strong><code>components/ui/AppNavigation.css</code></strong>: Styles specific to the <code>AppNavigation</code> component's internal structure and default appearance.</li>
              <li>
                <strong><code>app/styles/[layout_component_name].css</code></strong>: Styles for the documentation layout components, e.g.:
                <ul className="list-disc pl-6">
                    <li><code>app/styles/page-layout.css</code></li>
                    <li><code>app/styles/content-section.css</code></li>
                    <li><code>app/styles/example-showcase.css</code></li>
                </ul>
              </li>
              <li><strong>Component-Specific Styles</strong>: For UI components in <code>components/ui/</code>, their styles are typically co-located (e.g., <code>components/ui/Button.css</code>) or managed in a more general UI component stylesheet if preferred.</li>
              <li><strong><code>app/styles/circuitds-layout.css</code></strong>: Styles specific to the overall layout of the CircuitDS section (e.g., <code>.circuitds-sidebar</code>, <code>.circuitds-main-content</code>).</li>
            </ul>
          </li>
        </ul>
      </ContentSection>

      <ContentSection title="3. Core Layout Components for Documentation" headingLevel={2}>
        <p className="body-medium">
          The documentation pages within CircuitDS are built using a consistent set of layout components found in <code>components/layout/</code>:
        </p>
        <ul className="list-disc pl-6 body-medium">
          <li><strong><code>PageLayout</code></strong>: The outermost wrapper for a page's content. Handles the page title and introductory description.</li>
          <li><strong><code>ContentSection</code></strong>: Used to divide a page into logical sections, each with a title. It provides consistent padding, borders, and background, and uses <code>flexbox</code> with <code>gap</code> to space its direct children evenly (e.g., paragraphs, <code>ExampleShowcase</code> components).</li>
          <li><strong><code>ExampleShowcase</code></strong>: Used to display individual component examples or code snippets. It typically includes a title, description, a preview area, and a formatted code block.</li>
        </ul>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-400)'}}>
          Refer to the <Link href="/circuitds/nesting-containers" className="text-brand underline">Nesting Containers Guide</Link> for detailed visual examples and code structure of how these components are used together.
        </p>
      </ContentSection>

      <ContentSection title="4. Design Token Philosophy" headingLevel={2}>
        <p className="body-medium">
          All styling within CircuitDS (and by extension, the main application) should leverage the design tokens defined as CSS custom properties in <code>app/styles/circuit.css</code>.
        </p>
        <ul className="list-disc pl-6 body-medium">
          <li><strong>Categories:</strong> Tokens are provided for colors, spacing, typography (font families, sizes, weights, line heights), border radii, etc.</li>
          <li><strong>Naming Convention:</strong> Tokens typically follow a pattern like <code>--sds-[category]-[value]</code> (e.g., <code>--sds-size-space-400</code>, <code>--sds-color-primary-500</code>) or semantic names for theme colors (e.g., <code>--background</code>, <code>--text-primary</code>, <code>--surface-background</code>).</li>
          <li><strong>Usage:</strong> Always prefer using a token over hardcoded values to ensure consistency and ease of theming or future updates.</li>
        </ul>
      </ContentSection>

      <ContentSection title="5. Semantic Structure & Accessibility" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium">
          <li><strong>HTML Semantics:</strong> Use appropriate HTML5 elements (<code>&lt;article&gt;</code>, <code>&lt;section&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, headings, etc.) to structure content logically. This is crucial for SEO and accessibility.</li>
          <li><strong>Heading Hierarchy:</strong> Maintain a correct and sequential heading hierarchy (H1, H2, H3, etc.) on all pages. The <code>PageLayout</code> component typically provides the H1.</li>
          <li><strong>ARIA Attributes:</strong> Ensure components like <code>AppNavigation</code> use appropriate ARIA attributes for roles, states, and properties where necessary.</li>
          <li><strong>Keyboard Navigation & Focus:</strong> All interactive elements must be keyboard navigable with clearly visible focus states.</li>
          <li><strong>Color Contrast:</strong> Adhere to WCAG AA color contrast guidelines.</li>
        </ul>
      </ContentSection>

      <ContentSection title="6. Working with CircuitDS" headingLevel={2}>
        <h3 className="h4" style={{ marginBottom: 'var(--sds-size-space-300)' }}>Adding a New Documentation Page (e.g., for a new guideline or component group)</h3>
        <ol className="list-decimal pl-6 body-medium">
          <li><strong>Create Directory:</strong> Add a new directory under <code>app/(circuitds)/circuitds/your-new-topic</code>.</li>
          <li><strong>Create <code>page.tsx</code>:</strong> Inside this new directory, create a <code>page.tsx</code> file.</li>
          <li><strong>Structure Content:</strong> Use <code>&lt;PageLayout&gt;</code>, <code>&lt;ContentSection&gt;</code>, and <code>&lt;ExampleShowcase&gt;</code> to build the page content. Define any code examples as string constants at the top of the file if they are complex.</li>
          <li><strong>Add to Navigation:</strong> Update <code>app/(circuitds)/circuitds/layout.tsx</code> by adding a new <code>NavigationConfigItem</code> to the <code>circuitDSNavItems</code> array to include your new page in the sidebar.</li>
        </ol>

        <h3 className="h4" style={{ marginTop: 'var(--sds-size-space-500)', marginBottom: 'var(--sds-size-space-300)' }}>Defining and Documenting a New UI Component (e.g., Card, Modal)</h3>
        <ol className="list-decimal pl-6 body-medium">
          <li>
            <strong>Component Creation:</strong>
            <ul className="list-disc pl-6">
              <li>Place the new component's source code in <code>components/ui/YourNewComponent.tsx</code>.</li>
              <li>Style it using CSS custom properties (design tokens). Co-locate its styles in <code>components/ui/YourNewComponent.css</code> or add to a shared UI stylesheet.</li>
            </ul>
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)'}}>
            <strong>Documentation Page:</strong>
            <ul className="list-disc pl-6">
              <li>Create a new documentation page for it under <code>app/(circuitds)/circuitds/components/your-new-component/page.tsx</code> (or an appropriate category).</li>
              <li>Document its purpose, props, variants, usage examples (using <code>ExampleShowcase</code>), and any specific implementation or accessibility notes.</li>
              <li>Add it to the navigation in <code>app/(circuitds)/circuitds/layout.tsx</code>.</li>
            </ul>
          </li>
        </ol>

        <h3 className="h4" style={{ marginTop: 'var(--sds-size-space-500)', marginBottom: 'var(--sds-size-space-300)' }}>Modifying Existing Components or Styles</h3>
        <ul className="list-disc pl-6 body-medium">
          <li>When modifying existing UI components or their styles, ensure changes are reflected in their documentation within CircuitDS.</li>
          <li>If changing design tokens in <code>app/styles/circuit.css</code>, be mindful of their global impact and update relevant documentation (e.g., the "Colors" or "Spacing" pages).</li>
        </ul>
        <hr style={{ margin: 'var(--sds-size-space-600) 0', borderColor: 'var(--border-subtle)' }} />
        <p className="body-medium">
          <em>This guide helps ensure consistency and a smooth development experience when working with CircuitDS. Please keep it updated as the design system evolves.</em>
        </p>
      </ContentSection>

      <ContentSection title="AI Data Section (For Automated Processing)" headingLevel={2}>
        <p className="body-medium">
          This section provides a structured summary of key information for AI agents and automated tools working with CircuitDS.
        </p>
        <h3 className="h4" style={{ marginTop: 'var(--sds-size-space-400)', marginBottom: 'var(--sds-size-space-200)' }}>1. Key Files & Directories:</h3>
        <ul className="list-disc pl-6 body-medium">
          <li>
            <strong><code>app/(circuitds)/circuitds/</code></strong>: Root directory for CircuitDS documentation pages.
            <ul className="list-circle pl-6">
                <li><strong><code>layout.tsx</code></strong>: Main layout for all CircuitDS documentation pages (sidebar navigation, main content area).</li>
                <li><strong><code>page.tsx</code></strong>: Entry page for the <code>/circuitds</code> route (design system homepage).</li>
                <li><strong><code>[topic_or_component_group]/page.tsx</code></strong>: Standard pattern for documentation pages (e.g., <code>colors/page.tsx</code>).</li>
            </ul>
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)'}}>
            <strong><code>components/</code></strong> (Project root):
            <ul className="list-circle pl-6">
                <li>
                    <strong><code>layout/</code></strong>: Contains components for structuring documentation pages.
                    <ul className="list-disc pl-6">
                        <li><code>PageLayout.tsx</code>: Outermost wrapper for page content (title, description).</li>
                        <li><code>ContentSection.tsx</code>: Groups related content/examples with a heading.</li>
                        <li><code>ExampleShowcase.tsx</code>: Displays individual examples (preview, code).</li>
                    </ul>
                </li>
                <li>
                    <strong><code>ui/</code></strong>: Contains the actual UI components of the design system.
                    <ul className="list-disc pl-6">
                        <li><code>AppNavigation.tsx</code>: Sidebar navigation component.</li>
                        <li><code>Button.tsx</code>: Example of a core UI component.</li>
                    </ul>
                </li>
            </ul>
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)'}}>
            <strong>Stylesheets:</strong>
            <ul className="list-circle pl-6">
                <li><strong><code>app/styles/circuit.css</code></strong>: Primary stylesheet for CircuitDS. Defines global styles, all design tokens (CSS custom properties), and base theming.</li>
                <li><strong><code>app/styles/globals.css</code></strong>: Global stylesheet for the entire application, imports <code>circuit.css</code>.</li>
                <li><strong><code>components/ui/AppNavigation.css</code></strong>: Styles for the <code>AppNavigation</code> component.</li>
                <li><strong><code>app/styles/[layout_component_name].css</code></strong>: Styles for documentation layout components (e.g., <code>page-layout.css</code>).</li>
                <li><strong><code>app/styles/circuitds-layout.css</code></strong>: Styles specific to the CircuitDS section layout.</li>
            </ul>
          </li>
        </ul>

        <h3 className="h4" style={{ marginTop: 'var(--sds-size-space-400)', marginBottom: 'var(--sds-size-space-200)' }}>2. Core Documentation Layout Components:</h3>
        <ul className="list-disc pl-6 body-medium">
            <li>Path: <code>components/layout/</code></li>
            <li>Components:
                <ul className="list-circle pl-6">
                    <li><code>PageLayout.tsx</code></li>
                    <li><code>ContentSection.tsx</code></li>
                    <li><code>ExampleShowcase.tsx</code></li>
                </ul>
            </li>
        </ul>

        <h3 className="h4" style={{ marginTop: 'var(--sds-size-space-400)', marginBottom: 'var(--sds-size-space-200)' }}>3. Design Token Philosophy:</h3>
        <ul className="list-disc pl-6 body-medium">
            <li><strong>Source File</strong>: <code>app/styles/circuit.css</code></li>
            <li><strong>Format</strong>: CSS Custom Properties.</li>
            <li><strong>Naming Convention</strong>: <code>--sds-[category]-[value]</code> (e.g., <code>--sds-size-space-400</code>) or semantic (e.g., <code>--background</code>).</li>
            <li><strong>Core Principle</strong>: Always prefer design tokens over hardcoded values for styling.</li>
        </ul>

        <h3 className="h4" style={{ marginTop: 'var(--sds-size-space-400)', marginBottom: 'var(--sds-size-space-200)' }}>4. Workflow Summaries:</h3>
        <p className="body-medium"><strong>Adding New Documentation Page</strong>:</p>
        <ol className="list-decimal pl-6 body-medium">
            <li>Create directory: <code>app/(circuitds)/circuitds/your-new-topic/</code></li>
            <li>Create <code>page.tsx</code> in the new directory.</li>
            <li>Structure content using <code>PageLayout</code>, <code>ContentSection</code>, <code>ExampleShowcase</code>.</li>
            <li>Add to navigation: Update <code>circuitDSNavItems</code> in <code>app/(circuitds)/circuitds/layout.tsx</code>.</li>
        </ol>

        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-300)'}}><strong>Defining & Documenting New UI Component</strong>:</p>
        <ol className="list-decimal pl-6 body-medium">
            <li>Component code: <code>components/ui/YourNewComponent.tsx</code>.</li>
            <li>Component styles (co-located or shared): <code>components/ui/YourNewComponent.css</code>.</li>
            <li>Documentation page: <code>app/(circuitds)/circuitds/components/your-new-component/page.tsx</code>.</li>
            <li>Document purpose, props, variants, usage with <code>ExampleShowcase</code>.</li>
            <li>Add to navigation: Update <code>circuitDSNavItems</code> in <code>app/(circuitds)/circuitds/layout.tsx</code>.</li>
        </ol>

        <h3 className="h4" style={{ marginTop: 'var(--sds-size-space-400)', marginBottom: 'var(--sds-size-space-200)' }}>5. Change Propagation Mechanism:</h3>
        <ul className="list-disc pl-6 body-medium">
            <li>Changes to design tokens in <code>app/styles/circuit.css</code> (especially primitive tokens) automatically propagate to all components and styles that reference these tokens (either directly or via semantic tokens).</li>
            <li>This is achieved through the cascading nature of CSS custom properties and a structured token hierarchy (Primitives -&gt; Semantics -&gt; Component Styles).</li>
            <li>See <Link href="/circuitds/ai-ops" className="text-brand underline">/circuitds/ai-ops</Link> for detailed documentation on change propagation.</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 