"use client";

import { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import CodeBlock from '../components/CodeBlock';
import { Modal, CardInfoModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function ModalPage() {
  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  
  const exampleCard = {
    name: "Charizard ex",
    imageUrl: "/ui-playground-pk-img/bulbasaur.jpg",
    number: "185",
    setCode: "sv5",
    setName: "Temporal Forces",
    description: "A powerful Fire-type Pokémon known for its fierce battles and loyal nature. This special edition card features holographic artwork."
  };

  return (
    <PageLayout
      title="Modal"
      description="Modal dialogs for focused user interactions and content display"
    >
      <ContentSection title="Overview">
        <p>
          Our modal implementation follows shadcn/ui patterns using Radix UI primitives. 
          The modal system is designed to provide a focused experience for viewing detailed 
          information or completing complex interactions.
        </p>
      </ContentSection>

      <ContentSection title="Basic Modal">
        <ExampleShowcase>
          <Button onClick={() => setBasicModalOpen(true)}>
            Open Basic Modal
          </Button>
          
          <Modal
            isOpen={basicModalOpen}
            onClose={() => setBasicModalOpen(false)}
          >
            <div style={{ padding: 'var(--sds-size-space-600)' }}>
              <h2 style={{ marginBottom: 'var(--sds-size-space-400)' }}>
                Basic Modal Example
              </h2>
              <p style={{ marginBottom: 'var(--sds-size-space-400)', color: 'var(--text-secondary)' }}>
                This is a simple modal with custom content. You can put any content here.
              </p>
              <Button onClick={() => setBasicModalOpen(false)}>
                Close Modal
              </Button>
            </div>
          </Modal>
        </ExampleShowcase>

        <CodeBlock language="tsx" code={`import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

function Example() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <div style={{ padding: 'var(--sds-size-space-600)' }}>
          <h2>Modal Content</h2>
          <p>Your content goes here</p>
        </div>
      </Modal>
    </>
  );
}`} />
      </ContentSection>

      <ContentSection title="Card Info Modal">
        <p style={{ marginBottom: 'var(--sds-size-space-400)' }}>
          The CardInfoModal is a specialized modal designed for displaying detailed card information. 
          It features a large image on the left and detailed information on the right, optimized for 
          the trading card use case.
        </p>
        
        <ExampleShowcase>
          <Button onClick={() => setCardModalOpen(true)}>
            View Card Details
          </Button>
          
          <CardInfoModal
            isOpen={cardModalOpen}
            onClose={() => setCardModalOpen(false)}
            card={exampleCard}
          />
        </ExampleShowcase>

        <CodeBlock language="tsx" code={`import { CardInfoModal } from '@/components/ui/Modal';

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
        <CardInfoModal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          card={selectedCard}
        />
      )}
    </>
  );
}`} />
      </ContentSection>

      <ContentSection title="Modal Features">
        <div className="modal-features-grid">
          <div className="feature-card">
            <h3>Large Display Area</h3>
            <p>
              The modal takes up 90% of viewport height and up to 1200px width, 
              providing ample space for detailed content.
            </p>
          </div>
          
          <div className="feature-card">
            <h3>Accessibility</h3>
            <p>
              Built-in keyboard navigation, focus management, and screen reader support. 
              Press ESC to close, click outside to dismiss.
            </p>
          </div>
          
          <div className="feature-card">
            <h3>Mobile Responsive</h3>
            <p>
              On mobile devices, the modal becomes full-screen with optimized layouts 
              for touch interactions.
            </p>
          </div>
          
          <div className="feature-card">
            <h3>Smooth Animations</h3>
            <p>
              Fade-in backdrop and slide-in content animations provide a polished, 
              professional feel.
            </p>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="Implementation Notes">
        <ul className="implementation-list">
          <li>
            <strong>No Portal Required:</strong> Unlike traditional React portal-based modals, 
            our implementation renders inline with proper z-index management.
          </li>
          <li>
            <strong>Body Scroll Lock:</strong> When the modal opens, body scrolling is disabled 
            to prevent background interaction.
          </li>
          <li>
            <strong>Click Outside:</strong> Clicking the backdrop closes the modal, following 
            standard UX patterns.
          </li>
          <li>
            <strong>Custom Styling:</strong> The modal accepts a className prop for custom 
            styling needs.
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