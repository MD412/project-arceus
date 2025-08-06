'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from './Button';
import { CheckCircle, MagnifyingGlass, ArrowRight, X } from '@phosphor-icons/react';
import styles from './StreamlinedScanReview.module.css';

interface Detection {
  id: string;
  card_name: string;
  similarity_score: number;
  bbox: [number, number, number, number];
  crop_url?: string;
  identified_card?: {
    id: string;
    name: string;
    set_code: string;
    card_number: string;
    image_url: string;
  };
}

interface StreamlinedScanReviewProps {
  summaryImageUrl: string;
  detections: Detection[];
  onApproveAll: () => void;
  onReviewIndividual: (detection: Detection) => void;
  onRejectAll: () => void;
  isLoading?: boolean;
  isProcessing?: boolean;
}

export function StreamlinedScanReview({
  summaryImageUrl,
  detections,
  onApproveAll,
  onReviewIndividual,
  onRejectAll,
  isLoading = false,
  isProcessing = false
}: StreamlinedScanReviewProps) {
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  const handleApproveAll = () => {
    onApproveAll();
  };

  const handleRejectAll = () => {
    onRejectAll();
  };

  const handleReviewIndividual = (detection: Detection) => {
    setSelectedDetection(detection);
    onReviewIndividual(detection);
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Scan Review</h1>
          <p className={styles.subtitle}>
            Review the {detections.length} cards detected in your scan
          </p>
        </div>
        
        <div className={styles.headerActions}>
                     <Button
             variant="primary"
             size="md"
             onClick={handleApproveAll}
             disabled={isLoading || isProcessing}
           >
             <CheckCircle size={20} />
             {isProcessing ? 'Processing...' : 'Approve All Cards'}
           </Button>
           
           <Button
             variant="destructive"
             size="md"
             onClick={handleRejectAll}
             disabled={isLoading || isProcessing}
           >
             <X size={20} />
             {isProcessing ? 'Processing...' : 'Reject All'}
           </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Original Scan */}
        <div className={styles.originalScan}>
          <h3 className={styles.sectionTitle}>Original Scan</h3>
          <div className={styles.imageContainer}>
            <Image
              src={summaryImageUrl}
              alt="Original scan"
              width={400}
              height={300}
              className={styles.scanImage}
            />
          </div>
        </div>

        {/* Detected Cards */}
        <div className={styles.detectedCards}>
          <h3 className={styles.sectionTitle}>
            Detected Cards ({detections.length})
          </h3>
          
          <div className={styles.cardsList}>
            {detections.map((detection, index) => (
              <div 
                key={detection.id} 
                className={styles.cardItem}
                onClick={() => handleReviewIndividual(detection)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleReviewIndividual(detection);
                  }
                }}
              >
                {/* Crop Image */}
                <div className={styles.cropContainer}>
                  {detection.crop_url ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/${detection.crop_url}`}
                      alt={`Card crop ${index + 1}`}
                      width={80}
                      height={120}
                      className={styles.cropImage}
                    />
                  ) : (
                    <div className={styles.cropPlaceholder}>
                      <span>Crop {index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className={styles.arrowContainer}>
                  <ArrowRight size={24} className={styles.arrow} />
                </div>

                {/* Identified Card */}
                <div className={styles.identifiedCard}>
                  {detection.identified_card ? (
                    <>
                      <div className={styles.cardImageContainer}>
                        <Image
                          src={detection.identified_card.image_url}
                          alt={detection.identified_card.name}
                          width={80}
                          height={120}
                          className={styles.cardImage}
                        />
                      </div>
                      <div className={styles.cardInfo}>
                        <h4 className={styles.cardName}>
                          {detection.identified_card.name}
                        </h4>
                        <p className={styles.cardSet}>
                          {detection.identified_card.set_code} #{detection.identified_card.card_number}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className={styles.unidentifiedCard}>
                      <p className={styles.unidentifiedText}>
                        {detection.card_name || 'Unidentified Card'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Review Button - Now just visual indicator */}
                <div className={styles.reviewButton}>
                  <div className={styles.reviewIndicator}>
                    <MagnifyingGlass size={16} />
                    Review
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 