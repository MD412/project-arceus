import React from 'react';
import { clsx } from 'clsx';

interface ContentSectionProps {
  title: string;
  children: React.ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6; // h2, h3, etc.
  className?: string;
  titleClassName?: string;
}

export default function ContentSection({
  title,
  children,
  headingLevel = 2,
  className,
  titleClassName,
}: ContentSectionProps) {
  const renderHeading = () => {
    const props = { className: clsx('content-section-title', titleClassName) };
    switch (headingLevel) {
      case 2:
        return <h2 {...props}>{title}</h2>;
      case 3:
        return <h3 {...props}>{title}</h3>;
      case 4:
        return <h4 {...props}>{title}</h4>;
      case 5:
        return <h5 {...props}>{title}</h5>;
      case 6:
        return <h6 {...props}>{title}</h6>;
      default:
        return <h2 {...props}>{title}</h2>; // Default to h2
    }
  };

  return (
    <section className={clsx('content-section', className)}>
      {renderHeading()}
      <div className="content-section-body">
        {children}
      </div>
    </section>
  );
} 