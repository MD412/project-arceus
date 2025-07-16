import PageLayout from "@/components/layout/PageLayout";
import ContentSection from "@/components/layout/ContentSection";
import ExampleShowcase from "@/components/layout/ExampleShowcase";
import CodeBlock from "../CodeBlock";

// Tag Component
interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'feature' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
}

function Tag({ children, variant = 'default', size = 'medium' }: TagProps) {
  return (
    <span className={`circuit-tag circuit-tag--${variant} circuit-tag--${size}`}>
      {children}
    </span>
  );
}

export default function TagPage() {
  return (
    <PageLayout 
      title="Tag Component"
      description="Compact labels for categorizing and organizing content with semantic color variants."
    >
      <ContentSection title="Basic Usage">
        <p>Tags are used to label, categorize, or organize items using keywords that describe them.</p>
        
        <ExampleShowcase title="Default Tags">
          <div style={{ display: 'flex', gap: 'var(--sds-size-space-200)', flexWrap: 'wrap' }}>
            <Tag>Default</Tag>
            <Tag variant="feature">Feature</Tag>
            <Tag variant="success">Success</Tag>
            <Tag variant="warning">Warning</Tag>
            <Tag variant="error">Error</Tag>
            <Tag variant="info">Info</Tag>
          </div>
        </ExampleShowcase>

        <CodeBlock code={`<Tag>Default</Tag>
<Tag variant="feature">Feature</Tag>
<Tag variant="success">Success</Tag>
<Tag variant="warning">Warning</Tag>
<Tag variant="error">Error</Tag>
<Tag variant="info">Info</Tag>`} />
      </ContentSection>

      <ContentSection title="Sizes">
        <ExampleShowcase title="Tag Sizes">
          <div style={{ display: 'flex', gap: 'var(--sds-size-space-200)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Tag size="small" variant="feature">Small Tag</Tag>
            <Tag size="medium" variant="feature">Medium Tag</Tag>
          </div>
        </ExampleShowcase>

        <CodeBlock code={`<Tag size="small" variant="feature">Small Tag</Tag>
<Tag size="medium" variant="feature">Medium Tag</Tag>`} />
      </ContentSection>

      <ContentSection title="Real-World Examples">
        <ExampleShowcase title="Changelog Tags">
          <div style={{ display: 'flex', gap: 'var(--sds-size-space-150)', flexWrap: 'wrap' }}>
            <Tag variant="feature">FEATURE</Tag>
            <Tag variant="success">UX</Tag>
            <Tag variant="info">DESIGN SYSTEM</Tag>
            <Tag variant="warning">TRAINING</Tag>
            <Tag variant="error">BUGFIX</Tag>
          </div>
        </ExampleShowcase>

        <ExampleShowcase title="Status Tags">
          <div style={{ display: 'flex', gap: 'var(--sds-size-space-150)', flexWrap: 'wrap' }}>
            <Tag variant="success">Active</Tag>
            <Tag variant="warning">Pending</Tag>
            <Tag variant="error">Failed</Tag>
            <Tag variant="info">Processing</Tag>
            <Tag>Draft</Tag>
          </div>
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Component Code">
        <CodeBlock code={`interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'feature' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
}

function Tag({ children, variant = 'default', size = 'medium' }: TagProps) {
  return (
    <span className={\`circuit-tag circuit-tag--\${variant} circuit-tag--\${size}\`}>
      {children}
    </span>
  );
}`} />
      </ContentSection>

      <ContentSection title="CSS Implementation">
        <p>Add this CSS to your <code>app/styles/circuit.css</code> file:</p>
        <CodeBlock language="css" code={`.circuit-tag {
  display: inline-flex;
  align-items: center;
  font: var(--font-body-small);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: var(--sds-size-radius-50);
  border: 1px solid;
  transition: all 0.2s ease;
}

/* Sizes */
.circuit-tag--small {
  padding: var(--sds-size-space-25) var(--sds-size-space-100);
  font-size: 0.75rem;
}

.circuit-tag--medium {
  padding: var(--sds-size-space-50) var(--sds-size-space-150);
  font-size: 0.8rem;
}

/* Variants */
.circuit-tag--default {
  background: var(--surface-preview-background);
  color: var(--text-secondary);
  border-color: var(--border-default);
}

.circuit-tag--feature {
  background: var(--theme-info-bg);
  color: var(--theme-info-primary);
  border-color: var(--theme-info-border);
}

.circuit-tag--success {
  background: var(--theme-success-bg);
  color: var(--theme-success-primary);
  border-color: var(--theme-success-border);
}

.circuit-tag--warning {
  background: var(--theme-warning-bg);
  color: var(--theme-warning-primary);
  border-color: var(--theme-warning-border);
}

.circuit-tag--error {
  background: var(--theme-error-bg);
  color: var(--theme-error-primary);
  border-color: var(--theme-error-border);
}

.circuit-tag--info {
  background: var(--theme-info-bg);
  color: var(--theme-info-primary);
  border-color: var(--theme-info-border);
}`} />
      </ContentSection>

      <ContentSection title="Design Guidelines">
        <ul>
          <li><strong>Use Sparingly:</strong> Too many tags can create visual clutter</li>
          <li><strong>Consistent Variants:</strong> Use semantic variants consistently across your app</li>
          <li><strong>Readable Text:</strong> Ensure good contrast between text and background</li>
          <li><strong>Grouping:</strong> Group related tags together with consistent spacing</li>
          <li><strong>Truncation:</strong> Keep tag text concise - truncate long labels</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 