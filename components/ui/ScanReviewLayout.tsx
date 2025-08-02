'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { BatchActions } from './BatchActions';
import styles from './ScanReviewLayout.module.css';

interface Detection {
  id: string;
  card_name: string;
  similarity_score: number;
  bbox: [number, number, number, number]; // x1, y1, x2, y2
  crop_url?: string;
  identified_card?: {
    id: string;
    name: string;
    set_code: string;
    card_number: string;
    image_url: string;
  };
}

interface ScanReviewLayoutProps {
  summaryImageUrl: string;
  detections: Detection[];
  className?: string;
  onDetectionHover?: (detection: Detection | null) => void;
  onDetectionClick?: (detection: Detection) => void;
  onBatchApprove?: (detectionIds: string[]) => void;
  onBatchReject?: (detectionIds: string[]) => void;
  onBatchSearch?: (detectionIds: string[]) => void;
  onBatchDelete?: (detectionIds: string[]) => void;
}

export function ScanReviewLayout({ 
  summaryImageUrl, 
  detections, 
  className,
  onDetectionHover,
  onDetectionClick,
  onBatchApprove,
  onBatchReject,
  onBatchSearch,
  onBatchDelete
}: ScanReviewLayoutProps) {
  const [hoveredDetection, setHoveredDetection] = useState<Detection | null>(null);
  const [selectedDetections, setSelectedDetections] = useState<Set<string>>(new Set());

  const handleDetectionHover = (detection: Detection | null) => {
    setHoveredDetection(detection);
    onDetectionHover?.(detection);
  };

  const handleDetectionClick = (detection: Detection) => {
    onDetectionClick?.(detection);
  };

  const handleDetectionSelect = (detectionId: string, checked: boolean) => {
    const newSelected = new Set(selectedDetections);
    if (checked) {
      newSelected.add(detectionId);
    } else {
      newSelected.delete(detectionId);
    }
    setSelectedDetections(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedDetections(new Set(detections.map(d => d.id)));
  };

  const handleDeselectAll = () => {
    setSelectedDetections(new Set());
  };

  const handleBatchApprove = () => {
    onBatchApprove?.(Array.from(selectedDetections));
    setSelectedDetections(new Set());
  };

  const handleBatchReject = () => {
    onBatchReject?.(Array.from(selectedDetections));
    setSelectedDetections(new Set());
  };

  const handleBatchSearch = () => {
    onBatchSearch?.(Array.from(selectedDetections));
    setSelectedDetections(new Set());
  };

  const handleBatchDelete = () => {
    onBatchDelete?.(Array.from(selectedDetections));
    setSelectedDetections(new Set());
  };

  return (
    <div className={`${styles.layout} ${className || ''}`}>
      {/* Left side: Original scan image */}
      <div className={styles.imageSection}>
        <div className={styles.imageContainer}>
          <Image
            src={summaryImageUrl}
            alt="Scan summary"
            className={styles.summaryImage}
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Right side: Detected cards list */}
      <div className={styles.detectionsList}>
        <div className={styles.detectionsHeader}>
          <h3 className={styles.detectionsTitle}>Detected Cards</h3>
          <span className={styles.detectionsCount}>{detections.length} cards found</span>
        </div>

        {/* Batch Actions */}
        <BatchActions
          cards={detections.map(d => ({
            id: d.id,
            card_name: d.card_name,
            confidence: d.similarity_score
          }))}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onApproveSelected={handleBatchApprove}
          onRejectSelected={handleBatchReject}
          onSearchSelected={handleBatchSearch}
          onDeleteSelected={handleBatchDelete}
          selectedCount={selectedDetections.size}
          totalCount={detections.length}
        />
        
        <div className={styles.detectionsContainer}>
          {detections.map((detection) => {
            const isHovered = hoveredDetection?.id === detection.id;
            
            const isSelected = selectedDetections.has(detection.id);
            
            return (
              <div
                key={detection.id}
                className={`${styles.detectionItem} ${isHovered ? styles.detectionItemHovered : ''} ${isSelected ? styles.detectionItemSelected : ''}`}
                onMouseEnter={() => handleDetectionHover(detection)}
                onMouseLeave={() => handleDetectionHover(null)}
              >
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleDetectionSelect(detection.id, e.target.checked)}
                  className={styles.selectionCheckbox}
                  onClick={(e) => e.stopPropagation()}
                />
                {/* Crop from original image */}
                <div className={styles.cropContainer}>
                  {detection.crop_url ? (
                    <Image
                      src={detection.crop_url}
                      alt={`Crop of ${detection.card_name}`}
                      className={styles.cropImage}
                      width={80}
                      height={112}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={styles.cropPlaceholder}>
                      <span>No crop</span>
                    </div>
                  )}
                </div>

                {/* Arrow indicating identification */}
                <div className={styles.identificationArrow}>
                  →
                </div>

                {/* Identified card */}
                <div className={styles.identifiedCard} onClick={() => handleDetectionClick(detection)}>
                  {detection.identified_card ? (
                    <>
                      <div className={styles.identifiedCardImage}>
                        <Image
                          src={detection.identified_card.image_url}
                          alt={detection.identified_card.name}
                          width={80}
                          height={112}
                          style={{ objectFit: 'cover' }}
                          className={styles.cardImage}
                        />
                      </div>
                      <div className={styles.cardInfo}>
                        <h4 className={styles.cardName}>{detection.identified_card.name}</h4>
                        <div className={styles.cardDetails}>
                          <span className={styles.setInfo}>
                            {detection.identified_card.set_code} #{detection.identified_card.card_number}
                          </span>
                          <ConfidenceIndicator 
                            confidence={detection.similarity_score}
                            size="small"
                            showIcon={false}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.unidentifiedCard}>
                      <span>Unidentified</span>
                      <ConfidenceIndicator 
                        confidence={detection.similarity_score}
                        size="small"
                        showIcon={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 