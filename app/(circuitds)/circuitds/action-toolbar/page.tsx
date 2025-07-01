'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import CodeBlock from '../components/CodeBlock';
import { Button } from '@/components/ui/Button';

export default function ActionToolbarPage() {
  const mainAppToolbarCode = `
import { Button } from '@/components/ui/Button';

function AppToolbar() {
  return (
    <div className="top-toolbar">
      <div className="action-toolbar">
        <Button variant="toolbar">+ Add Card</Button>
        <Button variant="toolbar">+ Process Scan</Button>
      </div>
    </div>
  );
}
`;

  const mainAppToolbarCss = `
/* In button.css */
/* This new variant is the single source of truth for the toolbar button's style. */
.button_button_toolbar_uCVc {
  height: 100%;
  padding: 0 20px;
  background-color: transparent;
  border: none;
  border-left: 1px solid var(--circuit-light-teal);
  border-radius: 0;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.button_button_toolbar_uCVc:hover:not(:disabled) {
  background-color: var(--circuit-dark-teal);
}

/* In action-toolbar.css */
/* These rules ensure the container is flush and has no unwanted space. */
.top-toolbar .action-toolbar {
  border-bottom: none;
  padding: 0;
  gap: 0;
}
`;

  return (
    <PageLayout
      title="Action Toolbar"
      description="The Action Toolbar is a container for primary actions. Its implementation has been refactored to use a component-driven approach, eliminating CSS conflicts and ensuring consistency."
    >
      <ContentSection
        title="The Modern Approach: Component-Driven Styling"
        headingLevel={2}
      >
        <p>
          To solve the CSS specificity wars and "nesting nightmare," the action buttons used in the main application's top toolbar are no longer styled using chained CSS classes. Instead, we now use a dedicated variant of our primary Button component.
        </p>
        <h3 className="text-lg font-bold mt-4 mb-2">The 'toolbar' Button Variant</h3>
        <p>
          A new variant, <code>toolbar</code>, has been added to the <code>&lt;Button /&gt;</code> component. This variant encapsulates all the required styling for a button that lives in the main header: zero padding, zero border-radius, 100% height, and a transparent background.
        </p>
      </ContentSection>

      <ExampleShowcase
        title="Main Application Toolbar Implementation"
        description="This is the single, correct way to implement the action buttons in the main application header. Note the clean component props and the lack of conflicting CSS classes."
      >
        <div className="top-toolbar" style={{ position: 'relative', zIndex: 1 }}>
          <div className="action-toolbar">
            <Button variant="toolbar">+ Add Card</Button>
            <Button variant="toolbar">+ Process Scan</Button>
    </div>
  </div>
        <CodeBlock code={mainAppToolbarCode} language="tsx" />
        <h4 className="text-md font-bold mt-4 mb-2">Key CSS</h4>
        <CodeBlock code={mainAppToolbarCss} language="css" />
      </ExampleShowcase>

      <ContentSection title="Deprecation Notice" headingLevel={2}>
        <h3 className="text-lg font-bold mt-4 mb-2">The Old Way (Deprecated)</h3>
        <p className="text-yellow-700 bg-yellow-50 p-3 rounded-md border border-yellow-200">
          <strong>Warning:</strong> The previous method of applying <code>.toolbar-action-button</code> and <code>.with-text</code> classes to generic <code>&lt;button&gt;</code> elements is now deprecated for use in the main application header. This approach creates CSS conflicts with <code>navigation.css</code> and is not guaranteed to produce the correct styling.
        </p>
        <p className="mt-2">
          While the <code>.action-toolbar</code> class is still used as a container, it should no longer be relied upon to style the buttons within it directly when used in the <code>.top-toolbar</code>. All styling should come from the Button component's variant.
        </p>
      </ContentSection>
    </PageLayout>
  );
} 