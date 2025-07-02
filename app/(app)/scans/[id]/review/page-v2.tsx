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

interface CardDetection {
  id: string;
  crop_url: string;
  confidence: number;
  status: 'auto_approved' | 'needs_review' | 'flagged' | 'rejected';
  card_name?: string;
  estimated_value?: number;
}

interface ReviewStats {
  total: number;
  autoApproved: number;
  needsReview: number;
  flagged: number;
  userApproved: number;
  userRejected: number;
}

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function ModernReviewPage() {
  const params = useParams();
  const scanId = params?.id as string;
  
  const [detections, setDetections] = useState<CardDetection[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    total: 0, autoApproved: 0, needsReview: 0, flagged: 0, userApproved: 0, userRejected: 0
  });
  const [loading, setLoading] = useState(true);

  // Mock data for now - replace with real API call
  useEffect(() => {
    const mockDetections: CardDetection[] = [
      { id: '1', crop_url: 'card1.jpg', confidence: 0.95, status: 'auto_approved', card_name: 'Charizard ex', estimated_value: 45.00 },
      { id: '2', crop_url: 'card2.jpg', confidence: 0.88, status: 'auto_approved', card_name: 'Pikachu VMAX', estimated_value: 12.50 },
      { id: '3', crop_url: 'card3.jpg', confidence: 0.72, status: 'needs_review', card_name: 'Blastoise?', estimated_value: 8.75 },
      { id: '4', crop_url: 'card4.jpg', confidence: 0.45, status: 'flagged', card_name: 'Unknown Card' },
      { id: '5', crop_url: 'card5.jpg', confidence: 0.91, status: 'auto_approved', card_name: 'Venusaur ex', estimated_value: 22.00 },
      { id: '6', crop_url: 'card6.jpg', confidence: 0.68, status: 'needs_review', card_name: 'Mewtwo?', estimated_value: 15.00 },
    ];
    
    setDetections(mockDetections);
    
    const stats = {
      total: mockDetections.length,
      autoApproved: mockDetections.filter(d => d.status === 'auto_approved').length,
      needsReview: mockDetections.filter(d => d.status === 'needs_review').length,
      flagged: mockDetections.filter(d => d.status === 'flagged').length,
      userApproved: 0,
      userRejected: 0
    };
    setReviewStats(stats);
    setLoading(false);
  }, []);

  const handleCardSelect = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handleSelectAll = (filter?: string) => {
    let cardsToSelect;
    if (filter === 'review') {
      cardsToSelect = detections.filter(d => d.status === 'needs_review');
    } else if (filter === 'flagged') {
      cardsToSelect = detections.filter(d => d.status === 'flagged');
    } else {
      cardsToSelect = detections;
    }
    setSelectedCards(new Set(cardsToSelect.map(d => d.id)));
  };

  const handleBulkAction = (action: 'approve' | 'reject' | 'flag') => {
    const updatedDetections = detections.map(detection => {
      if (selectedCards.has(detection.id)) {
        return { 
          ...detection, 
          status: action === 'approve' ? 'auto_approved' : 
                 action === 'reject' ? 'rejected' : 'flagged' 
        };
      }
      return detection;
    });
    
    setDetections(updatedDetections);
    setSelectedCards(new Set());
    
    toast.success(`${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Flagged'} ${selectedCards.size} cards`);
  };

  const handleApproveAllGood = () => {
    const goodCards = detections.filter(d => 
      (d.status === 'auto_approved' || d.status === 'needs_review') && d.confidence >= 0.7
    );
    
    const updatedDetections = detections.map(detection => {
      if (goodCards.some(gc => gc.id === detection.id)) {
        return { ...detection, status: 'auto_approved' as const };
      }
      return detection;
    });
    
    setDetections(updatedDetections);
    toast.success(`✅ Approved ${goodCards.length} high-quality cards! Only reviewing ${detections.length - goodCards.length} questionable ones.`);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'var(--status-success)';
    if (confidence >= 0.60) return 'var(--status-warning)';
    return 'var(--status-error)';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'auto_approved': return '✅';
      case 'needs_review': return '⚠️';
      case 'flagged': return '🔍';
      case 'rejected': return '❌';
      default: return '❓';
    }
  };

  const filteredDetections = detections.filter(d => 
    d.status === 'needs_review' || d.status === 'flagged' || selectedCards.has(d.id)
  );

  return (
    <PageLayout title="Smart Card Review" description="AI-powered review with bulk actions">
      
      {/* Smart Summary */}
      <ContentSection title="Review Summary" headingLevel={2}>
        <div className="smart-summary">
          <div className="summary-stats">
            <div className="stat-item good">
              <span className="stat-number">{reviewStats.autoApproved}</span>
              <span className="stat-label">Auto-Approved</span>
              <span className="stat-detail">High confidence (85%+)</span>
            </div>
            <div className="stat-item warning">
              <span className="stat-number">{reviewStats.needsReview}</span>
              <span className="stat-label">Needs Review</span>
              <span className="stat-detail">Medium confidence</span>
            </div>
            <div className="stat-item error">
              <span className="stat-number">{reviewStats.flagged}</span>
              <span className="stat-label">Flagged</span>
              <span className="stat-detail">Low confidence</span>
            </div>
          </div>
          
          <div className="quick-actions">
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleApproveAllGood}
              disabled={reviewStats.needsReview === 0}
            >
              ⚡ Approve All Good Cards ({detections.filter(d => d.confidence >= 0.7).length})
            </Button>
            <Button variant="secondary" onClick={() => handleSelectAll('review')}>
              Select All Review Items
            </Button>
            <Button variant="secondary" onClick={() => handleSelectAll('flagged')}>
              Select All Flagged
            </Button>
          </div>
        </div>
      </ContentSection>

      {/* Bulk Actions Bar */}
      {selectedCards.size > 0 && (
        <ContentSection title={`${selectedCards.size} Cards Selected`} headingLevel={2}>
          <div className="bulk-actions-bar">
            <Button variant="primary" onClick={() => handleBulkAction('approve')}>
              ✅ Approve Selected ({selectedCards.size})
            </Button>
            <Button variant="destructive" onClick={() => handleBulkAction('reject')}>
              ❌ Reject Selected
            </Button>
            <Button variant="secondary" onClick={() => handleBulkAction('flag')}>
              🔍 Flag for Manual Review
            </Button>
            <Button variant="ghost" onClick={() => setSelectedCards(new Set())}>
              Clear Selection
            </Button>
          </div>
        </ContentSection>
      )}

      {/* Focus Mode: Only Problem Cards */}
      <ContentSection title="Cards Needing Attention" headingLevel={2}>
        <div className="focus-mode-info">
          <p>✨ <strong>Smart Focus:</strong> Only showing cards that need your review. {reviewStats.autoApproved} high-confidence cards were automatically approved.</p>
        </div>
        
        <div className="cards-grid">
          {filteredDetections.map((detection) => (
            <div 
              key={detection.id} 
              className={`card-item ${selectedCards.has(detection.id) ? 'selected' : ''} status-${detection.status}`}
              onClick={() => handleCardSelect(detection.id)}
            >
              <div className="card-header">
                <div className="status-indicator">
                  {getStatusIcon(detection.status)}
                </div>
                <div 
                  className="confidence-bar"
                  style={{ 
                    background: `linear-gradient(90deg, ${getConfidenceColor(detection.confidence)} ${detection.confidence * 100}%, #e5e7eb ${detection.confidence * 100}%)` 
                  }}
                >
                  <span className="confidence-text">{Math.round(detection.confidence * 100)}%</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={selectedCards.has(detection.id)}
                  onChange={() => handleCardSelect(detection.id)}
                  className="card-checkbox"
                />
              </div>
              
              <div className="card-image">
                <Image
                  src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/scans/${detection.crop_url}`}
                  alt={detection.card_name || 'Unknown Card'}
                  width={150}
                  height={210}
                  className="crop-image"
                />
              </div>
              
              <div className="card-details">
                <h4 className="card-name">{detection.card_name || 'Unknown Card'}</h4>
                {detection.estimated_value && (
                  <p className="card-value">${detection.estimated_value.toFixed(2)}</p>
                )}
                <div className="quick-actions-mini">
                  <button onClick={(e) => { e.stopPropagation(); handleBulkAction('approve'); }}>✅</button>
                  <button onClick={(e) => { e.stopPropagation(); handleBulkAction('reject'); }}>❌</button>
                  <button onClick={(e) => { e.stopPropagation(); handleBulkAction('flag'); }}>🔍</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredDetections.length === 0 && (
          <div className="no-issues">
            <h3>🎉 All Set!</h3>
            <p>No cards need manual review. All detections look good!</p>
          </div>
        )}
      </ContentSection>

      {/* Actions */}
      <ContentSection title="Finish Review" headingLevel={2}>
        <div className="completion-actions">
          <Button variant="primary" size="lg">
            🏆 Complete Review & Add to Collection
          </Button>
          <Link href="/scans" className="back-link">
            ← Back to All Scans
          </Link>
        </div>
      </ContentSection>

      <style jsx>{`
        .smart-summary {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .summary-stats {
          display: flex;
          gap: 1.5rem;
          flex: 1;
        }

        .stat-item {
          background: var(--surface-background);
          padding: 1.5rem;
          border-radius: 0.75rem;
          text-align: center;
          border: 2px solid transparent;
        }

        .stat-item.good { border-color: var(--status-success); }
        .stat-item.warning { border-color: var(--status-warning); }
        .stat-item.error { border-color: var(--status-error); }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          display: block;
          font-weight: 600;
          margin: 0.5rem 0 0.25rem 0;
        }

        .stat-detail {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-width: 280px;
        }

        .bulk-actions-bar {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface-secondary);
          border-radius: 0.5rem;
          border: 2px solid var(--border-focus);
        }

        .focus-mode-info {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .card-item {
          background: var(--surface-background);
          border: 2px solid var(--border-subtle);
          border-radius: 0.75rem;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .card-item:hover {
          border-color: var(--border-focus);
          transform: translateY(-2px);
        }

        .card-item.selected {
          border-color: var(--primary);
          background: var(--primary-background);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .status-indicator {
          font-size: 1.25rem;
        }

        .confidence-bar {
          flex: 1;
          height: 1.5rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .confidence-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .card-checkbox {
          width: 1.25rem;
          height: 1.25rem;
        }

        .crop-image {
          width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .card-name {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        .card-value {
          color: var(--status-success);
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .quick-actions-mini {
          display: flex;
          gap: 0.25rem;
        }

        .quick-actions-mini button {
          background: none;
          border: 1px solid var(--border-subtle);
          border-radius: 0.25rem;
          padding: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .quick-actions-mini button:hover {
          background: var(--surface-secondary);
        }

        .no-issues {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .completion-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
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