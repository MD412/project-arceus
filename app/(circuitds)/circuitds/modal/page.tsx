"use client";

import { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import CodeBlock from '../components/CodeBlock';
import { BaseModal } from '@/components/ui/BaseModal';
import { CardDetailModal } from '@/components/ui/CardDetailModal';
import { CardCorrectionModal } from '@/components/ui/CardCorrectionModal';
import { Button } from '@/components/ui/Button';

export default function ModalPage() {
  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [cardDetailModalOpen, setCardDetailModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  
  const exampleCard = {
    id: 'demo-1',
    name: "Charizard ex",
    imageUrl: "/ui-playground-pk-img/bulbasaur.jpg",
    number: "185",
    setCode: "sv5",
    setName: "Temporal Forces",
    quantity: 2,
    condition: "Near Mint",
  };

  const exampleDetection = {
    id: 'demo-detection-1',
    crop_url: 'demo/crop.jpg',
    card: {
      name: "Pikachu",
      card_number: "25",
      set_code: "sv5",
      image_url: "/ui-playground-pk-img/bulbasaur.jpg",
    },
  };

  return (
    <PageLayout
      title="Modal"
      description="Modal dialogs for focused user interactions and content display"
    >
      <ContentSection title="Overview">
        <p>
          CircuitDS provides a modular modal system built with composition in mind. 
          Each modal component serves a specific purpose and follows BEM naming conventions 
          for consistent styling.
        </p>
        <ul style={{ marginTop: 'var(--sds-size-space-300)', color: 'var(--text-secondary)' }}>
          <li><strong>BaseModal</strong> - Foundation for custom content</li>
          <li><strong>CardDetailModal</strong> - Collection card details and management</li>
          <li><strong>CardCorrectionModal</strong> - Scan review and AI corrections</li>
        </ul>
      </ContentSection>

      <ContentSection title="BaseModal">
        <p style={{ marginBottom: 'var(--sds-size-space-400)' }}>
          The foundation modal provides backdrop, container, close button, and SSR guards. 
          Use this for custom content that doesn't fit the specialized modals.
        </p>
        <ExampleShowcase>
          <Button onClick={() => setBasicModalOpen(true)}>
            Open BaseModal
          </Button>
          
          <BaseModal
            isOpen={basicModalOpen}
            onClose={() => setBasicModalOpen(false)}
            title="Custom Modal"
            className="demo-modal"
          >
            <div style={{ padding: 'var(--sds-size-space-600)' }}>
              <p style={{ marginBottom: 'var(--sds-size-space-400)', color: 'var(--text-secondary)' }}>
                This is a simple modal with custom content. You can put any content here.
              </p>
              <Button onClick={() => setBasicModalOpen(false)}>
                Got it
              </Button>
            </div>
          </BaseModal>
        </ExampleShowcase>

        <CodeBlock language="tsx" code={`import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';

function Example() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>
      
      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Custom Modal"
        className="my-custom-modal"
      >
        <div style={{ padding: 'var(--sds-size-space-600)' }}>
          <p>Your content goes here</p>
        </div>
      </BaseModal>
    </>
  );
}`} />
      </ContentSection>

      <ContentSection title="CardDetailModal">
        <p style={{ marginBottom: 'var(--sds-size-space-400)' }}>
          Specialized for collection management. Shows card image, market value, quantity controls, 
          and actions like replace and delete.
        </p>
        
        <ExampleShowcase>
          <Button onClick={() => setCardDetailModalOpen(true)}>
            View Card Details
          </Button>
          
          <CardDetailModal
            isOpen={cardDetailModalOpen}
            onClose={() => setCardDetailModalOpen(false)}
            card={exampleCard}
            onDeleteCard={async (cardId: string) => console.log('Delete card:', cardId)}
            onReplaced={(updated) => console.log('Card replaced:', updated)}
          />
        </ExampleShowcase>

        <CodeBlock language="tsx" code={`import { CardDetailModal } from '@/components/ui/CardDetailModal';

function CardGrid() {
  const [selectedCard, setSelectedCard] = useState(null);
  
  return (
    <>
      {cards.map(card => (
        <TradingCard
          key={card.id}
          {...card}
          onClick={() => setSelectedCard(card)}
        />
      ))}
      
      {selectedCard && (
        <CardDetailModal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          card={selectedCard}
          onDeleteCard={async (cardId) => await handleDelete(cardId)}
          onReplaced={(updated) => handleCardReplaced(updated)}
        />
      )}
    </>
  );
}`} />
      </ContentSection>

      <ContentSection title="CardCorrectionModal">
        <p style={{ marginBottom: 'var(--sds-size-space-400)' }}>
          For scan review workflows. Shows AI match vs original scan crop side-by-side, 
          with search functionality to correct mistakes.
        </p>
        
        <ExampleShowcase>
          <Button onClick={() => setCorrectionModalOpen(true)}>
            Review Detection
          </Button>
          
          <CardCorrectionModal
            isOpen={correctionModalOpen}
            onClose={() => setCorrectionModalOpen(false)}
            detection={exampleDetection}
            onSave={(cardId) => {
              console.log('Corrected to:', cardId);
              setCorrectionModalOpen(false);
            }}
          />
        </ExampleShowcase>

        <CodeBlock language="tsx" code={`import { CardCorrectionModal } from '@/components/ui/CardCorrectionModal';

function ScanReview() {
  const [selectedDetection, setSelectedDetection] = useState(null);
  
  return (
    <>
      {detections.map(detection => (
        <DetectionCard
          key={detection.id}
          {...detection}
          onClick={() => setSelectedDetection(detection)}
        />
      ))}
      
      {selectedDetection && (
        <CardCorrectionModal
          isOpen={!!selectedDetection}
          onClose={() => setSelectedDetection(null)}
          detection={selectedDetection}
          onSave={(cardId) => handleCorrection(cardId)}
        />
      )}
    </>
  );
}`} />
      </ContentSection>

      <ContentSection title="Design Principles">
        <div className="modal-features-grid">
          <div className="feature-card">
            <h3>Composition</h3>
            <p>
              Build specialized modals by composing BaseModal with domain-specific content. 
              Each modal serves one clear purpose.
            </p>
          </div>
          
          <div className="feature-card">
            <h3>BEM Naming</h3>
            <p>
              CSS follows strict BEM conventions: <code>.card-detail-modal__header</code>, 
              <code>.card-correction-modal__layout</code> for predictable styling.
            </p>
          </div>
          
          <div className="feature-card">
            <h3>SSR Safe</h3>
            <p>
              All modals include client-side mounting guards to prevent hydration mismatches 
              in Next.js SSR.
            </p>
          </div>
          
          <div className="feature-card">
            <h3>Accessible</h3>
            <p>
              Keyboard navigation (ESC to close), backdrop clicks, focus trapping, 
              and proper ARIA attributes included.
            </p>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="Implementation Notes">
        <ul className="implementation-list">
          <li>
            <strong>BaseModal Foundation:</strong> All specialized modals wrap BaseModal 
            for consistent backdrop, container, and close behavior.
          </li>
          <li>
            <strong>Separate CSS Files:</strong> Each modal has its own CSS file 
            (<code>base-modal.css</code>, <code>card-detail-modal.css</code>, etc.) to avoid conflicts.
          </li>
          <li>
            <strong>TypeScript Interfaces:</strong> Strongly typed props ensure correct usage 
            and catch errors at compile time.
          </li>
          <li>
            <strong>Mobile Optimized:</strong> Responsive layouts transform to full-screen 
            on mobile with touch-optimized spacing.
          </li>
        </ul>
      </ContentSection>

      <style jsx>{`
        .modal-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--sds-size-space-400);
          margin-top: var(--sds-size-space-400);
        }
        
        .feature-card {
          padding: var(--sds-size-space-400);
          background: var(--surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
        }
        
        .feature-card h3 {
          margin: 0 0 var(--sds-size-space-200) 0;
          font-size: var(--font-size-150);
          color: var(--text-primary);
        }
        
        .feature-card p {
          margin: 0;
          font-size: var(--font-size-100);
          color: var(--text-secondary);
          line-height: 1.6;
        }
        
        .implementation-list {
          list-style: none;
          padding: 0;
          margin: var(--sds-size-space-400) 0 0 0;
        }
        
        .implementation-list li {
          padding: var(--sds-size-space-300) 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        
        .implementation-list li:last-child {
          border-bottom: none;
        }
        
        .implementation-list strong {
          color: var(--text-primary);
        }
      `}</style>
    </PageLayout>
  );
} 