"use client";

import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import { CardDetailLayout } from '@/components/ui/CardDetailLayout';
import { useState } from 'react';

const exampleCard = {
  id: 'example-1',
  name: 'Venusaur',
  set_code: 'Base',
  card_number: '15/102',
  image_url: 'https://images.pokemontcg.io/base1/15.png'
};

const codeExample = `import { CardDetailLayout } from '@/components/ui/CardDetailLayout';

interface Card {
  id: string;
  name: string;
  set_code: string;
  card_number: string;
  image_url: string;
}

function MyComponent() {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  return (
    <CardDetailLayout
      selectedCard={selectedCard}
      onCardSelect={(card) => setSelectedCard(card)}
      onCardApply={(card) => {
        // Handle card application logic
        console.log('Applying card:', card);
      }}
    />
  );
}`;

const propsExample = `interface CardDetailLayoutProps {
  selectedCard: Card | null;
  onCardSelect: (card: Card) => void;
  onCardApply?: (card: Card) => void;
  className?: string;
}`;

export default function CardDetailLayoutPage() {
  const [selectedCard, setSelectedCard] = useState<typeof exampleCard | null>(null);

  return (
    <PageLayout
      title="Card Detail Layout"
      description="A responsive layout component for displaying card details with search functionality. Features a card display section on the left and a search sidebar on the right."
    >
      <ContentSection title="Overview" headingLevel={2}>
        <p>
          The CardDetailLayout component provides a clean, responsive interface for card search and review workflows. 
          It's designed to replace the previous "Fix This" overlay approach with a more integrated and user-friendly experience.
        </p>
        <p>
          The layout consists of two main sections:
        </p>
        <ul>
          <li><strong>Card Display Section:</strong> Shows the selected card image and details</li>
          <li><strong>Search Sidebar:</strong> Contains the CardSearchInput component for finding cards</li>
        </ul>
      </ContentSection>

      <ContentSection title="Basic Usage" headingLevel={2}>
        <ExampleShowcase
          title="Default Layout"
          description="Standard card detail layout with search functionality"
          preview={
            <div style={{ width: '100%', maxWidth: '800px' }}>
              <CardDetailLayout
                selectedCard={selectedCard}
                onCardSelect={(card) => setSelectedCard(card)}
                onCardApply={(card) => {
                  console.log('Applying card:', card);
                }}
              />
            </div>
          }
          code={codeExample}
        />
      </ContentSection>

      <ContentSection title="Props" headingLevel={2}>
        <ExampleShowcase
          title="Component Interface"
          description="Available props for the CardDetailLayout component"
          preview={<pre className="code-block">{propsExample}</pre>}
          code={propsExample}
        />
      </ContentSection>

      <ContentSection title="Design Tokens" headingLevel={2}>
        <p>
          The component uses CircuitDS design tokens for consistent styling:
        </p>
        <ul>
          <li><strong>Spacing:</strong> Uses <code>--sds-size-space-*</code> tokens for gaps and padding</li>
          <li><strong>Colors:</strong> Uses semantic color tokens like <code>--surface-background</code> and <code>--text-primary</code></li>
          <li><strong>Typography:</strong> Uses <code>--sds-size-font-*</code> and <code>--sds-weight-*</code> tokens</li>
          <li><strong>Border Radius:</strong> Uses <code>--sds-size-radius-*</code> tokens</li>
        </ul>
      </ContentSection>

      <ContentSection title="Responsive Behavior" headingLevel={2}>
        <p>
          The layout is fully responsive and adapts to different screen sizes:
        </p>
        <ul>
          <li><strong>Desktop:</strong> Two-column grid layout with card display and search sidebar</li>
          <li><strong>Mobile:</strong> Single-column layout with search sidebar appearing first</li>
          <li><strong>Tablet:</strong> Responsive grid that adjusts based on available space</li>
        </ul>
      </ContentSection>

      <ContentSection title="Integration" headingLevel={2}>
        <p>
          This component is designed to work seamlessly with:
        </p>
        <ul>
          <li><strong>CardSearchInput:</strong> Provides the search functionality</li>
          <li><strong>Scan Review Workflow:</strong> Used in scan detail pages for card corrections</li>
          <li><strong>CircuitDS Design System:</strong> Follows all established patterns and tokens</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 