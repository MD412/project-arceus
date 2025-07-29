'use client';

import React, { useState, useEffect } from 'react';
import { useJob } from '@/hooks/useJobs';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import styles from './ScanReviewModal.module.css';

interface ScanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanId: string | undefined;
}

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const ScanReviewModal = ({ isOpen, onClose, scanId }: ScanReviewModalProps) => {
  const { data: job, isLoading, isError } = useJob(scanId);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when modal is opened or scanId changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen, scanId]);

  const detections = job?.results?.enriched_cards || [];
  const currentDetection = detections[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % detections.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + detections.length) % detections.length);
  };

  const handleClose = () => {
    onClose();
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence > 85) return 'var(--sds-color-success-500)';
    if (confidence > 60) return 'var(--sds-color-warning-500)';
    return 'var(--sds-color-error-500)';
};


  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={styles.modalContent}>
      {isLoading ? (
        <div>Loading...</div>
      ) : isError || !currentDetection ? (
        <div>Error loading scan details or no cards found.</div>
      ) : (
        <>
          <div className={styles.leftColumn}>
            <Image
              src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/scans/${currentDetection.cropped_image_path}`}
              alt={currentDetection.card_name || 'Detected card'}
              width={400}
              height={560}
              className={styles.cardImage}
              unoptimized
            />
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.cardDetails}>
              <h2 className={styles.cardName}>
                {currentDetection.card_name || 'Unknown Card'}
              </h2>
              <p className={styles.cardSet}>
                {currentDetection.set_name || 'Unknown Set'} - #{currentDetection.card_number}
              </p>
              <p className={styles.confidence}>
                Identification Confidence:{' '}
                <span 
                    className={styles.confidenceValue} 
                    style={{ color: getConfidenceColor(currentDetection.identification_confidence) }}
                >
                    {currentDetection.identification_confidence.toFixed(1)}%
                </span>
              </p>
            </div>
            <div className={styles.navigation}>
              <Button onClick={handlePrevious} disabled={detections.length <= 1}>
                Previous
              </Button>
              <span className={styles.cardCounter}>
                Card {currentIndex + 1} of {detections.length}
              </span>
              <Button onClick={handleNext} disabled={detections.length <= 1}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ScanReviewModal; 