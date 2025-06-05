'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

export default function NestingContainersPage() {
  const containerHierarchyCode = `
// Your App's Main Layout (e.g., app/(circuitds)/circuitds/layout.tsx)
<div className="circuitds-layout-container">
  <AppNavigation /> {/* Sidebar Navigation */}
  <main className="circuitds-main-content">
    {/* PageLayout will be rendered here by Next.js for each page */}
    <PageLayout title="Page Title" description="Page description.">
      <ContentSection title="Section Title">
        <ExampleShowcase
          title="Example Title"
          description="Example description."
          preview={"<p>Preview Area Content</p>"} 
          code={"<YourComponent />"} 
        />
        {/* More ExampleShowcases */}
      </ContentSection>
      {/* More ContentSections */}
    </PageLayout>
  </main>
</div>
  `.trim();

  const appNavigationExampleCode = `
// Simplified from app/(circuitds)/circuitds/layout.tsx
export default function CircuitDSLayout({ children }) {
  return (
    <div className="circuitds-layout-container">
      <AppNavigation
        navTitle="CircuitDS"
        items={...} // your nav items
        // ... other props
      />
      <main className="circuitds-main-content">
        {children}
      </main>
    </div>
  );
}

/* Relevant CSS (app/styles/circuitds-layout.css) */
.circuitds-layout-container {
  display: flex;
  height: calc(100vh - var(--header-height, 0px));
  /* ... */
}
.circuitds-sidebar { /* Class used by AppNavigation's wrapper if baseNavClass is set */
  width: 260px;
  padding: var(--sds-size-space-600);
  /* ... */
}
.circuitds-main-content {
  flex: 1;
  padding: var(--sds-size-space-800); /* Overall content padding */
  overflow-y: auto;
  /* ... */
}
  `.trim();

  const pageLayoutExampleCode = `
// From components/layout/PageLayout.tsx
export default function PageLayout({ title, description, children }) {
  return (
    <article className="page-layout">
      <header className="page-layout-header">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </header>
      <div className="page-layout-content">
        {children}
      </div>
    </article>
  );
}

/* Relevant CSS (app/styles/page-layout.css) */
.page-layout-header {
  margin-bottom: var(--sds-size-space-600); /* Space after header */
  padding-bottom: var(--sds-size-space-400); /* Space before border */
  border-bottom: var(--sds-size-stroke-border) solid var(--border-subtle);
}
/* .page-layout-content has no specific padding/margin by default,
   it relies on .circuitds-main-content for outer padding
   and ContentSection for inner structure. */
  `.trim();

  const contentSectionExampleCode = `
// From components/layout/ContentSection.tsx
export default function ContentSection({ title, children, headingLevel = 2 }) {
  // ... heading render logic ...
  return (
    <section className="content-section">
      {renderHeading()}
      <div className="content-section-body">
        {children}
      </div>
    </section>
  );
}

/* Relevant CSS (app/styles/content-section.css) */
.content-section {
  margin-bottom: var(--sds-size-space-800); /* Space after each section */
  padding: var(--sds-size-space-600); /* Internal padding */
  border: var(--sds-size-stroke-border) solid var(--border-default);
  border-radius: var(--sds-size-radius-200);
  background-color: var(--surface-background);
  overflow: hidden;
}
.content-section-title {
  margin-bottom: var(--sds-size-space-400); /* Space after title, before content body */
}
.content-section-body {
  display: flex;
  flex-direction: column;
  gap: var(--sds-size-space-600); /* Handles spacing between direct children */
}

/* List styling within content sections */
.content-section .list-disc {
  list-style-type: disc;
  padding-left: var(--sds-size-space-800); /* 32px - Standard indentation for lists */
  margin: 0;
}
.content-section .list-circle {
  list-style-type: circle;
  padding-left: var(--sds-size-space-800); /* 32px - Consistent with list-disc */
  margin: 0;
}

/* Example usage:
<ul className="list-disc">
  <li>First level bullet point</li>
  <ul className="list-circle">
    <li>Second level bullet point</li>
  </ul>
</ul>
*/
  `.trim();

  const exampleShowcaseComponentCode = `
// From components/layout/ExampleShowcase.tsx
export default function ExampleShowcase({ title, description, preview, code, ...rest }) {
  // ...
  return (
    <div className="example-showcase" {...rest}>
      {/* Header (title, description) */}
      {/* Preview */}
      {/* Code block */}
    </div>
  );
}

/* Relevant CSS (app/styles/example-showcase.css) */
.example-showcase {
  /* margin-bottom: var(--sds-size-space-600); */ /* Removed: Spacing now typically handled by parent ContentSection's gap */
  border: var(--sds-size-stroke-border) solid var(--border-default);
  border-radius: var(--sds-size-radius-200);
  background-color: var(--surface-container-level-1, var(--surface-background-subtle));
  overflow: hidden;
}
.example-showcase-header {
  padding: var(--sds-size-space-500);
  /* ... */
}
.example-showcase-preview {
  padding: var(--sds-size-space-600);
  /* ... */
}
.example-showcase-code-block {
  padding: var(--sds-size-space-500);
  border-top: var(--sds-size-stroke-border) solid var(--border-default);
  /* ... */
}
  `.trim();

  const spacingSystemDescription = `
Our containers use a system of CSS custom properties (design tokens) for consistent spacing.
Key tokens include:
- \`--sds-size-space-200\`: 8px (Tight spacing, e.g., gap within a header)
- \`--sds-size-space-400\`: 16px (Element spacing, e.g., section title margin)
- \`--sds-size-space-500\`: 20px (Component internal padding)
- \`--sds-size-space-600\`: 24px (Content spacing, e.g., padding within sections, example margins)
- \`--sds-size-space-800\`: 32px (Container spacing, e.g., main content padding, section margins)

Radii:
- \`--sds-size-radius-200\`: 8px (Standard border radius for containers)
  `.trim();
  
  const standardPageImplementationCode = `
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
// import YourActualComponent from '@/components/YourComponent'; // Example import

export default function MyNewDocumentationPage() {
  return (
    <PageLayout
      title="My Component Name"
      description="A brief description of what this component does."
    >
      <ContentSection title="Overview">
        <p>Detailed explanation of the component's purpose and usage context.</p>
        <ExampleShowcase
          title="Basic Usage"
          description="This is how to use the component in its simplest form."
          preview={<div>YourActualComponent Preview Placeholder</div>}
          code={ \`// Note: Using YourActualComponent would require it to be defined and imported.
<YourActualComponent
  prop1="value"
  prop2={true} // booleans are fine in JSX like contexts
/>\` }
        />
      </ContentSection>

      <ContentSection title="Props & API">
        <ExampleShowcase
          title="Available Props"
          description="Details about each prop, its type, default value, and effect."
          code={ \`interface YourComponentProps {
  prop1?: string; // Description of prop1
  prop2?: boolean; // Description of prop2
}\` }
        />
      </ContentSection>
      
      {/* Further sections for different variants, states, accessibility notes etc. */}
    </PageLayout>
  );
}
  `.trim();

  const designTokenUsageCssCode = `
/* Example CSS rules from various layout stylesheets */

.circuitds-main-content {
  padding: var(--sds-size-space-800); /* 32px */
}

.content-section {
  margin-bottom: var(--sds-size-space-800); /* 32px */
  padding: var(--sds-size-space-600); /* 24px */
  border-radius: var(--sds-size-radius-200); /* 8px */
  /* Direct children within .content-section-body are spaced using: */
  /* .content-section-body { gap: var(--sds-size-space-600); } */
}

.example-showcase {
  /* margin-bottom: var(--sds-size-space-600); */ /* Now handled by parent ContentSection's gap */
  padding: /* Varies by sub-element, e.g. header/preview/code */;
  border-radius: var(--sds-size-radius-200); /* 8px */
}

.example-showcase-header {
  gap: var(--sds-size-space-200); /* 8px */
}
  `.trim();

  const recommendedElementUsageHtmlCode = `
<div className="circuitds-layout-container"> {/* Overall app container */}
  <AppNavigation /> {/* Contains <nav> internally */}
  <main className="circuitds-main-content"> {/* Main content area of a page */}
    <PageLayout title="Page Title" description="Page Description"> {/* Added missing props */}
      <ContentSection title="Section Title"> {/* Added missing prop */}
        <ExampleShowcase title="Example" description="Desc."> {/* Added missing props */}
          {/* ... */}
        </ExampleShowcase>
      </ContentSection>
    </PageLayout>
  </main>
</div>
  `.trim();

  const typicalHeadingStructureJsxCode = `
{/* PageLayout title (typically h1 generated by the component) */}
<PageLayout title="Page Title (h1)">

  {/* ContentSection title (h2 by default, configurable) */}
  <ContentSection title="Section Title (h2)">

    {/* ExampleShowcase title (h3 by default, configurable) */}
    <ExampleShowcase title="Example Title (h3)">
      {/* ... */}
    </ExampleShowcase>

  </ContentSection>
</PageLayout>
  `.trim();

  return (
    <PageLayout
      title="Nesting Containers Guide"
      description="A comprehensive guide to understanding and implementing the container nesting system in our design system."
    >
      <ContentSection title="Overview">
        <p>
          Our design system uses a systematic approach to nesting containers that
          provides consistent spacing, layout, and content hierarchy. This system
          ensures predictable layouts while maintaining flexibility for
          different content types.
        </p>
        <p>
          The container architecture follows a clear hierarchy from root layout
          to individual content examples, with each level having specific
          responsibilities and styling patterns.
        </p>
      </ContentSection>

      <ContentSection title="Container Architecture">
        <p>
          The layout of the CircuitDS documentation pages follows a consistent structure,
          from the overall application frame down to individual component examples.
        </p>
        <ExampleShowcase
          title="Visual Container Hierarchy"
          description="Simplified visual representation of how containers typically nest within each other on a documentation page."
          preview={<p>See code block below for the hierarchy structure.</p>}
          code={containerHierarchyCode}
        />
      </ContentSection>

      <ContentSection title="Core Layout Components">
        <p>These are the primary components responsible for page structure and content organization.</p>
        <ExampleShowcase
          title="AppNavigation & Main Layout Structure"
          description="The root layout for CircuitDS pages, providing the sidebar and the main content area that hosts individual page layouts. This is primarily defined in app/(circuitds)/circuitds/layout.tsx and its associated CSS."
          code={appNavigationExampleCode}
        />
        <ExampleShowcase
          title="PageLayout Component"
          description="Wraps the entire content of a single documentation page, providing the main title, description, and a container for content sections. (components/layout/PageLayout.tsx)"
          code={pageLayoutExampleCode}
        />
        <ExampleShowcase
          title="ContentSection Component"
          description="Groups related content or examples under a common heading within a page. These are visually distinct bordered sections. (components/layout/ContentSection.tsx)"
          code={contentSectionExampleCode}
        />
        <ExampleShowcase
          title="ExampleShowcase Component"
          description="Displays individual examples, typically including a title, description, a live preview area, and a code snippet. (components/layout/ExampleShowcase.tsx)"
          code={exampleShowcaseComponentCode}
        />
      </ContentSection>

      <ContentSection title="Spacing & Sizing System">
        <ExampleShowcase
          title="Design Token Usage"
          description={spacingSystemDescription}
          code={designTokenUsageCssCode}
        />
        <p>
          <strong>Key Principles:</strong>
        </p>
        <ul>
          <li>Utilize the predefined \`--sds-size-space-*\` tokens for all margins and paddings.</li>
          <li>Use \`--sds-size-radius-*\` tokens for border radii.</li>
          <li>Ensure responsive adjustments are made where necessary, often reducing padding on smaller screens while maintaining a consistent rhythmic scale.</li>
        </ul>
      </ContentSection>

      <ContentSection title="List Styling">
        <p>ContentSection components provide automatic list styling for better readability and hierarchy:</p>
        <ul>
          <li><strong>Default Styling:</strong> All lists within ContentSection get proper indentation and styling automatically</li>
          <li><strong>Indentation:</strong> Lists are indented by 32px (var(--sds-size-space-800)) by default</li>
          <li><strong>Typography:</strong> Lists inherit body-medium font styling</li>
          <li><strong>List Types:</strong>
            <ul>
              <li>Unordered lists use disc bullets by default</li>
              <li>Ordered lists use decimal numbering</li>
              <li>Nested lists automatically use circle bullets</li>
              <li>Third-level lists use square bullets</li>
            </ul>
          </li>
          <li><strong>Override Classes:</strong> Use .list-disc and .list-circle classes when you need explicit styling control</li>
          <li><strong>Responsive:</strong> Indentation reduces to 24px on mobile screens</li>
        </ul>
        <ExampleShowcase
          title="List Styling Example"
          description="Lists are automatically styled within ContentSection components."
          code={`<ContentSection title="Example Section">
  {/* Lists get proper styling automatically */}
  <ul>
    <li>First level item</li>
    <ul>
      <li>Second level item</li>
      <ul>
        <li>Third level item</li>
      </ul>
    </ul>
  </ul>
  
  {/* Use override classes when needed */}
  <ul className="list-disc pl-6 body-medium">
    <li>Explicitly styled list</li>
  </ul>
</ContentSection>`}
        />
      </ContentSection>

      <ContentSection title="Implementation Patterns">
        <ExampleShowcase
          title="Standard Documentation Page Structure"
          description="The recommended JSX structure for creating new documentation pages using the established layout components."
          code={standardPageImplementationCode}
        />
      </ContentSection>
      
      <ContentSection title="Best Practices">
        <ContentSection title="Semantic HTML" headingLevel={3}>
          <p>Use appropriate HTML elements for better accessibility and SEO.</p>
          <ExampleShowcase
            title="Recommended Element Usage"
            code={recommendedElementUsageHtmlCode}
          />
        </ContentSection>
        <ContentSection title="Content Hierarchy (Headings)" headingLevel={3}>
          <p>Follow established heading level patterns for consistent content organization and accessibility.</p>
          <ExampleShowcase
            title="Typical Heading Structure"
            code={typicalHeadingStructureJsxCode}
          />
          <p>Ensure heading levels are sequential and do not skip levels to maintain a logical document outline.</p>
        </ContentSection>
      </ContentSection>

    </PageLayout>
  );
} 