import React from 'react';
import { CardSearchInput } from './CardSearchInput';
import styles from './CardDetailLayout.module.css';

interface Card {
  id: string;
  name: string;
  set_code: string;
  card_number: string;
  image_url: string;
}

interface CardDetailLayoutProps {
  selectedCard: Card | null;
  onCardSelect: (card: Card) => void;
  onCardApply?: (card: Card) => void;
  className?: string;
}

export function CardDetailLayout({ 
  selectedCard, 
  onCardSelect, 
  onCardApply,
  className 
}: CardDetailLayoutProps) {
  return (
    <div className={`${styles.layout} ${className || ''}`}>
      <div className={styles.cardDisplaySection}>
        <div className={styles.cardDisplay}>
          {selectedCard ? (
            <>
              <div className={styles.cardImageContainer}>
                <img 
                  src={selectedCard.image_url} 
                  alt={selectedCard.name}
                  className={styles.cardImage}
                />
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardName}>{selectedCard.name}</h3>
                <div className={styles.cardDetails}>
                  <p><strong>Set:</strong> {selectedCard.set_code}</p>
                  <p><strong>Number:</strong> {selectedCard.card_number}</p>
                </div>
                {onCardApply && (
                  <div className={styles.cardActions}>
                    <p className={styles.actionHint}>
                      Click on any unidentified card below to apply this correction
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noCardSelected}>
              <p>Search for a card to see details here</p>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.searchSidebar}>
        <div className={styles.searchSection}>
          <h3 className={styles.searchTitle}>Search Cards</h3>
          <CardSearchInput
            onSelect={onCardSelect}
            placeholder="Search for any card name, set, or number..."
            className={styles.searchInput}
          />
        </div>
      </div>
    </div>
  );
} 