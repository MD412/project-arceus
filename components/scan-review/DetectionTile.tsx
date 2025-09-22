'use client';

import React from 'react';
import Image from 'next/image';
import styles from './DetectionTile.module.css';

interface Detection {
  id: string;
  crop_url: string;
  guess_card_id?: string;
  card?: {
    name: string;
    set_name?: string;
    card_number?: string;
    image_urls?: {
      small?: string;
    };
  };
  confidence?: number;
  tile_source?: string;
}

interface DetectionTileProps {
  detection: Detection;
  onClick: () => void;
}

export default function DetectionTile({ detection, onClick }: DetectionTileProps) {
  const confidencePercent = detection.confidence ? Math.round(detection.confidence * 100) : 0;
  const isLowConfidence = confidencePercent < 80;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cropSrc = React.useMemo(() => {
    const isAbsolute = /^https?:\/\//i.test(detection.crop_url);
    if (isAbsolute) return detection.crop_url;
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/scans/${detection.crop_url}`;
    }
    return detection.crop_url;
  }, [detection.crop_url, supabaseUrl]);
  
  return (
    <div 
      className={styles.tile} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className={styles.imageContainer}>
        <img 
          src={cropSrc} 
          alt={detection.card?.name || 'Unknown card'}
          className={styles.cropImage}
        />
        {detection.tile_source && (
          <span className={styles.tileSource}>{detection.tile_source}</span>
        )}
      </div>
      
      <div className={styles.cardInfo}>
        {detection.card ? (
          <>
            <h4 className={styles.cardName}>{detection.card.name}</h4>
            {detection.card.set_name && (
              <p className={styles.setInfo}>
                {detection.card.set_name} 
                {detection.card.card_number && ` #${detection.card.card_number}`}
              </p>
            )}
            <div className={`${styles.confidence} ${isLowConfidence ? styles.lowConfidence : ''}`}>
              {confidencePercent}% confident
            </div>
          </>
        ) : (
          <div className={styles.unknownCard}>
            <p>Unknown Card</p>
            <p className={styles.clickToIdentify}>Click to identify</p>
          </div>
        )}
      </div>
    </div>
  );
}