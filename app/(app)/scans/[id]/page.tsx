'use client';

import React, { useState } from 'react';
import { useJob } from '@/hooks/useJobs';
import Image from 'next/image';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';

interface BinderPageProps {
  params: Promise<{ id: string }> | { id: string };
}

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function BinderDetailPage({ params }: BinderPageProps) {
  const { id } = (React.use(params as any) as { id: string });
  const { data: job, isLoading, isError, error } = useJob(id);
  
  // NEW: State for manual corrections
  const [correctingCard, setCorrectingCard] = useState<number | null>(null);
  const [manualCardName, setManualCardName] = useState('');
  
  // NEW: Layout toggle
  const [useGridLayout, setUseGridLayout] = useState(true);
  
  // NEW: Manual correction handlers
  const handleFixCard = (cardIndex: number) => {
    setCorrectingCard(cardIndex);
    setManualCardName('');
  };
  
  const handleSaveCorrection = async (cardIndex: number) => {
    // TODO: Send correction to backend
    console.log(`Correcting card ${cardIndex} to: ${manualCardName}`);
    
    // For now, just close the correction UI
    setCorrectingCard(null);
    setManualCardName('');
    
    // In production, this would:
    // 1. Update the card identification in the database
    // 2. Feed the correction back to the enrichment system
    // 3. Refresh the job data
  };
  
  const handleCancelCorrection = () => {
    setCorrectingCard(null);
    setManualCardName('');
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e'; // green-500
      case 'processing': return '#3b82f6'; // blue-500
      case 'pending': return '#f97316'; // orange-500
      case 'failed': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  if (isLoading) {
    // Placeholder UI: Loading state
    return (
        <PageLayout title="Loading Scan..." description="Fetching the details of your processed scan.">
            <div className="placeholder">Loading...</div>
        </PageLayout>
    );
  }

  if (isError || !job) {
    // Placeholder UI: Error state
    return (
        <PageLayout title="Error" description="Could not load scan details.">
            <div className="placeholder error">
                <p>Couldn't load scan details.</p>
                <p>{(error as Error)?.message || 'Job not found.'}</p>
            </div>
        </PageLayout>
    );
  }

  return (
    <PageLayout
      title={job.binder_title || 'Scan Details'}
      description={`Review the results for scan processed on ${new Date(job.created_at).toLocaleDateString()}`}
    >
      <ContentSection title="Processing Summary" headingLevel={2}>
        <div className="summary-card">
            <div className="status-chip" style={{ backgroundColor: getStatusChipColor(job.processing_status) }}>
                {job.processing_status}
            </div>
            <p><strong>Total Cards Detected:</strong> {job.results?.total_cards_detected ?? 0}</p>
            {job.results?.enrichment_stats && (
              <>
                <p><strong>Cards Identified:</strong> {job.results.enrichment_stats.successful}/{job.results.total_cards_detected} ({((job.results.enrichment_stats.successful / job.results.total_cards_detected) * 100).toFixed(1)}%)</p>
                <p><strong>Processing Time:</strong> {job.results.enrichment_stats.total_time_ms?.toFixed(1)}ms total</p>
              </>
            )}
            {job.results?.summary_image_path && (
                <img
                    src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/binders/${job.results.summary_image_path}`}
                    alt={`Summary view of ${job.binder_title}`}
                    className="summary-image"
                />
            )}
        </div>
      </ContentSection>

      <ContentSection title="Detected Cards" headingLevel={2}>
        {job.processing_status === 'completed' ? (
          <>
            <div className="cards-header">
              <div className="cards-header-content">
                <p className="cards-help-text">
                  Cards are positioned to match their location in your scan. 
                  Click "Fix" if any identification looks incorrect.
                </p>
                <button 
                  className="layout-toggle"
                  onClick={() => setUseGridLayout(!useGridLayout)}
                >
                  {useGridLayout ? '📍 Spatial View' : '🔲 Grid View'}
                </button>
              </div>
            </div>
            
            <div className={useGridLayout ? "grid-card-container" : "spatial-card-container"}>
              {job.results?.enriched_cards && job.results.enriched_cards.length > 0 ? (
                job.results.enriched_cards.map((enrichedCard: any, index: number) => {
                  const cardIndex = enrichedCard.card_index || index;
                  const bbox = enrichedCard.bounding_box;
                  
                  // Get actual image dimensions (with fallback for older jobs)
                  const imageWidth = job.results?.original_image_width || 1000;
                  const imageHeight = job.results?.original_image_height || 1000;
                  
                  // Calculate position as percentage of container using ACTUAL dimensions
                  const leftPercent = Math.max(0, Math.min(95, (bbox[0] / imageWidth) * 100));
                  const topPercent = Math.max(0, Math.min(95, (bbox[1] / imageHeight) * 100));
                  const widthPercent = Math.max(3, Math.min(25, ((bbox[2] - bbox[0]) / imageWidth) * 100));
                  const heightPercent = Math.max(3, Math.min(25, ((bbox[3] - bbox[1]) / imageHeight) * 100));
                  
                  return (
                    <div 
                      key={cardIndex} 
                      className={useGridLayout ? "grid-card-wrapper" : "spatial-card-wrapper"}
                      style={useGridLayout ? {} : {
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`
                      }}
                    >
                      <div className={`enriched-card-slot ${enrichedCard.enrichment_success ? 'identified' : 'unknown'}`}>
                        <Image
                          src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/binders/${enrichedCard.cropped_image_path}`}
                          alt={enrichedCard.card_name || `Detected card ${cardIndex + 1}`}
                          width={240}
                          height={336}
                          className="card-image"
                        />
                        
                        {/* Manual correction overlay */}
                        {correctingCard === cardIndex && (
                          <div className="correction-overlay">
                            <input
                              type="text"
                              value={manualCardName}
                              onChange={(e) => setManualCardName(e.target.value)}
                              placeholder="Enter card name..."
                              className="correction-input"
                              autoFocus
                            />
                            <div className="correction-buttons">
                              <button 
                                onClick={() => handleSaveCorrection(cardIndex)}
                                className="save-button"
                                disabled={!manualCardName.trim()}
                              >
                                ✓ Save
                              </button>
                              <button 
                                onClick={handleCancelCorrection}
                                className="cancel-button"
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="card-info">
                          <h4 className="card-name">
                            {enrichedCard.enrichment_success ? enrichedCard.card_name : 'Unknown Card'}
                          </h4>
                          {enrichedCard.enrichment_success && (
                            <>
                              <p className="card-set">{enrichedCard.set_name} ({enrichedCard.set_code})</p>
                              <p className="card-details">
                                {enrichedCard.rarity} • {enrichedCard.card_number}
                              </p>
                              {enrichedCard.market_price && (
                                <p className="card-price">${enrichedCard.market_price}</p>
                              )}
                              <p className="confidence">
                                {enrichedCard.identification_confidence?.toFixed(1)}% confidence
                              </p>
                            </>
                          )}
                          {!enrichedCard.enrichment_success && (
                            <>
                              <p className="error-text">{enrichedCard.error_message || 'Not in database'}</p>
                              <button 
                                className="fix-button"
                                onClick={() => handleFixCard(cardIndex)}
                                disabled={correctingCard === cardIndex}
                              >
                                🔧 Fix This
                              </button>
                            </>
                          )}
                          
                          {/* Manual correction only for identified cards that might be wrong */}
                          {enrichedCard.enrichment_success && (
                            <button 
                              className="manual-fix-button" 
                              title="Correct this identification"
                              onClick={() => handleFixCard(cardIndex)}
                              disabled={correctingCard === cardIndex}
                            >
                              ⚙️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fallback to grid layout for legacy detections
                <div className="fallback-grid">
                  {job.results?.detected_card_paths?.map((path: string, index: number) => (
                    <div key={path} className="card-slot">
                      <Image
                        src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/binders/${path}`}
                        alt={`Detected card ${index + 1}`}
                        width={240}
                        height={336}
                        className="card-image"
                      />
                      <div className="card-info">
                        <h4 className="card-name">Unknown Card</h4>
                        <p className="card-details">Legacy detection</p>
                        <button 
                          className="fix-button"
                          onClick={() => handleFixCard(index)}
                        >
                          🔧 Fix This
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p>Individual card results will be shown here once processing is complete.</p>
        )}
      </ContentSection>
      
      <style jsx>{`
        .placeholder { padding: 2rem; text-align: center; }
        .error { color: var(--color-error-600); }
        .summary-card { 
          padding: 1rem; 
          border: 1px solid var(--border-subtle); 
          border-radius: var(--sds-size-radius-100);
          max-width: 100%;
          overflow: hidden;
        }
        .summary-image { 
          max-width: 100%;
          width: auto;
          height: auto;
          max-height: 600px;
          margin-top: 1rem; 
          border-radius: var(--sds-size-radius-100);
          border: 1px solid var(--border-subtle);
          display: block;
        }
        .status-chip { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; color: white; margin-bottom: 1rem; }
        
        /* NEW: UI Mapping Styles */
        .cards-header {
          margin-bottom: 1rem;
          padding: 0;
          background: var(--color-blue-50);
          border: 1px solid var(--color-blue-200);
          border-radius: var(--sds-size-radius-100);
        }
        .cards-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .cards-help-text {
          margin: 0;
          color: var(--text-tertiary);
          font-size: 0.875rem;
          flex: 1;
        }
        .layout-toggle {
          background: var(--color-primary-500);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: var(--sds-size-radius-100);
          font-size: 0.75rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .layout-toggle:hover {
          background: var(--color-primary-600);
        }
        
        .spatial-card-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3; /* Typical binder page ratio */
          background: var(--color-gray-50);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-100);
          overflow: hidden;
        }
        
        .spatial-card-wrapper {
          min-width: 60px;
          min-height: 80px;
        }
        
        .grid-card-container { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); 
          gap: 1rem; 
          width: 100%;
        }
        
        .grid-card-wrapper {
          /* No special positioning - let CSS Grid handle it */
        }
        
        .fallback-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); 
          gap: 1rem; 
        }
        
        .card-slot, .enriched-card-slot { 
          border: 1px solid var(--border-default); 
          border-radius: var(--sds-size-radius-100); 
          padding: 0.5rem; 
          background: var(--surface-background); 
          position: relative;
        }
        
        .enriched-card-slot.identified {
          border: 2px solid var(--color-success-300);
          background: var(--color-success-50);
        }
        
        .enriched-card-slot.unknown {
          border: 2px solid var(--color-warning-300);
          background: var(--color-warning-50);
        }
        
        .card-image { width: 100%; height: auto; border-radius: var(--sds-size-radius-100); }
        .card-info { margin-top: 0.5rem; }
        .card-name { 
          font-size: 1rem; 
          font-weight: 600; 
          margin: 0 0 0.25rem 0; 
          color: var(--color-primary-700);
        }
        .card-set { 
          font-size: 0.875rem; 
          color: var(--color-gray-600); 
          margin: 0 0 0.25rem 0; 
        }
        .card-details { 
          font-size: 0.75rem; 
          color: var(--color-gray-500); 
          margin: 0 0 0.25rem 0; 
        }
        .card-price { 
          font-size: 0.875rem; 
          font-weight: 600; 
          color: var(--color-success-600); 
          margin: 0 0 0.25rem 0; 
        }
        .confidence { 
          font-size: 0.75rem; 
          color: var(--color-primary-600); 
          margin: 0 0 0.5rem 0; 
        }
        .error-text { 
          font-size: 0.75rem; 
          color: var(--color-error-600); 
          margin: 0 0 0.5rem 0; 
        }
        
        /* NEW: Manual Correction Buttons */
        .fix-button {
          background: var(--color-warning-500);
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: var(--sds-size-radius-100);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          margin-bottom: 0.25rem;
        }
        .fix-button:hover {
          background: var(--color-warning-600);
        }
        
        .manual-fix-button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .manual-fix-button:hover {
          background: rgba(0, 0, 0, 0.9);
        }
        
        /* NEW: Manual Correction Overlay */
        .correction-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          border-radius: var(--sds-size-radius-100);
          z-index: 10;
        }
        
        .correction-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-100);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        
        .correction-buttons {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }
        
        .save-button {
          flex: 1;
          background: var(--color-success-500);
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: var(--sds-size-radius-100);
          font-size: 0.75rem;
          cursor: pointer;
        }
        .save-button:disabled {
          background: var(--color-gray-400);
          cursor: not-allowed;
        }
        
        .cancel-button {
          flex: 1;
          background: var(--color-error-500);
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: var(--sds-size-radius-100);
          font-size: 0.75rem;
          cursor: pointer;
        }
      `}</style>
    </PageLayout>
  );
} 