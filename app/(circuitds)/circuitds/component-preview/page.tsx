'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

export default function ComponentPreviewPage() {
  const exampleCode = `<button className="circuit-button primary">
  Primary Button
</button>`;

  return (
    <PageLayout 
      title="Component Preview"
      description="A page to preview newly created layout components as they are built."
    >
      <ContentSection title="PageLayout Component Preview">
        <p className="body-medium">
          This section is a child of the <code>PageLayout</code> component. 
          The title &quot;Component Preview&quot; and the description above are rendered by <code>PageLayout</code>.
        </p>
      </ContentSection>

      <ContentSection title="ContentSection Component Preview" headingLevel={3}>
        <p className="body-medium">
          This is a <code>ContentSection</code>. It has its own title (rendered as an h3 in this case) 
          and body content. You can nest multiple <code>ContentSection</code> components within a 
          <code>PageLayout</code>.
        </p>
        <div style={{ marginTop: 'var(--sds-size-space-400)', padding: 'var(--sds-size-space-400)', background: 'var(--surface-background-subtle)', border: '1px dashed var(--border-default)' }}>
          <p className="body-small">This is some more example content within the ContentSection.</p>
        </div>
      </ContentSection>

      <ContentSection title="ExampleShowcase Component Preview" headingLevel={3}>
        <ExampleShowcase
          title="Basic Button Example"
          description="This shows a preview of a button and its corresponding code."
          preview={
            <button 
              className="circuit-button primary" 
              style={{ /* Ensure button styles are loaded or add minimal inline for preview */ }}
            >
              Primary Button
            </button>
          }
          code={exampleCode}
        >
          {/* Children prop can also be used for simpler previews without the preview prop */}
        </ExampleShowcase>

        <ExampleShowcase
          description="An example with only a preview area and no title or explicit code block prop."
        >
          <div style={{ padding: 'var(--sds-size-space-300)', background: 'var(--status-info-subtle)', textAlign: 'center' }}>
            <p className="body-medium">Direct child content as preview.</p>
          </div>
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Another ContentSection">
        <p className="body-medium">
          Here is another instance of a <code>ContentSection</code>, demonstrating how they create
          distinct blocks of content on the page, each with its own title and consistent spacing.
        </p>
      </ContentSection>

    </PageLayout>
  );
} 