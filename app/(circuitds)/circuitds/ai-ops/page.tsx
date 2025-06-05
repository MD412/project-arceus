'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

export default function AIOperationsPage() {
  return (
    <PageLayout
      title="AI Operations"
      description="Documentation for AI-driven operations and automated change propagation in CircuitDS."
    >
      <ContentSection title="Design System Change Propagation">
        <p className="body-medium">
          CircuitDS uses a sophisticated token system to ensure changes propagate automatically across all components.
          This system reduces manual updates and maintains consistency throughout the application.
        </p>

        <ExampleShowcase
          title="Token Hierarchy"
          headingLevel={3}
          description="The three-layer token hierarchy ensures changes cascade properly through the system."
          preview={
            <div style={{ 
              padding: 'var(--sds-size-space-600)',
              background: 'var(--surface-background-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--sds-size-radius-200)'
            }}>
              <div style={{ marginBottom: 'var(--sds-size-space-400)' }}>
                <h4 style={{ color: 'var(--text-heading-strong)', marginBottom: 'var(--sds-size-space-200)' }}>1. Primitive Tokens</h4>
                <code style={{ color: 'var(--text-primary)' }}>--eva-dark-teal: #1a4a47;</code>
              </div>
              <div style={{ marginBottom: 'var(--sds-size-space-400)' }}>
                <h4 style={{ color: 'var(--text-heading-strong)', marginBottom: 'var(--sds-size-space-200)' }}>2. Semantic Tokens</h4>
                <code style={{ color: 'var(--text-primary)' }}>--background: var(--eva-dark-teal);</code>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-heading-strong)', marginBottom: 'var(--sds-size-space-200)' }}>3. Component Styles</h4>
                <code style={{ color: 'var(--text-primary)' }}>background-color: var(--background);</code>
              </div>
            </div>
          }
          code={`/* 1. Primitive Tokens */
--eva-dark-teal: #1a4a47;
--sds-size-space-400: 16px;

/* 2. Semantic Tokens */
--background: var(--eva-dark-teal);
--surface-background: var(--eva-mid-teal);

/* 3. Component Styles */
.component {
  background-color: var(--background);
  padding: var(--sds-size-space-400);
}`}
        />
      </ContentSection>

      <ContentSection title="Automatic Change Propagation">
        <p className="body-medium">
          When a design token is updated, the change automatically propagates through the system. Here's how it works:
        </p>

        <ExampleShowcase
          title="Change Propagation Example"
          headingLevel={3}
          description="Example of how changing a primitive token affects the entire system."
          preview={
            <div style={{ 
              padding: 'var(--sds-size-space-600)',
              background: 'var(--surface-background-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--sds-size-radius-200)'
            }}>
              <div style={{ marginBottom: 'var(--sds-size-space-400)' }}>
                <p className="body-medium" style={{ marginBottom: 'var(--sds-size-space-200)' }}>1. Update primitive token:</p>
                <code style={{ color: 'var(--text-primary)' }}>--eva-dark-teal: #2c5c58;</code>
              </div>
              <div style={{ marginBottom: 'var(--sds-size-space-400)' }}>
                <p className="body-medium" style={{ marginBottom: 'var(--sds-size-space-200)' }}>2. Semantic tokens update automatically:</p>
                <code style={{ color: 'var(--text-primary)' }}>--background: var(--eva-dark-teal) → #2c5c58</code>
              </div>
              <div>
                <p className="body-medium" style={{ marginBottom: 'var(--sds-size-space-200)' }}>3. Components reflect changes:</p>
                <code style={{ color: 'var(--text-primary)' }}>All components using --background are updated</code>
              </div>
            </div>
          }
          code={`/* Before Update */
--eva-dark-teal: #1a4a47;
--background: var(--eva-dark-teal);
.component { background-color: var(--background); }

/* After Update */
--eva-dark-teal: #2c5c58;
--background: var(--eva-dark-teal); /* Auto-updates */
.component { background-color: var(--background); } /* Reflects new color */`}
        />
      </ContentSection>

      <ContentSection title="Best Practices">
        <ExampleShowcase
          title="Token Usage Guidelines"
          headingLevel={3}
          description="Follow these practices to ensure changes propagate correctly."
          code={`/* ✅ DO: Use semantic tokens in components */
.component {
  color: var(--text-primary);
  background: var(--surface-background);
}

/* ❌ DON'T: Use primitive tokens directly */
.component {
  color: var(--eva-light-yellow);
  background: var(--eva-dark-teal);
}

/* ✅ DO: Create new semantic tokens for specific use cases */
:root {
  --custom-component-background: var(--surface-background);
}

/* ✅ DO: Use spacing tokens for consistent layout */
.component {
  padding: var(--sds-size-space-400);
  gap: var(--sds-size-space-200);
}`}
        />
      </ContentSection>
    </PageLayout>
  );
} 