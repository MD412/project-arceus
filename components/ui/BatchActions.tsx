import React, { useState } from 'react';
import { Button } from './Button';
import { CheckCircle, XCircle, MagnifyingGlass, Trash } from '@phosphor-icons/react';
import styles from './BatchActions.module.css';

interface Card {
  id: string;
  card_name: string;
  confidence: number;
  isSelected?: boolean;
}

interface BatchActionsProps {
  cards: Card[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  onSearchSelected: () => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  totalCount: number;
}

export function BatchActions({
  cards,
  onSelectAll,
  onDeselectAll,
  onApproveSelected,
  onRejectSelected,
  onSearchSelected,
  onDeleteSelected,
  selectedCount,
  totalCount
}: BatchActionsProps) {
  const [showActions, setShowActions] = useState(false);

  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  return (
    <div className={styles.container}>
      {/* Selection Controls */}
      <div className={styles.selectionControls}>
        <div className={styles.selectionInfo}>
          <span className={styles.count}>
            {selectedCount} of {totalCount} selected
          </span>
          {someSelected && (
            <Button 
              variant="ghost" 
              size="small"
              onClick={onSelectAll}
            >
              Select All
            </Button>
          )}
          {allSelected && (
            <Button 
              variant="ghost" 
              size="small"
              onClick={onDeselectAll}
            >
              Deselect All
            </Button>
          )}
        </div>

        {/* Batch Actions */}
        {selectedCount > 0 && (
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="small"
              onClick={onApproveSelected}
              disabled={selectedCount === 0}
            >
              <CheckCircle size={16} />
              Approve ({selectedCount})
            </Button>

            <Button
              variant="secondary"
              size="small"
              onClick={onSearchSelected}
              disabled={selectedCount === 0}
            >
              <MagnifyingGlass size={16} />
              Search ({selectedCount})
            </Button>

            <Button
              variant="outline"
              size="small"
              onClick={onRejectSelected}
              disabled={selectedCount === 0}
            >
              <XCircle size={16} />
              Reject ({selectedCount})
            </Button>

            <Button
              variant="ghost"
              size="small"
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              className={styles.dangerButton}
            >
              <Trash size={16} />
              Delete ({selectedCount})
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {totalCount > 0 && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>High Confidence</span>
            <span className={styles.statValue}>
              {cards.filter(c => c.confidence >= 0.85).length}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Medium Confidence</span>
            <span className={styles.statValue}>
              {cards.filter(c => c.confidence >= 0.70 && c.confidence < 0.85).length}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Low Confidence</span>
            <span className={styles.statValue}>
              {cards.filter(c => c.confidence < 0.70).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 