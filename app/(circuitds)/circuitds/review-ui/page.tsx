import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

export default function ReviewUIPage() {
  const detectionCardExample = `
<div className="detection-card">
  <div className="detection-image">
    <img src="/path/to/card.jpg" alt="Card" className="crop-image" />
    <div className="confidence-badge">94.2%</div>
    <div className="tile-badge">A1</div>
  </div>
  <div className="detection-details">
    <h4 className="card-name">Charizard ex</h4>
    <p className="card-set">Scarlet & Violet</p>
    <p className="card-rarity">Double Rare</p>
    <p className="card-price">$45.00</p>
  </div>
</div>`;

  const conditionSelectExample = `
<div className="ownership-controls">
  <label>
    Condition:
    <select className="condition-select" value="near_mint">
      <option value="mint">Mint</option>
      <option value="near_mint">Near Mint</option>
      <option value="lightly_played">Lightly Played</option>
      <option value="moderately_played">Moderately Played</option>
      <option value="heavily_played">Heavily Played</option>
      <option value="damaged">Damaged</option>
    </select>
  </label>
</div>`;

  const badgeSystemExample = `
/* Confidence Badge - Shows ML detection confidence */
.confidence-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Tile Badge - Shows 3x3 grid position */
.tile-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}`;

  return (
    <PageLayout
      title="Review UI Components"
      description="UI components for scan review and card management workflows"
    >
      <ContentSection title="Overview" headingLevel={2}>
        <p>
          The Review UI system provides components for reviewing ML detection results, 
          managing card ownership, and handling user corrections. These components are 
          specifically designed for the card collection management workflow.
        </p>
        
        <div style={{
          background: 'var(--surface-preview-background)',
          padding: 'var(--sds-size-space-400)',
          borderRadius: 'var(--sds-size-radius-100)',
          margin: 'var(--sds-size-space-300) 0'
        }}>
          <h4>Key Features:</h4>
          <ul>
            <li><strong>Detection Cards:</strong> Visual display of ML results with confidence scores</li>
            <li><strong>Badge System:</strong> Confidence percentages and tile position indicators</li>
            <li><strong>Condition Controls:</strong> TCG condition grading interface</li>
            <li><strong>Ownership Tracking:</strong> User-specific card collection management</li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="Detection Card Component" headingLevel={2}>
        <p>
          The core component for displaying individual card detection results. Combines 
          image preview, confidence metrics, and enrichment data in a unified card layout.
        </p>

        <ExampleShowcase
          title="Basic Detection Card"
          description="Standard detection card with confidence badge and tile indicator"
          code={detectionCardExample}
          preview={
            <div style={{ maxWidth: '250px' }}>
              <div style={{
                background: 'var(--surface-background)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.75rem',
                padding: '1rem'
              }}>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '140px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}>
                    Card Image
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    94.2%
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    background: 'rgba(59, 130, 246, 0.9)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    A1
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                    Charizard ex
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                    Scarlet & Violet
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                    Double Rare
                  </p>
                  <p style={{ fontWeight: 600, color: 'var(--status-success)', margin: '0.25rem 0' }}>
                    $45.00
                  </p>
                </div>
              </div>
            </div>
          }
        />
      </ContentSection>

      <ContentSection title="Badge System" headingLevel={2}>
        <p>
          Overlay badges provide quick visual feedback about detection quality and spatial context.
        </p>

        <ExampleShowcase
          title="Badge Styling"
          description="CSS for confidence and tile position badges"
          code={badgeSystemExample}
          preview={
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                96.7%
              </div>
              <div style={{
                background: 'rgba(59, 130, 246, 0.9)',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                B2
              </div>
            </div>
          }
        />

        <div style={{
          background: 'var(--surface-preview-background)',
          padding: 'var(--sds-size-space-300)',
          borderRadius: 'var(--sds-size-radius-100)',
          margin: 'var(--sds-size-space-300) 0'
        }}>
          <h4>Badge Types:</h4>
          <ul>
            <li><strong>Confidence Badge:</strong> Shows ML detection confidence (0-100%)</li>
            <li><strong>Tile Badge:</strong> Shows 3x3 grid position (A1-C3)</li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="Condition Controls" headingLevel={2}>
        <p>
          Specialized form controls for TCG card condition grading, following industry standards.
        </p>

        <ExampleShowcase
          title="Condition Select"
          description="Dropdown for standard TCG condition grades"
          code={conditionSelectExample}
          preview={
            <div style={{ maxWidth: '200px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Condition:
                <select style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '0.25rem',
                  background: 'var(--surface-background)'
                }}>
                  <option>Near Mint</option>
                  <option>Mint</option>
                  <option>Lightly Played</option>
                  <option>Moderately Played</option>
                  <option>Heavily Played</option>
                  <option>Damaged</option>
                </select>
              </label>
            </div>
          }
        />
      </ContentSection>

      <ContentSection title="Usage Guidelines" headingLevel={2}>
        <div style={{
          background: 'var(--surface-preview-background)',
          padding: 'var(--sds-size-space-400)',
          borderRadius: 'var(--sds-size-radius-100)'
        }}>
          <h4>Best Practices:</h4>
          <ul>
            <li><strong>Detection Cards:</strong> Always include confidence badges for ML results</li>
            <li><strong>Grid Layout:</strong> Use consistent spacing for detection card grids</li>
            <li><strong>Condition Controls:</strong> Provide immediate visual feedback on changes</li>
            <li><strong>Error States:</strong> Show clear indicators for unidentified cards</li>
            <li><strong>Loading States:</strong> Use skeleton loaders during enrichment</li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="Technical Implementation" headingLevel={2}>
        <p>
          The review UI components integrate with the normalized card ownership architecture, 
          reading from <code>card_detections</code> and <code>user_cards</code> tables.
        </p>

        <div style={{
          background: 'var(--surface-code-background)',
          padding: 'var(--sds-size-space-400)',
          borderRadius: 'var(--sds-size-radius-100)',
          margin: 'var(--sds-size-space-300) 0'
        }}>
          <h4>Key Data Flow:</h4>
          <ol>
            <li>ML pipeline creates <code>card_detections</code> records</li>
            <li>Enrichment process links to <code>cards</code> catalog</li>
            <li>User ownership recorded in <code>user_cards</code></li>
            <li>Review UI displays unified view with correction capabilities</li>
          </ol>
        </div>
      </ContentSection>
    </PageLayout>
  );
} 