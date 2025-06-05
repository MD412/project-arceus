'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

// Define the radius scale data
const radiusScale = [
  { token: '--sds-size-radius-100', value: '4px', description: 'Default radius for buttons and small interactive elements.' },
  { token: '--sds-size-radius-150', value: '6px', description: 'Medium radius for larger interactive elements.' },
  { token: '--sds-size-radius-200', value: '8px', description: 'Large radius for cards and containers.' },
  { token: '--sds-size-radius-400', value: '16px', description: 'Extra large radius for modal dialogs and prominent containers.' },
  { token: '--sds-size-radius-full', value: '9999px', description: 'Full radius for pills and circular elements.' },
];

export default function RadiusPage() {
  return (
    <PageLayout
      title="Border Radius"
      description="Our border radius scale provides consistent corner rounding throughout the interface. Each token is available as a CSS variable."
    >
      <ContentSection title="Radius Scale">
        <div className="radius-scale-grid">
          {radiusScale.map(item => (
            <div key={item.token} className="radius-item">
              <div className="radius-item-preview" style={{ 
                height: '80px',
                width: '80px',
                background: 'var(--interactive-primary)',
                borderRadius: `var(${item.token.slice(2)})` // Remove -- prefix for var()
              }} />
              <div className="radius-item-details">
                <code className="code-medium">{item.token}</code>
                <p className="body-medium"><strong>{item.value}</strong></p>
                <p className="body-small">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </ContentSection>

      <ContentSection title="Usage Guidelines">
        <p className="body-medium">
          Choose the appropriate radius token based on the element's size and prominence in the interface:
        </p>
        <ul className="list-disc pl-6 body-medium">
          <li><strong>Buttons & Form Controls</strong>: Use <code>--sds-size-radius-100</code> (4px) for a subtle, professional look.</li>
          <li><strong>Cards & Containers</strong>: Use <code>--sds-size-radius-200</code> (8px) to create visual separation from the background.</li>
          <li><strong>Modals & Prominent UI</strong>: Use <code>--sds-size-radius-400</code> (16px) to draw attention and create hierarchy.</li>
          <li><strong>Pills & Tags</strong>: Use <code>--sds-size-radius-full</code> for fully rounded elements.</li>
        </ul>
      </ContentSection>

      <ContentSection title="Implementation">
        <ExampleShowcase
          title="CSS Usage"
          description="Access radius tokens directly in your CSS."
          code={`.element {
  border-radius: var(--sds-size-radius-100);
}

/* For mixed radius values */
.element-mixed {
  border-radius: var(--sds-size-radius-400) var(--sds-size-radius-100);
}`}
        />
      </ContentSection>
    </PageLayout>
  );
} 