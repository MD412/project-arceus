'use client';

import React, { useState } from 'react';
import { ScanReviewLayout } from '@/components/ui/ScanReviewLayout';
import { ConfidenceIndicator } from '@/components/ui/ConfidenceIndicator';
import { BatchActions } from '@/components/ui/BatchActions';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, MagnifyingGlass } from '@phosphor-icons/react';
import styles from './demo-enhanced-review.module.css';

// Mock data for demo
const MOCK_DETECTIONS = [
  {
    id: '1',
    card_name: 'Pikachu',
    similarity_score: 0.95,
    bbox: [100, 150, 200, 250],
    crop_url: '/ui-playground-pk-img/1600.jpg',
    identified_card: {
      id: 'pikachu-1',
      name: 'Pikachu',
      set_code: 'base1',
      card_number: '58',
      image_url: '/ui-playground-pk-img/1600.jpg'
    }
  },
  {
    id: '2',
    card_name: 'Charizard',
    similarity_score: 0.78,
    bbox: [300, 150, 400, 250],
    crop_url: '/ui-playground-pk-img/1600.jpg',
    identified_card: {
      id: 'charizard-1',
      name: 'Charizard',
      set_code: 'base1',
      card_number: '4',
      image_url: '/ui-playground-pk-img/1600.jpg'
    }
  },
  {
    id: '3',
    card_name: 'Unknown Card',
    similarity_score: 0.45,
    bbox: [500, 150, 600, 250],
    crop_url: '/ui-playground-pk-img/1600.jpg',
    identified_card: undefined
  },
  {
    id: '4',
    card_name: 'Venusaur',
    similarity_score: 0.88,
    bbox: [100, 350, 200, 450],
    crop_url: '/ui-playground-pk-img/1600.jpg',
    identified_card: {
      id: 'venusaur-1',
      name: 'Venusaur',
      set_code: 'base1',
      card_number: '15',
      image_url: '/ui-playground-pk-img/1600.jpg'
    }
  }
];

export default function DemoEnhancedReviewPage() {
  const [selectedDetections, setSelectedDetections] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);

  const handleDetectionClick = (detection: any) => {
    console.log('Clicked detection:', detection);
    // In real app, this would open a correction modal
  };

  const handleBatchApprove = (detectionIds: string[]) => {
    console.log('Batch approve:', detectionIds);
    setSelectedDetections(new Set());
  };

  const handleBatchReject = (detectionIds: string[]) => {
    console.log('Batch reject:', detectionIds);
    setSelectedDetections(new Set());
  };

  const handleBatchSearch = (detectionIds: string[]) => {
    console.log('Batch search:', detectionIds);
    setSelectedDetections(new Set());
  };

  const handleBatchDelete = (detectionIds: string[]) => {
    console.log('Batch delete:', detectionIds);
    setSelectedDetections(new Set());
  };

  const highConfidenceCount = MOCK_DETECTIONS.filter(d => d.similarity_score >= 0.85).length;
  const mediumConfidenceCount = MOCK_DETECTIONS.filter(d => d.similarity_score >= 0.70 && d.similarity_score < 0.85).length;
  const lowConfidenceCount = MOCK_DETECTIONS.filter(d => d.similarity_score < 0.70).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Enhanced Card Review Demo</h1>
        <p>Showcasing confidence indicators, batch actions, and improved UX</p>
      </div>

      {/* Confidence Overview */}
      <div className={styles.confidenceOverview}>
        <h2>Confidence Distribution</h2>
        <div className={styles.confidenceStats}>
          <div className={styles.confidenceStat}>
            <ConfidenceIndicator confidence={0.95} size="large" />
            <span>High ({highConfidenceCount})</span>
          </div>
          <div className={styles.confidenceStat}>
            <ConfidenceIndicator confidence={0.78} size="large" />
            <span>Medium ({mediumConfidenceCount})</span>
          </div>
          <div className={styles.confidenceStat}>
            <ConfidenceIndicator confidence={0.45} size="large" />
            <span>Low ({lowConfidenceCount})</span>
          </div>
        </div>
      </div>

      {/* Enhanced Scan Review Layout */}
      <div className={styles.reviewSection}>
        <h2>Enhanced Review Interface</h2>
        <ScanReviewLayout
          summaryImageUrl="/ui-playground-pk-img/1600.jpg"
          detections={MOCK_DETECTIONS}
          onDetectionClick={handleDetectionClick}
          onBatchApprove={handleBatchApprove}
          onBatchReject={handleBatchReject}
          onBatchSearch={handleBatchSearch}
          onBatchDelete={handleBatchDelete}
        />
      </div>

      {/* Feature Highlights */}
      <div className={styles.features}>
        <h2>Key Features</h2>
        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <CheckCircle size={24} />
            <h3>Confidence Indicators</h3>
            <p>Visual confidence bars with color coding for quick assessment</p>
          </div>
          <div className={styles.feature}>
            <MagnifyingGlass size={24} />
            <h3>Batch Actions</h3>
            <p>Select multiple cards and approve/reject/search them all at once</p>
          </div>
          <div className={styles.feature}>
            <XCircle size={24} />
            <h3>Smart Selection</h3>
            <p>Hover to highlight cards in the original image for context</p>
          </div>
        </div>
      </div>
    </div>
  );
} 