import React from 'react';
import { clsx } from 'clsx';

interface ExampleShowcaseProps {
  children?: React.ReactNode; // For direct preview content if no complex structure needed
  preview?: React.ReactNode;
  code?: string;
  title?: string;
  description?: string;
  headingLevel?: 3 | 4 | 5 | 6; // h3, h4, etc. for the title of the example
  className?: string;
  previewClassName?: string;
  contentClassName?: string; // For the header/description area
  codeBlockClassName?: string;
}

export default function ExampleShowcase({
  children,
  preview,
  code,
  title,
  description,
  headingLevel = 3,
  className,
  previewClassName,
  contentClassName,
  codeBlockClassName,
}: ExampleShowcaseProps) {
  const renderHeading = () => {
    if (!title) return null;
    const props = { className: 'example-showcase-title' };
    switch (headingLevel) {
      case 3:
        return <h3 {...props}>{title}</h3>;
      case 4:
        return <h4 {...props}>{title}</h4>;
      case 5:
        return <h5 {...props}>{title}</h5>;
      case 6:
        return <h6 {...props}>{title}</h6>;
      default:
        return <h3 {...props}>{title}</h3>; // Default to h3
    }
  };

  const previewContent = children || preview;

  return (
    <div className={clsx('example-showcase', className)}>
      {(title || description) && (
        <div className={clsx('example-showcase-header', contentClassName)}>
          {renderHeading()}
          {description && <p className="example-showcase-description">{description}</p>}
        </div>
      )}
      {previewContent && (
        <div className={clsx('example-showcase-preview', previewClassName)}>
          {previewContent}
        </div>
      )}
      {code && (
        <div className={clsx('example-showcase-code-block', codeBlockClassName)}>
          <pre>
            {/* Assuming global styles or a CodeBlock component will style this appropriately */}
            <code className="code-medium">{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
} 