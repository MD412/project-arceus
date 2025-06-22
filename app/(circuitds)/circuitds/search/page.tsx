'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import { SearchBar } from '@/components/ui/SearchBar';

export default function SearchPage() {
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  const basicExample = `<SearchBar 
  placeholder="Search cards..." 
  onSearch={(query) => console.log('Search:', query)}
/>`;

  const withLabelExample = `<SearchBar 
  label="Search Collection"
  placeholder="Search by card name, set, or number..." 
  helpText="Press Enter to search"
  onSearch={(query) => console.log('Search:', query)}
/>`;

  const minimalExample = `<SearchBar 
  className="minimal"
  placeholder="Quick search..." 
  showSearchButton={false}
  onSearch={(query) => console.log('Search:', query)}
/>`;

  const inlineExample = `<SearchBar 
  className="inline"
  placeholder="Find cards..." 
  onSearch={(query) => console.log('Search:', query)}
/>`;

  return (
    <PageLayout 
      title="Search Bar"
      description="A search input component that follows CircuitDS input patterns with various display options."
    >
      <ContentSection title="Basic Search Bar">
        <p className="body-medium">
          The basic search bar uses the standard CircuitDS input styling with an integrated search button.
        </p>
        <ExampleShowcase
          title="Default Search Bar"
          code={basicExample}
        >
          <SearchBar 
            placeholder="Search cards..." 
            onSearch={handleSearch}
          />
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Search Bar with Label">
        <p className="body-medium">
          Add a label and help text to provide context for the search functionality.
        </p>
        <ExampleShowcase
          title="Labeled Search"
          code={withLabelExample}
        >
          <SearchBar 
            label="Search Collection"
            placeholder="Search by card name, set, or number..." 
            helpText="Press Enter to search"
            onSearch={handleSearch}
          />
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Minimal Search Bar">
        <p className="body-medium">
          The minimal variant removes the search button and uses subtle styling. Perfect for header navigation.
        </p>
        <ExampleShowcase
          title="Minimal Style"
          code={minimalExample}
        >
          <SearchBar 
            className="minimal"
            placeholder="Quick search..." 
            showSearchButton={false}
            onSearch={handleSearch}
          />
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Inline Search Bar">
        <p className="body-medium">
          The inline variant adjusts the width to fit content, useful for toolbars and compact layouts.
        </p>
        <ExampleShowcase
          title="Inline Style"
          code={inlineExample}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sds-size-space-400)' }}>
            <span className="body-medium">Filter:</span>
            <SearchBar 
              className="inline"
              placeholder="Find cards..." 
              onSearch={handleSearch}
            />
          </div>
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Props Reference">
        <div className="props-table">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-default)' }}>
                <th style={{ padding: 'var(--sds-size-space-300)', textAlign: 'left' }}>Prop</th>
                <th style={{ padding: 'var(--sds-size-space-300)', textAlign: 'left' }}>Type</th>
                <th style={{ padding: 'var(--sds-size-space-300)', textAlign: 'left' }}>Default</th>
                <th style={{ padding: 'var(--sds-size-space-300)', textAlign: 'left' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--sds-size-space-300)' }}><code>placeholder</code></td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>string</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>"Search..."</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>Placeholder text for the input</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--sds-size-space-300)' }}><code>onSearch</code></td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>(query: string) =&gt; void</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>-</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>Callback fired when search is submitted</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--sds-size-space-300)' }}><code>label</code></td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>string</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>-</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>Label text above the input</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--sds-size-space-300)' }}><code>helpText</code></td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>string</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>-</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>Helper text below the input</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--sds-size-space-300)' }}><code>showSearchButton</code></td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>boolean</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>true</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>Whether to show the search button</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--sds-size-space-300)' }}><code>className</code></td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>string</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>""</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>Additional CSS classes</td>
              </tr>
              <tr>
                <td style={{ padding: 'var(--sds-size-space-300)' }}><code>defaultValue</code></td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>string</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>""</td>
                <td style={{ padding: 'var(--sds-size-space-300)' }}>Initial value for the search input</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ContentSection>

      <ContentSection title="Accessibility">
        <p className="body-medium">
          The SearchBar component includes several accessibility features:
        </p>
        <ul style={{ paddingLeft: 'var(--sds-size-space-600)', marginTop: 'var(--sds-size-space-200)' }}>
          <li>Proper ARIA labels for screen readers</li>
          <li>Keyboard navigation support (Enter to submit)</li>
          <li>Clear visual focus states following CircuitDS patterns</li>
          <li>Native search input type for better mobile experience</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
}