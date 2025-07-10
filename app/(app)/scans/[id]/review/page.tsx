'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/browser';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ReviewPageData {
  scan: {
    id: string;
    scan_title: string;
    processing_status: string;
    created_at: string;
    results?: {
      total_cards_detected: number;
      summary_image_path?: string;
      detected_card_paths?: string[];
      image_public_url?: string;
      identified_cards?: Array<{
        crop_path: string;
        card_db_id: string | null;
        confidence: number;
        detection_confidence: number;
        estimated_value: number;
        identification_data: {
          name: string;
          set_name: string;
          rarity: string;
          estimated_value: number;
          image_url: string;
        };
      }>;
      cards_identified_successfully?: number;
    };
  };
}

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function ReviewPage() {
  const params = useParams();
  const scanId = params?.id as string;
  const [data, setData] = useState<ReviewPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [addingToCollection, setAddingToCollection] = useState(false);

  useEffect(() => {
    if (!scanId) return;
    
    const fetchReviewData = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Get scan details from scan_uploads table
        const { data: scan, error: scanError } = await supabase
          .from('scan_uploads')
          .select('*')
          .eq('id', scanId)
          .single();
          
        if (scanError) throw scanError;
        
        setData({ scan });
        
      } catch (err: any) {
        console.error('Error fetching review data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchReviewData();
    
    // Set up polling for processing scans
    const pollInterval = setInterval(async () => {
      if (!data) return;
      
      const currentStatus = data.scan.processing_status;
      
      // Only poll if scan is still processing
      if (currentStatus === 'pending' || currentStatus === 'processing') {
        console.log('🔄 Checking scan status...');
        await fetchReviewData();
      } else {
        // Stop polling if completed or failed
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds
    
    // Cleanup
    return () => clearInterval(pollInterval);
  }, [scanId, data?.scan.processing_status]);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: scan, error: scanError } = await supabase
        .from('scan_uploads')
        .select('*')
        .eq('id', scanId)
        .single();
        
      if (scanError) throw scanError;
      setData({ scan });
      
      if (scan.processing_status === 'completed') {
        toast.success('Scan processing completed! 🎉');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelect = (cropPath: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cropPath)) {
      newSelected.delete(cropPath);
    } else {
      newSelected.add(cropPath);
    }
    setSelectedCards(newSelected);
  };

  const handleSelectAll = () => {
    const identifiedCards = data?.scan.results?.identified_cards || [];
    const allIdentifiedPaths = identifiedCards
      .filter(card => card.card_db_id) // Only select successfully identified cards
      .map(card => card.crop_path);
    setSelectedCards(new Set(allIdentifiedPaths));
  };

  const handleAddToCollection = async () => {
    if (selectedCards.size === 0) {
      toast.error('Please select cards to add to your collection');
      return;
    }

    setAddingToCollection(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        toast.error('You must be logged in to add cards to collection');
        return;
      }

      const identifiedCards = data?.scan.results?.identified_cards || [];
      const cardsToAdd = identifiedCards
        .filter(card => selectedCards.has(card.crop_path) && card.card_db_id)
        .map(card => {
          // The base URL of the originally scanned image
          const baseUrl = data?.scan.results?.image_public_url?.substring(0, data.scan.results.image_public_url.lastIndexOf('/'));
          
          return {
            cardId: card.card_db_id,
            condition: 'unknown',
            quantity: 1,
            cropImageUrl: baseUrl ? `${baseUrl}/${card.crop_path}` : null
          };
        });

      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cards: cardsToAdd })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add cards to collection');
      }

      const result = await response.json();
      toast.success(`🎉 Added ${result.summary.successful} cards to your collection!`);
      setSelectedCards(new Set()); // Clear selection

    } catch (err: any) {
      toast.error(`Failed to add cards: ${err.message}`);
    } finally {
      setAddingToCollection(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading Review..." description="Loading scan review data...">
        <div className="review-loading">Loading your card detection results...</div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout title="Review Error" description="Error loading review data">
        <div className="review-error">
          Error loading review data: {error}
          <Link href={`/scans/${scanId}`} className="back-link">← Back to Scan</Link>
        </div>
      </PageLayout>
    );
  }

  const { scan } = data;
  const results = scan.results;

  return (
    <PageLayout
      title={`Review: ${scan.scan_title}`}
      description="Review your detected cards"
    >
      {/* Scan Status */}
      <ContentSection title="Scan Status" headingLevel={2}>
        <div className="scan-status">
          <div className="status-info">
            <span className={`status-badge status-${scan.processing_status}`}>
              {scan.processing_status}
              {(scan.processing_status === 'pending' || scan.processing_status === 'processing') && (
                <span className="spinner">⏳</span>
              )}
            </span>
            <span className="scan-date">
              Scanned: {new Date(scan.created_at).toLocaleString()}
            </span>
            {(scan.processing_status === 'pending' || scan.processing_status === 'processing') && (
              <span className="polling-indicator">
                🔄 Checking for updates every 3 seconds...
              </span>
            )}
          </div>
          
          {results?.summary_image_path && (
            <div className="summary-image">
              <img
                src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/scans/${results.summary_image_path}`}
                alt="Scan Summary"
                className="summary-img"
              />
            </div>
          )}
        </div>
      </ContentSection>

      {/* Detection Results */}
      <ContentSection title="Card Detections & Identification" headingLevel={2}>
        <div className="detection-stats">
          <p><strong>Total Cards Detected:</strong> {results?.total_cards_detected || 0}</p>
          <p><strong>Successfully Identified:</strong> {results?.cards_identified_successfully || 0}</p>
          <p><strong>Status:</strong> {scan.processing_status}</p>
        </div>

        {/* Bulk Actions */}
        {results?.identified_cards && results.identified_cards.length > 0 && (
          <div className="bulk-actions">
            <Button variant="secondary" onClick={handleSelectAll}>
              Select All Identified Cards ({results.identified_cards.filter(c => c.card_db_id).length})
            </Button>
            {selectedCards.size > 0 && (
              <Button 
                variant="primary" 
                onClick={handleAddToCollection}
                disabled={addingToCollection}
              >
                {addingToCollection ? 'Adding...' : `🏆 Add ${selectedCards.size} Cards to Collection`}
              </Button>
            )}
          </div>
        )}

        {results?.identified_cards && results.identified_cards.length > 0 ? (
          <div className="detections-grid">
            {results.identified_cards.map((card, index) => (
              <div 
                key={card.crop_path} 
                className={`detection-card ${selectedCards.has(card.crop_path) ? 'selected' : ''} ${!card.card_db_id ? 'unidentified' : ''}`}
                onClick={() => card.card_db_id && handleCardSelect(card.crop_path)}
              >
                <div className="detection-image">
                  <Image
                    src={card.card_db_id && card.identification_data?.image_url ? 
                      card.identification_data.image_url : 
                      `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/scans/${card.crop_path}`
                    }
                    alt={card.identification_data?.name || `Detected Card ${index + 1}`}
                    width={200}
                    height={280}
                    className="card-image"
                  />
                  
                  {/* Confidence Indicators */}
                  <div className="confidence-badges">
                    <div className="detection-confidence">
                      🎯 {Math.round(card.detection_confidence * 100)}%
                    </div>
                    {card.card_db_id && (
                      <div 
                        className={`id-confidence ${card.confidence >= 0.8 ? 'high' : card.confidence >= 0.6 ? 'medium' : 'low'}`}
                      >
                        🃏 {Math.round(card.confidence * 100)}%
                      </div>
                    )}
                  </div>

                  {/* Original Crop View Button */}
                  {card.card_db_id && card.identification_data?.image_url && (
                    <button 
                      className="view-original-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/scans/${card.crop_path}`, '_blank');
                      }}
                      title="View original detected crop"
                    >
                      📷 Original
                    </button>
                  )}

                  {/* Selection Checkbox */}
                  {card.card_db_id && (
                    <div className="selection-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedCards.has(card.crop_path)}
                        onChange={() => handleCardSelect(card.crop_path)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>

                <div className="detection-details">
                  {card.card_db_id ? (
                    <>
                      <h4 className="card-name">{card.identification_data.name}</h4>
                      <p className="card-set">{card.identification_data.set_name}</p>
                      <p className="card-rarity">{card.identification_data.rarity}</p>
                      {card.estimated_value > 0 && (
                        <p className="card-price">${card.estimated_value.toFixed(2)}</p>
                      )}
                      <div className="status-indicator success">
                        ✅ Identified
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="card-name">Unknown Card</h4>
                      <p className="card-error">Could not identify this card</p>
                      <div className="status-indicator error">
                        ❌ Unidentified
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : results?.detected_card_paths && results.detected_card_paths.length > 0 ? (
          <div className="legacy-detections">
            <p>⚠️ Cards detected but identification data not available. Please reprocess this scan.</p>
          </div>
        ) : (
          <div className="no-detections">
            {scan.processing_status === 'completed' ? 
              'No cards were detected in this scan.' : 
              'Processing in progress or failed. No detection results available.'}
          </div>
        )}
      </ContentSection>

      {/* Navigation */}
      <ContentSection title="Actions" headingLevel={2}>
        <div className="review-actions">
          <Button 
            variant="secondary" 
            onClick={handleManualRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Status'}
          </Button>
          
          <Link href={`/scans/${scanId}`} className="back-button">
            ← Back to Scan Details
          </Link>
          
          <Link href="/scans" className="scans-button">
            View All Scans
          </Link>
        </div>
      </ContentSection>

      <style jsx>{`
        .review-loading, .review-error {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .scan-status {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }

        .status-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-completed { background: var(--status-success); color: white; }
        .status-processing { background: var(--status-info); color: white; }
        .status-pending { background: var(--status-warning); color: white; }
        .status-failed { background: var(--status-error); color: white; }
        
        .spinner {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .polling-indicator {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .summary-image {
          flex: 1;
          max-width: 400px;
        }

        .summary-img {
          width: 100%;
          height: auto;
          border-radius: 0.5rem;
          border: 1px solid var(--border-subtle);
        }

        .detection-stats {
          background: var(--surface-background);
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          display: flex;
          gap: 2rem;
        }

        .bulk-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 0.5rem;
          align-items: center;
        }

        .detections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .detection-card {
          background: var(--surface-background);
          border: 1px solid var(--border-subtle);
          border-radius: 0.75rem;
          padding: 1rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .detection-card:hover {
          border-color: var(--border-focus);
          transform: translateY(-2px);
        }

        .detection-card.selected {
          border-color: var(--primary);
          background: var(--primary-background);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .detection-card.unidentified {
          opacity: 0.7;
          cursor: default;
        }

        .detection-card.unidentified:hover {
          transform: none;
        }

        .detection-image {
          position: relative;
          margin-bottom: 1rem;
        }

        .card-image {
          border-radius: 0.5rem;
          object-fit: cover;
        }

        .view-original-btn {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .detection-card:hover .view-original-btn {
          opacity: 1;
        }

        .view-original-btn:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .crop-image {
          width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }

        .confidence-badges {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detection-confidence {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .id-confidence {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        .id-confidence.high { background: rgba(34, 197, 94, 0.9); }
        .id-confidence.medium { background: rgba(251, 191, 36, 0.9); }
        .id-confidence.low { background: rgba(239, 68, 68, 0.9); }

        .selection-checkbox {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
        }

        .selection-checkbox input[type="checkbox"] {
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;
        }

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
        }

        .detection-details {
          space-y: 0.5rem;
        }

        .card-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .card-set, .card-rarity {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.25rem 0;
        }

        .card-price {
          font-weight: 600;
          color: var(--status-success);
          margin: 0.25rem 0;
        }

        .card-error {
          color: var(--text-tertiary);
          font-style: italic;
          margin: 0.25rem 0;
        }

        .status-indicator {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 0.5rem;
          text-align: center;
        }

        .status-indicator.success {
          background: var(--status-success);
          color: white;
        }

        .status-indicator.error {
          background: var(--status-error);
          color: white;
        }

        .legacy-detections {
          background: var(--status-warning);
          color: white;
          padding: 1rem;
          border-radius: 0.5rem;
          text-align: center;
        }

        .ownership-controls {
          margin: 1rem 0;
        }

        .ownership-controls label {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .condition-select {
          padding: 0.5rem;
          border: 1px solid var(--border-subtle);
          border-radius: 0.25rem;
          background: var(--surface-background);
        }

        .detection-actions {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }

        .review-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .back-button, .scans-button {
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 500;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-subtle);
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .back-button:hover, .scans-button:hover {
          color: var(--text-primary);
          border-color: var(--border-focus);
        }

        .back-link {
          color: var(--text-secondary);
          text-decoration: none;
        }

        .back-link:hover {
          color: var(--text-primary);
        }
      `}</style>
    </PageLayout>
  );
} 