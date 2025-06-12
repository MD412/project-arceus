'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

// Data for typography examples
const displayTypes = [
  { class: 'display-xl', label: 'display-xl' },
  { class: 'display-lg', label: 'display-lg' },
  { class: 'display-md', label: 'display-md' },
];

const headingLevels = [1, 2, 3, 4, 5, 6].map(level => ({ class: `heading-${level}`, label: `heading-${level}` }));

const bodySizes = [
  { class: 'text-xl', label: 'text-xl' },
  { class: 'text-lg', label: 'text-lg' },
  { class: 'text-base', label: 'text-base' },
  { class: 'text-sm', label: 'text-sm' },
  { class: 'text-xs', label: 'text-xs' },
];

const uiSizes = [
  { class: 'ui-lg', label: 'ui-lg' },
  { class: 'ui-md', label: 'ui-md' },
  { class: 'ui-sm', label: 'ui-sm' },
];

const codeSizes = [
  { class: 'code-lg', label: 'code-lg' },
  { class: 'code-md', label: 'code-md' },
  { class: 'code-sm', label: 'code-sm' },
];

const specialStyles = ['caption', 'overline', 'label'].map(style => ({ class: style, label: style }));

const fontScale = [
  { token: '--font-size-50', value: '0.75rem (12px)' },
  { token: '--font-size-75', value: '0.875rem (14px)' },
  { token: '--font-size-87', value: '0.9375rem (15px)' },
  { token: '--font-size-100', value: '1rem (16px)' },
  { token: '--font-size-200', value: '1.125rem (18px)' },
  { token: '--font-size-300', value: '1.25rem (20px)' },
  { token: '--font-size-400', value: '1.5rem (24px)' },
  { token: '--font-size-500', value: '1.75rem (28px)' },
  { token: '--font-size-600', value: '2rem (32px)' },
  { token: '--font-size-700', value: '2.5rem (40px)' },
  { token: '--font-size-800', value: '3rem (48px)' },
  { token: '--font-size-900', value: '3.5rem (56px)' },
  { token: '--font-size-1000', value: '4rem (64px)' }
];

const TypographyExample = ({ className, label }: { className: string; label: string }) => (
  <ExampleShowcase preview={<p className={className}>The quick brown fox jumps over the lazy dog</p>} code={label} />
);

export default function TypographyPage() {
  return (
    <PageLayout
      title="Typography System"
      description="A comprehensive type system built on semantic tokens and consistent scales."
    >
      <ContentSection title="Overview">
        <p className="text-lg">
          Our typography system is built on a foundation of primitive tokens that define our basic type properties, 
          which are then composed into semantic tokens for specific use cases. This ensures consistency while 
          maintaining flexibility across different contexts.
        </p>
      </ContentSection>

      <ContentSection title="Display Typography">
        <p className="text-lg mb-400">
          Display typography is used for hero sections, large headlines, and other prominent text elements.
        </p>
        {displayTypes.map(type => <TypographyExample key={type.class} className={type.class} label={type.label} />)}
      </ContentSection>

      <ContentSection title="Headings">
        <p className="text-lg mb-400">
          A clear hierarchy of headings helps users understand the structure of your content.
        </p>
        {headingLevels.map(level => <TypographyExample key={level.class} className={level.class} label={level.label} />)}
      </ContentSection>

      <ContentSection title="Body Text">
        <p className="text-lg mb-400">
          Body text styles are optimized for readability in different contexts. `text-base` (15px) is our default body text size.
        </p>
        {bodySizes.map(size => <TypographyExample key={size.class} className={size.class} label={size.label} />)}
      </ContentSection>

      <ContentSection title="UI Text">
        <p className="text-lg mb-400">
          UI text is designed for interface elements like buttons, labels, and navigation.
        </p>
        {uiSizes.map(size => <TypographyExample key={size.class} className={size.class} label={size.label} />)}
      </ContentSection>

      <ContentSection title="Code">
        <p className="text-lg mb-400">
          Monospace typography for code examples and technical content.
        </p>
        {codeSizes.map(size => <TypographyExample key={size.class} className={size.class} label={size.label} />)}
      </ContentSection>

      <ContentSection title="Special Cases">
        <p className="text-lg mb-400">
          Special typography styles for specific use cases.
        </p>
        {specialStyles.map(style => <TypographyExample key={style.class} className={style.class} label={style.label} />)}
      </ContentSection>

      <ContentSection title="Implementation">
        <ExampleShowcase 
          title="Example Article Structure" 
          headingLevel={3}
          preview={ 
            <article>
              <h1 className="heading-1 mb-200">Main Heading</h1>
              <p className="text-xl mb-400">
                This is a large body text paragraph that might introduce a section or contain important information that needs emphasis.
              </p>
              <h2 className="heading-3 mb-200">Subheading</h2>
              <p className="text-base mb-200">
                Regular body text for the main content. This style is optimized for readability and works well for longer paragraphs.
              </p>
              <p className="caption">A caption that provides additional context</p>
            </article>
          }
          code={`<article>
  <h1 className="heading-1">Main Heading</h1>
  <p className="text-xl">
    This is a large body text paragraph...
  </p>
  <h2 className="heading-3">Subheading</h2>
  <p className="text-base">
    Regular body text for the main content...
  </p>
  <p className="caption">
    A caption that provides additional context
  </p>
</article>`}
        />
        <ExampleShowcase
          title="Using CSS Variables"
          headingLevel={3}
          description="Access typography tokens directly in your CSS for custom components."
          code={`.custom-text {
  font-size: var(--font-size-87); /* 15px - our base body text */
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--text-primary);
}`}
        />
      </ContentSection>

      <ContentSection title="Font Size Scale">
        <p className="text-lg mb-400">
          Our font size scale follows an 8px baseline grid for consistent vertical rhythm.
        </p>
        <div className="font-scale-list-container">
          {fontScale.map(({ token, value }) => (
            <div key={token} className="font-scale-item">
              <code className="code-sm">{token}</code>
              <span className="text-base">{value}</span>
            </div>
          ))}
        </div>
      </ContentSection>
    </PageLayout>
  );
} 