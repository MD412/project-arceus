'use client';

import React, { useState } from 'react';
import { CardSearchInput } from '@/components/ui/CardSearchInput';
import { Button } from '@/components/ui/Button';
import styles from './demo-scan-flow.module.css';

// Mock data for demonstration
const MOCK_CARDS = [
  {
    card_index: 0,
    card_name: 'Greavard',
    set_name: 'Scarlet & Violet',
    enrichment_success: true,
    identification_confidence: 95.5,
    cropped_image_path: 'https://images.pokemontcg.io/sv1/95.png',
    detection_id: 'mock-1'
  },
  {
    card_index: 1,
    card_name: 'Unknown Card',
    enrichment_success: false,
    identification_confidence: 12.3,
    cropped_image_path: 'https://via.placeholder.com/200x280?text=Unknown',
    detection_id: 'mock-2'
  }
];

export default function DemoScanFlowPage() {
  const [cards, setCards] = useState(MOCK_CARDS);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleCardClick = (index: number) => {
    setSelectedCardIndex(index);
    setShowSearch(true);
    setSearchQuery('');
  };

  const handleCardSelect = (card: any) => {
    if (selectedCardIndex !== null) {
      const updatedCards = [...cards];
      updatedCards[selectedCardIndex] = {
        ...updatedCards[selectedCardIndex],
        card_name: card.name,
        set_name: card.set?.name || '',
        enrichment_success: true,
        identification_confidence: 100,
        cropped_image_path: card.images?.large || card.images?.small
      };
      setCards(updatedCards);
      setShowSearch(false);
      setSelectedCardIndex(null);
    }
  };

  const handleApprove = () => {
    alert(`Approving scan with ${cards.filter(c => c.enrichment_success).length} identified cards!`);
  };

  return (
    <div className={styles.container}>
      <h1>Demo: Scan Review Flow</h1>
      <p>This is a working demonstration of the scan review flow with card search.</p>

      <div className={styles.cardsGrid}>
        <h2>Detected Cards (Click to correct)</h2>
        <div className={styles.cards}>
          {cards.map((card, index) => (
            <div 
              key={card.detection_id}
              className={`${styles.card} ${selectedCardIndex === index ? styles.selected : ''}`}
              onClick={() => handleCardClick(index)}
            >
              <img 
                src={card.cropped_image_path} 
                alt={card.card_name}
                className={styles.cardImage}
              />
              <div className={styles.cardInfo}>
                <h3>{card.card_name}</h3>
                <p>{card.set_name}</p>
                <p className={card.enrichment_success ? styles.success : styles.error}>
                  {card.enrichment_success ? '✅ Identified' : '❌ Unknown'}
                </p>
                <p>Confidence: {card.identification_confidence.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSearch && (
        <div className={styles.searchSection}>
          <h3>Search for the correct card:</h3>
          <CardSearchInput
            onSelect={handleCardSelect}
            placeholder="Type to search for a card..."
          />
          <Button onClick={() => setShowSearch(false)}>Cancel</Button>
        </div>
      )}

      <div className={styles.actions}>
        <Button onClick={handleApprove} disabled={!cards.some(c => c.enrichment_success)}>
          Approve Scan ({cards.filter(c => c.enrichment_success).length} cards)
        </Button>
      </div>
    </div>
  );
} 