import React, { useState } from 'react';
import Image from 'next/image';
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
}

export function ScanReviewLayout({ 
  summaryImageUrl, 
  detections, 
  className,
  onDetectionHover,
  onDetectionClick
}: ScanReviewLayoutProps) {
  const [hoveredDetection, setHoveredDetection] = useState<Detection | null>(null);

  const handleDetectionHover = (detection: Detection | null) => {
    setHoveredDetection(detection);
    onDetectionHover?.(detection);
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
        
        <div className={styles.detectionsContainer}>
          {detections.map((detection) => {
            const isHovered = hoveredDetection?.id === detection.id;
            
            return (
              <div
                key={detection.id}
                className={`${styles.detectionItem} ${isHovered ? styles.detectionItemHovered : ''}`}
                onMouseEnter={() => handleDetectionHover(detection)}
                onMouseLeave={() => handleDetectionHover(null)}
                onClick={() => onDetectionClick?.(detection)}
              >
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
                <div className={styles.identifiedCard}>
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
                          <span className={styles.confidenceScore}>
                            {Math.round(detection.similarity_score * 100)}% match
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.unidentifiedCard}>
                      <span>Unidentified</span>
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