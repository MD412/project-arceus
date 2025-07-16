'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

// Define the complete spacing scale data with all tokens
const spacingScale = [
  { token: '--sds-size-space-0', value: '0px', description: 'No spacing, used for removing default margins or padding.' },
  { token: '--sds-size-space-025', value: '1px', description: 'Hair-thin spacing for borders and fine details.' },
  { token: '--sds-size-space-050', value: '2px', description: 'Micro spacing for tight UI elements.' },
  { token: '--sds-size-space-075', value: '3px', description: 'Tiny spacing for compact components like small tags.' },
  { token: '--sds-size-space-100', value: '4px', description: 'Extra small spacing for compact layouts.' },
  { token: '--sds-size-space-150', value: '6px', description: 'Small spacing step for fine-tuned layouts.' },
  { token: '--sds-size-space-200', value: '8px', description: 'Small spacing for related elements.' },
  { token: '--sds-size-space-250', value: '10px', description: 'Medium-small spacing for component internals.' },
  { token: '--sds-size-space-300', value: '12px', description: 'Base spacing for general content.' },
  { token: '--sds-size-space-400', value: '16px', description: 'Medium spacing for content sections.' },
  { token: '--sds-size-space-500', value: '20px', description: 'Medium-large spacing for content blocks.' },
  { token: '--sds-size-space-600', value: '24px', description: 'Large spacing for major sections.' },
  { token: '--sds-size-space-700', value: '28px', description: 'Large spacing for component separation.' },
  { token: '--sds-size-space-800', value: '32px', description: 'Extra large spacing for page sections.' },
  { token: '--sds-size-space-1000', value: '40px', description: 'Extra large spacing for major content blocks.' },
  { token: '--sds-size-space-1200', value: '48px', description: 'Double extra large spacing for major layout blocks.' },
  { token: '--sds-size-space-1600', value: '64px', description: 'Triple extra large spacing for hero sections.' },
  { token: '--sds-size-space-2000', value: '80px', description: 'Huge spacing for major page divisions.' },
  { token: '--sds-size-space-2400', value: '96px', description: 'Massive spacing for dramatic layout effects.' },
  { token: '--sds-size-space-3200', value: '128px', description: 'Maximum spacing for hero sections.' },
  { token: '--sds-size-space-4000', value: '160px', description: 'Ultimate spacing for dramatic page breaks.' },
];

export default function SpacingPage() {
  return (
    <PageLayout
      title="Spacing"
      description="The spacing scale provides consistent rhythm throughout layouts. Each step is available as a CSS variable and utility class."
    >
      <ContentSection title="Spacing Scale">
        <div className="spacing-scale-grid">
          {spacingScale.map(item => (
            <div key={item.token} className="spacing-item">
              <div className="spacing-item-preview" style={{ height: item.value, width: '100px', background: 'var(--interactive-primary-subtle)', border: '1px solid var(--interactive-primary)' }} />
              <div className="spacing-item-details">
                <code className="code-medium">{item.token}</code>
                <p className="body-medium"><strong>{item.value}</strong></p>
                <p className="body-small">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </ContentSection>

      <ContentSection title="Usage Examples">
        <ExampleShowcase
          title="CSS Variables"
          headingLevel={3}
          description="Use spacing tokens directly in your CSS to maintain consistent spacing throughout your application."
          preview={
            <div style={{ marginBottom: 'var(--sds-size-space-400)', padding: 'var(--sds-size-space-600)', background: 'var(--surface-background-subtle)', border: '1px solid var(--border-default)' }}>
              <p className="body-medium">Content with margin-bottom: 16px (var(--sds-size-space-400)) and padding: 24px (var(--sds-size-space-600))</p>
            </div>
          }
          code={`.element {
  margin-bottom: var(--sds-size-space-400);
  padding: var(--sds-size-space-600);
}`}
        />
        <ExampleShowcase
          title="Utility Classes (Conceptual)"
          headingLevel={3}
          description="Apply spacing using utility classes for quick layout adjustments without writing custom CSS. (Note: Actual utility classes need to be defined separately if not already present)."
          preview={
            <div className="mb-400 p-600" style={{ background: 'var(--surface-background-subtle)', border: '1px solid var(--border-default)' }}>
              <p className="body-medium">Content with conceptual class `mb-400` and `p-600`.</p>
              <p className="body-small mt-200">Actual implementation of these utility classes is pending.</p>
            </div>
          }
          code={`<div class="mb-400 p-600">
  Content with margin-bottom: 16px and padding: 24px
</div>`}
        />
      </ContentSection>

      <ContentSection title="Component Spacing Guidelines" headingLevel={2}>
        <p className="body-medium">
          Different components use specific spacing tokens for optimal visual hierarchy and usability:
        </p>
        <div style={{ marginTop: 'var(--sds-size-space-400)' }}>
          <h3 className="heading" style={{ marginBottom: 'var(--sds-size-space-200)' }}>Tag Components</h3>
          <ul className="list-disc pl-6 body-medium" style={{ marginBottom: 'var(--sds-size-space-400)' }}>
            <li><strong>Small tags:</strong> <code>--sds-size-space-075</code> × <code>--sds-size-space-200</code> (3px × 8px)</li>
            <li><strong>Medium tags:</strong> <code>--sds-size-space-100</code> × <code>--sds-size-space-250</code> (4px × 10px)</li>
          </ul>
          
          <h3 className="heading" style={{ marginBottom: 'var(--sds-size-space-200)' }}>Button Components</h3>
          <ul className="list-disc pl-6 body-medium" style={{ marginBottom: 'var(--sds-size-space-400)' }}>
            <li><strong>Small buttons:</strong> <code>--sds-size-space-200</code> × <code>--sds-size-space-300</code> (8px × 12px)</li>
            <li><strong>Medium buttons:</strong> <code>--sds-size-space-300</code> × <code>--sds-size-space-400</code> (12px × 16px)</li>
            <li><strong>Large buttons:</strong> <code>--sds-size-space-400</code> × <code>--sds-size-space-500</code> (16px × 20px)</li>
          </ul>
          
          <h3 className="heading" style={{ marginBottom: 'var(--sds-size-space-200)' }}>Layout Spacing</h3>
          <ul className="list-disc pl-6 body-medium">
            <li><strong>Component gaps:</strong> <code>--sds-size-space-200</code> to <code>--sds-size-space-400</code></li>
            <li><strong>Section spacing:</strong> <code>--sds-size-space-600</code> to <code>--sds-size-space-800</code></li>
            <li><strong>Page-level spacing:</strong> <code>--sds-size-space-1200</code> and above</li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="Dimension Tokens vs. Spacing Tokens" headingLevel={2}>
        <p className="body-medium">
          While spacing tokens govern <em>rhythm</em> (margins, paddings, gaps), some fixed-width
          requirements are not about rhythm at all. We capture those in a companion set of
          <strong>dimension tokens</strong> (e.g.&nbsp;<code>--sds-size-width-sidebar</code>). Use them whenever a
          component or layout needs a hard-coded width/height that shouldn't scale with the
          spacing steps.
        </p>
        <ul className="list-disc pl-6 body-medium" style={{ marginTop: 'var(--sds-size-space-300)' }}>
          <li><code>--sds-size-width-sidebar</code> &nbsp;⟶&nbsp; <strong>280 px</strong> – standard sidebar width.</li>
          <li><code>--sds-size-width-card-min</code> &nbsp;⟶&nbsp; <strong>280 px</strong> – minimum width for cards in responsive grids.</li>
          <li><code>--sds-size-width-metric-card</code> &nbsp;⟶&nbsp; <strong>140 px</strong> – minimum width for metric cards.</li>
          <li><code>--sds-size-height-*</code> &nbsp;⟶&nbsp; component heights (32–52 px) tokenised in <code>circuit.css</code>.</li>
        </ul>
        <p className="body-small" style={{ marginTop: 'var(--sds-size-space-300)' }}>
          If you find yourself typing raw <code>px</code> values for size constraints, consider whether a
          dimension token would make it reusable and easier to theme. When in doubt, prefer a
          token – consistency first!
        </p>
      </ContentSection>
    </PageLayout>
  );
} 