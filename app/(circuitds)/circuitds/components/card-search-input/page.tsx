"use client";

import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import { CardSearchInput } from '@/components/ui/CardSearchInput';
import { Card } from '@/hooks/useCardSearch';
import { useState } from 'react';

const codeExample = `import { CardSearchInput } from '@/components/ui/CardSearchInput';
import { Card } from '@/hooks/useCardSearch';

function MyComponent() {
  const handleCardSelect = (card: Card) => {
    console.log('Selected card:', card);
    // Update your state or perform action
  };

  return (
    <CardSearchInput 
      onSelect={handleCardSelect}
      placeholder="Search for Pokemon cards..."
    />
  );
}`;

const hookExample = `// The component uses the useCardSearch hook internally
// You can also use it directly for custom implementations:

import { useCardSearch } from '@/hooks/useCardSearch';

function CustomCardSearch() {
  const [query, setQuery] = useState('');
  const { data, isLoading, error } = useCardSearch(query);
  
  // Custom UI implementation...
}`;

export default function CardSearchInputPage() {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  return (
    <PageLayout
      title="Card Search Input"
      description="A type-ahead search input for finding Pokemon cards from the TCG API"
    >
      <ContentSection title="Overview">
        <p>
          CardSearchInput provides a complete search experience with debounced queries,
          loading states, keyboard navigation, and accessibility features.
        </p>
      </ContentSection>

      <ContentSection title="Features">
        <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li>🔍 Real-time search with 300ms debounce</li>
          <li>⌨️ Full keyboard navigation (↑/↓, Enter, Escape)</li>
          <li>♿ ARIA-compliant for screen readers</li>
          <li>🖼️ Card thumbnails with fallback placeholders</li>
          <li>💰 Market price display when available</li>
          <li>📦 Automatic result caching (5 min stale, 10 min cache)</li>
          <li>🎨 Integrated with CircuitDS design system</li>
        </ul>
      </ContentSection>

      <ContentSection title="Interactive Example">
        <ExampleShowcase title="Basic Usage">
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <CardSearchInput 
              onSelect={setSelectedCard}
              placeholder="Try searching for 'Pikachu' or 'Charizard'..."
            />
            
            {selectedCard && (
              <div style={{ 
                marginTop: 'var(--spacing-lg)', 
                padding: 'var(--spacing-md)',
                background: 'var(--color-surface-secondary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <strong>Selected:</strong> {selectedCard.name}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {selectedCard.set_name} • #{selectedCard.card_number}
                </p>
                {selectedCard.market_price !== null && (
                  <p style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-success)' }}>
                    ${selectedCard.market_price.toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Usage">
        <pre style={{ 
          background: 'var(--color-surface-secondary)', 
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
          <code>{codeExample}</code>
        </pre>
      </ContentSection>

      <ContentSection title="Props">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Prop</th>
              <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Type</th>
              <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Required</th>
              <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 'var(--spacing-sm)' }}><code>onSelect</code></td>
              <td style={{ padding: 'var(--spacing-sm)' }}><code>(card: Card) =&gt; void</code></td>
              <td style={{ padding: 'var(--spacing-sm)' }}>Yes</td>
              <td style={{ padding: 'var(--spacing-sm)' }}>Callback when a card is selected</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 'var(--spacing-sm)' }}><code>placeholder</code></td>
              <td style={{ padding: 'var(--spacing-sm)' }}><code>string</code></td>
              <td style={{ padding: 'var(--spacing-sm)' }}>No</td>
              <td style={{ padding: 'var(--spacing-sm)' }}>Input placeholder text</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 'var(--spacing-sm)' }}><code>className</code></td>
              <td style={{ padding: 'var(--spacing-sm)' }}><code>string</code></td>
              <td style={{ padding: 'var(--spacing-sm)' }}>No</td>
              <td style={{ padding: 'var(--spacing-sm)' }}>Additional CSS class for the container</td>
            </tr>
          </tbody>
        </table>
      </ContentSection>

      <ContentSection title="Card Interface">
        <pre style={{ 
          background: 'var(--color-surface-secondary)', 
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
          <code>{`interface Card {
  id: string;          // Pokemon TCG API card ID
  name: string;        // Card name
  set_code: string;    // Set code (e.g., "base1")
  card_number: string; // Card number in set
  image_url: string | null;
  set_name: string;    // Full set name
  rarity: string;      // Card rarity
  market_price: number | null; // Current market price
}`}</code>
        </pre>
      </ContentSection>

      <ContentSection title="Using the Hook Directly">
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          For custom implementations, you can use the <code>useCardSearch</code> hook directly:
        </p>
        <pre style={{ 
          background: 'var(--color-surface-secondary)', 
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
          <code>{hookExample}</code>
        </pre>
      </ContentSection>

      <ContentSection title="Keyboard Shortcuts">
        <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li><kbd>↓</kbd> - Navigate to next result</li>
          <li><kbd>↑</kbd> - Navigate to previous result</li>
          <li><kbd>Enter</kbd> - Select highlighted result</li>
          <li><kbd>Escape</kbd> - Close dropdown and blur input</li>
        </ul>
      </ContentSection>

      <ContentSection title="Implementation Notes">
        <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li>Searches the Pokemon TCG API (pokemontcg.io)</li>
          <li>Minimum 2 characters required to trigger search</li>
          <li>Results are limited to 20 items per query</li>
          <li>Searches by card name with wildcard suffix</li>
          <li>Cached results persist for 5 minutes (stale) / 10 minutes (cache)</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 