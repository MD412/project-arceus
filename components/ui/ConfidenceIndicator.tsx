import React from 'react';
import { CheckCircle, Warning, XCircle } from '@phosphor-icons/react';
import styles from './ConfidenceIndicator.module.css';

interface ConfidenceIndicatorProps {
  confidence: number;
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
  showIcon?: boolean;
}

export function ConfidenceIndicator({ 
  confidence, 
  size = 'medium', 
  showPercentage = true,
  showIcon = true 
}: ConfidenceIndicatorProps) {
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.85) return 'high';
    if (conf >= 0.70) return 'medium';
    if (conf >= 0.50) return 'low';
    return 'very-low';
  };

  const getIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <CheckCircle size={16} weight="fill" />;
      case 'medium':
        return <CheckCircle size={16} />;
      case 'low':
        return <Warning size={16} />;
      case 'very-low':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const confidenceLevel = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);

  return (
    <div className={`${styles.container} ${styles[size]} ${styles[confidenceLevel]}`}>
      {showIcon && (
        <span className={styles.icon}>
          {getIcon(confidenceLevel)}
        </span>
      )}
      {showPercentage && (
        <span className={styles.percentage}>
          {percentage}%
        </span>
      )}
      <div className={styles.bar}>
        <div 
          className={styles.fill} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
} 