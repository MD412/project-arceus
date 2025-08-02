'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSupabaseClient } from '@/lib/supabase/browser';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import { Button } from '@/components/ui/Button';
import { TradingCard } from '@/components/ui/TradingCard';
import { CardSearchInput } from '@/components/ui/CardSearchInput';
import { Modal } from '@/components/ui/Modal';
import { ScanReviewLayout } from '@/components/ui/ScanReviewLayout';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { CheckCircle, ArrowLeft } from '@phosphor-icons/react';

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dipwodpxxjwkwflimgsf.supabase.co';

// Cache for Pokemon TCG API name resolutions
const nameCache = new Map<string, string>();

async function resolveCardName(nameOrId: string): Promise<string> {
  // If it's already a proper name (not starting with "Card " and has mixed case), return as-is
  if (!nameOrId || nameOrId === 'Unknown Card') {
    return nameOrId || 'Unknown Card';
  }

  // Check if it looks like an API ID (formats: "xy5-52", "Card swsh1-187", "Card swsh12pt5gg-GG11")
  const apiIdPatterns = [
    /^[a-z0-9]+-[a-z0-9]+$/i,           // Standard format: "xy5-52"
    /^Card [a-z0-9]+-[a-z0-9]+$/i,      // "Card swsh1-187" 
    /^Card [a-z0-9]+[a-z]+-[A-Z0-9]+$/i // "Card swsh12pt5gg-GG11"
  ];
  
  const isApiId = apiIdPatterns.some(pattern => nameOrId.match(pattern));
  if (isApiId) {
    // Check cache first
    if (nameCache.has(nameOrId)) {
      return nameCache.get(nameOrId)!;
    }

    try {
      // Extract the actual API ID (remove "Card " prefix if present)
      const apiId = nameOrId.startsWith('Card ') ? nameOrId.substring(5) : nameOrId;
      
      // Fetch from Pokemon TCG API
      const response = await fetch(`https://api.pokemontcg.io/v2/cards/${apiId}`);
      if (response.ok) {
        const data = await response.json();
        const properName = data.data?.name || nameOrId;
        nameCache.set(nameOrId, properName);
        console.log(`🎯 Resolved "${nameOrId}" -> "${properName}"`);
        return properName;
      } else {
        console.warn(`Failed to resolve ${nameOrId}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn(`Failed to resolve card name for ${nameOrId}:`, error);
    }
  }

  // Return original if resolution fails
  return nameOrId;
}

interface ScanDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function ScanDetailPage({ params }: ScanDetailPageProps) {
  const resolvedParams = React.use(params as Promise<{ id: string }>);
  const scanId = resolvedParams.id;
  const router = useRouter();
  const supabase = getSupabaseClient();
  
  const [scan, setScan] = useState<any>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<any>(null);


  const handleModalClose = useCallback(() => {
    setShowCorrectModal(false);
    setSelectedDetection(null);
  }, []);

  useEffect(() => {
    if (scanId) {
      fetchScanData();
    }
  }, [scanId]);

  // Resolve card names after detections are loaded
  useEffect(() => {
    if (detections.length > 0) {
      resolveCardNames();
    }
  }, [detections]);

  const resolveCardNames = async () => {
    const newResolvedNames = new Map<string, string>();
    
    // Resolve all card names in parallel
    const promises = detections.map(async (detection) => {
      const originalName = detection.cards?.name;
      if (originalName) {
        const resolvedName = await resolveCardName(originalName);
        newResolvedNames.set(detection.id, resolvedName);
      }
    });

    await Promise.all(promises);
    setResolvedNames(newResolvedNames);
  };

  const getDisplayName = (detection: any): string => {
    return resolvedNames.get(detection.id) || detection.cards?.name || 'Unknown Card';
  };

  const fetchScanData = async () => {
    try {
      setLoading(true);
      
      // First try the scan_uploads table (current system)
      const { data: scanUpload, error: uploadError } = await supabase
        .from('scan_uploads')
        .select('*')
        .eq('id', scanId)
        .single();

      if (uploadError && uploadError.code !== 'PGRST116') {
        throw uploadError;
      }

      let scanData = null;
      let actualScanId = scanId;

      if (scanUpload) {
        // Using scan_uploads table
        scanData = {
          id: scanUpload.id,
          title: scanUpload.scan_title,
          status: scanUpload.processing_status,
          created_at: scanUpload.created_at,
          summary_image_path: scanUpload.results?.summary_image_path,
          user_id: scanUpload.user_id
        };
        // Check if there's a linked scan in the scans table
        actualScanId = scanUpload.results?.scan_id || scanId;
      } else {
        // Try the scans table directly
        const { data: scan, error: scanError } = await supabase
          .from('scans')
          .select('*')
          .eq('id', scanId)
          .single();

        if (scanError) throw scanError;
        scanData = scan;
      }

      setScan(scanData);

      // Fetch detections with card data using the actual scan ID
      const { data: detectionsData, error: detectionsError } = await supabase
        .from('card_detections')
        .select(`
          *,
          cards:guess_card_id (
            id,
            name,
            set_code,
            card_number,
            image_url,
            rarity,
            market_price
          )
        `)
        .eq('scan_id', actualScanId)
        .order('created_at', { ascending: true });

      if (detectionsError) {
        console.error('Error fetching detections:', detectionsError);
      }
      
      setDetections(detectionsData || []);
      
    } catch (err: any) {
      console.error('Error fetching scan data:', err);
      setError(err.message || 'Failed to load scan data');
      toast.error('Failed to load scan data');
    } finally {
      setLoading(false);
      }
  };

  const handleCardClick = (detection: any) => {
    setSelectedDetection(detection);
    setShowCorrectModal(true);
  };

  const handleCorrectCard = async (correctedCard: any) => {
    if (!selectedDetection) return;

    try {
      // Update the detection with the correct card
      const { error: updateError } = await supabase
        .from('card_detections')
        .update({ guess_card_id: correctedCard.id })
        .eq('id', selectedDetection.id);

      if (updateError) throw updateError;
      
      // Refresh the data
      await fetchScanData();
      
      toast.success('Card corrected successfully!');
      setShowCorrectModal(false);
      setSelectedDetection(null);
    } catch (err: any) {
      console.error('Error correcting card:', err);
      toast.error('Failed to correct card');
    }
  };

  const handleApproveAll = async () => {
    try {
      // Update scan status based on which table we're using
      if (scan?.id) {
        // Check if this is from scan_uploads or scans table
        const { data: scanUpload } = await supabase
          .from('scan_uploads')
          .select('id')
          .eq('id', scan.id)
          .single();

        if (scanUpload) {
          // Update scan_uploads table
          const { error: uploadError } = await supabase
            .from('scan_uploads')
            .update({ processing_status: 'completed' })
            .eq('id', scan.id);

          if (uploadError) throw uploadError;
        } else {
          // Update scans table
          const { error: scanError } = await supabase
            .from('scans')
            .update({ status: 'ready' })
            .eq('id', scan.id);

          if (scanError) throw scanError;
        }
      }

      // Create user_cards entries for all identified cards
      const identifiedDetections = detections.filter(d => d.guess_card_id);
      
      for (const detection of identifiedDetections) {
        try {
          // Check if user already owns this card
          const { data: existingCard } = await supabase
            .from('user_cards')
            .select('id, quantity')
            .eq('user_id', scan.user_id)
            .eq('card_id', detection.guess_card_id)
            .single();

          if (existingCard) {
            // Update quantity if card already exists
            const { error: cardError } = await supabase
              .from('user_cards')
              .update({ 
                quantity: existingCard.quantity + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingCard.id);
            
            if (cardError) {
              console.error('Error updating user card:', cardError);
            }
          } else {
            // Insert new card
            const { error: cardError } = await supabase
              .from('user_cards')
              .insert({
                user_id: scan.user_id,
                card_id: detection.guess_card_id,
                detection_id: detection.id,
                condition: 'unknown',
                quantity: 1
              });
            
            if (cardError) {
              console.error('Error creating user card:', cardError);
            }
          }
        } catch (err) {
          console.error('Exception creating user card:', err);
          // Don't throw, just log and continue
        }
      }

      toast.success('Scan approved! Cards added to your collection.');
      router.push('/');
    } catch (err: any) {
      console.error('Error approving scan:', err);
      toast.error('Failed to approve scan');
    }
  };

  const handleTrainingFeedback = async (detectionId: string, feedbackType: string) => {
    try {
      const response = await fetch('/api/training/add-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          detection_id: detectionId, 
          type: feedbackType 
        })
      });

      if (!response.ok) throw new Error('Failed to submit feedback');
      
      toast.success(`Marked as ${feedbackType.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <PageLayout 
        title="Loading Scan..." 
        description="Please wait while we load your scan"
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading scan data...</p>
        </div>
        </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Error" description="Failed to load scan">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        </PageLayout>
    );
  }

  const identifiedCount = detections.filter(d => d.guess_card_id).length;
  const totalValue = detections
    .filter(d => d.cards?.market_price)
    .reduce((sum, d) => sum + (parseFloat(d.cards.market_price) || 0), 0);

  // Map status values to a consistent format
  const getDisplayStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'processing': 'processing',
      'completed': 'ready',
      'ready': 'ready',
      'failed': 'error',
      'error': 'error',
      'queued': 'pending',
      'pending': 'pending'
    };
    return statusMap[status] || status;
  };

  const displayStatus = getDisplayStatus(scan?.status || 'pending');

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-header" aria-label="Breadcrumb">
        <Link href="/scans" className="breadcrumb-link">
          <ArrowLeft size={14} className="breadcrumb-icon" />
          <span className="breadcrumb-text">All Scans</span>
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Scan Details</span>
      </nav>

      <PageLayout
        title={scan?.title || 'Scan Details'}
        description={`Processed on ${new Date(scan?.created_at).toLocaleDateString()}`}
      >
      {/* Scan Review - Side by Side Layout */}
      <ContentSection title="" headingLevel={2}>
        <div className="scan-review-header">
          <div className="scan-review-title-section">
            <h2 className="scan-review-title">Scan Review</h2>
            <div className="scan-review-description">
              <p>Hover over cards to highlight them in the original image. Click to correct identifications.</p>
            </div>
          </div>
          <div className="header-summary">
            <div className="status-chip" style={{ 
              backgroundColor: displayStatus === 'ready' ? 'var(--status-success)' : 
                             displayStatus === 'processing' ? 'var(--status-info)' : 
                             displayStatus === 'error' ? 'var(--status-error)' : 
                             'var(--status-warning)' 
            }}>
              {displayStatus}
            </div>
            <span className="header-stat">{detections.length} cards</span>
            <span className="header-stat">{identifiedCount}/{detections.length} identified</span>
            <span className="header-stat">${totalValue.toFixed(2)}</span>
          </div>
        </div>
        
        {scan?.summary_image_path && (
          <ScanReviewLayout
            summaryImageUrl={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/scans/${scan.summary_image_path}`}
            detections={detections.map(detection => ({
              id: detection.id,
              card_name: getDisplayName(detection),
              similarity_score: detection.confidence || 0,
              bbox: detection.bbox || [0, 0, 100, 100], // fallback bbox
              crop_url: detection.crop_url ? `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/scans/${detection.crop_url}` : undefined,
              identified_card: detection.cards ? {
                id: detection.cards.id,
                name: detection.cards.name,
                set_code: detection.cards.set_code,
                card_number: detection.cards.card_number,
                image_url: detection.cards.image_url
              } : undefined
            }))}
            onDetectionClick={(detection) => {
              // Find the original detection object
              const originalDetection = detections.find(d => d.id === detection.id);
              if (originalDetection) {
                handleCardClick(originalDetection);
              }
            }}
          />
        )}
      </ContentSection>

      {/* Actions Section */}
      <ContentSection title="Actions" headingLevel={2}>
        <div className="actions-container">
          <Button 
            variant="primary" 
            onClick={handleApproveAll}
            disabled={scan?.status === 'ready'}
          >
            <CheckCircle size={20} style={{ marginRight: '0.25rem' }} />
            {scan?.status === 'ready' ? 'Already Approved' : 'Approve Scan'}
          </Button>
        </div>
      </ContentSection>

      {/* Correction Modal */}
      <Modal
        isOpen={showCorrectModal}
        onClose={handleModalClose}
      >
        <h3>Correct Card Identification</h3>
        
        {/* Desktop/Tablet Layout - 3 Columns */}
        <div className="correction-layout">
          {/* Card Comparison - Left and Center Columns */}
          <div className="card-comparison-section">
            {selectedDetection && (
              <div className="card-comparison">
                <div className="original-crop-section">
                  <h4>Original Scan Crop:</h4>
                  <img
                    src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/scans/${selectedDetection.crop_url}`}
                    alt="Original card crop from scan"
                    className="modal-crop-image"
                  />
                  <div className="crop-meta">
                    <p className="confidence-info">
                      {Math.round((selectedDetection.confidence || 0) * 100)}% confidence
                    </p>
                  </div>
                </div>
                
                {selectedDetection.cards && (
                  <div className="identified-card-section">
                    <h4>AI Identified As:</h4>
                    <img
                      src={selectedDetection.cards.image_url}
                      alt={selectedDetection.cards.name}
                      className="modal-card-image"
                    />
                    <div className="card-meta">
                      <p className="set-info">
                        {selectedDetection.cards.set_code} #{selectedDetection.cards.card_number}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Search and Results - Right Column */}
          <div className="search-results-section">
            <div className="search-section">
              <CardSearchInput
                onSelect={handleCorrectCard}
                placeholder="Search for correct card..."
                className="correction-search"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="modal-actions">
              <div className="action-buttons">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    // Mark as correct
                    console.log('Marked as correct');
                  }}
                >
                  This is Correct
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      
      <style jsx>{`
        .breadcrumb-header {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-200);
          margin-bottom: var(--sds-size-space-400);
          padding: var(--sds-size-space-400) var(--sds-size-space-800);
          font-size: var(--sds-size-font-300);
        }

        .breadcrumb-link {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-100);
          text-decoration: none;
          color: var(--text-secondary);
          transition: color 0.2s ease;
        }

        .breadcrumb-link:hover {
          color: var(--text-primary);
        }

        .breadcrumb-icon {
          color: inherit;
        }

        .breadcrumb-text {
          color: inherit;
        }

        .breadcrumb-separator {
          color: var(--text-tertiary);
          margin: 0 var(--sds-size-space-100);
        }

        .breadcrumb-current {
          color: var(--text-primary);
          font-weight: var(--sds-weight-medium);
        }

        .scan-review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--sds-size-space-600);
          gap: var(--sds-size-space-600);
        }

        .scan-review-title-section {
          flex: 1;
        }

        .scan-review-title {
          font-size: var(--sds-size-font-700);
          font-weight: var(--sds-weight-semibold);
          color: var(--text-primary);
          margin: 0 0 var(--sds-size-space-200) 0;
        }

        .header-summary {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-400);
          flex-shrink: 0;
        }

        .header-stat {
          font-size: var(--sds-size-font-300);
          color: var(--text-secondary);
          font-weight: var(--sds-weight-medium);
        }

        .summary-stats-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
          background: var(--surface-background);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-medium);
        }

        .scan-review-description {
          margin-bottom: var(--sds-size-space-400);
        }

        .scan-review-description p {
          color: var(--text-secondary);
          margin: 0;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .scan-review-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--sds-size-space-400);
          }
          
          .header-summary {
            order: -1;
            align-self: stretch;
            justify-content: space-between;
          }
        }

        .status-chip {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-small);
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          text-transform: capitalize;
          width: fit-content;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .summary-image-container {
          display: flex;
          justify-content: flex-start;
        }

        .summary-image {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-medium);
          border: 1px solid var(--border-subtle);
        }

        .summary-image-container img {
          max-height: 800px;
          width: auto;
          height: auto;
        }

        .cards-header {
          margin-bottom: 1.5rem;
        }

        .cards-description {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .actions-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .correction-modal {
          padding: 1rem;
          max-width: 700px;
          width: 100%;
        }

        .correction-modal h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .modal-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-top: 1.5rem;
          min-height: 400px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .correction-layout {
          display: flex;
          gap: 2rem;
          flex: 1;
          min-height: 0;
        }

        .card-comparison-section {
          flex: 2;
          min-width: 0;
        }

        .search-results-section {
          flex: 1;
          min-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }



        /* Mobile Layout */
        @media (max-width: 768px) {
          .correction-layout {
            flex-direction: column;
          }

          .search-results-section {
            min-width: auto;
            order: 3; /* Move to bottom on mobile */
          }

          .card-comparison-section {
            order: 2; /* Move to middle on mobile */
          }

          .results-container {
            max-height: 300px;
          }
        }

        .card-comparison-section {
          flex: 1;
          margin-bottom: 2rem;
        }

        .card-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }

        .search-section {
          margin-bottom: var(--sds-size-space-600);
          position: relative;
          z-index: 10;
        }

        .correction-search {
          width: 100%;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-medium);
          border: 1px solid var(--border-default);
          background: var(--surface-background);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .btn:hover {
          background: var(--surface-subtle);
          border-color: var(--border-strong);
        }

        .btn-secondary {
          background: var(--color-gray-100);
          color: var(--text-primary);
        }

        .btn-secondary:hover {
          background: var(--color-gray-200);
        }


        
        .card-preview h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: var(--text-primary);
        }
        
        .modal-card-image {
          width: 100%;
          height: auto;
          border-radius: var(--radius-medium);
          border: 1px solid var(--border-subtle);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .modal-crop-image {
          width: 100%;
          height: auto;
          border-radius: var(--radius-medium);
          border: 2px solid var(--border-default);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .original-crop-section,
        .identified-card-section {
          margin-bottom: var(--sds-size-space-600);
        }

        .original-crop-section h4,
        .identified-card-section h4 {
          margin: 0 0 var(--sds-size-space-200) 0;
          font-size: var(--sds-size-font-400);
          font-weight: var(--sds-weight-semibold);
          color: var(--text-primary);
        }

        .crop-meta {
          margin-top: var(--sds-size-space-200);
        }
        
        .card-meta {
          margin-top: 0.75rem;
          text-align: center;
        }

        .set-info {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .confidence-info {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }
        
        .current-card h4,
        .search-section h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: var(--text-primary);
        }
        
        .current-card p {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--primary);
        }
        
        /* Mobile responsive */
        @media (max-width: 640px) {
          .card-comparison {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .modal-actions {
            gap: 1rem;
          }

          .action-buttons {
            justify-content: stretch;
          }

          .btn {
            flex: 1;
          }

          .correction-modal {
            padding: 0.75rem;
          }
        }
      `}      </style>
    </PageLayout>
    </div>
  );
} 