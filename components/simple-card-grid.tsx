import Image from 'next/image';
import { useState } from 'react';
import { clsx } from 'clsx';
import { EmptyState } from '@/components/ui';

// Define the structure for the nested card details
interface CardDetail {
  id: string;
  name: string;
  number: string;
  set_code: string;
  image_url: string;
}

interface CardEntry {
  id: string;
  quantity: number;
  condition: string;
  image_url?: string; // Optional: image_url from the user_cards table itself
  cards: CardDetail; // The joined card details from !inner join
}

interface SimpleCardGridProps {
  cards: CardEntry[];
  onDelete?: (cardId: string, cardName: string) => void;
}

export function SimpleCardGrid({ cards, onDelete }: SimpleCardGridProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const formatCondition = (condition: string) => {
    return condition.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleDelete = async (entry: CardEntry) => {
    if (!entry.cards) {
      console.error('Cannot delete card: missing card data', entry);
      alert('Cannot delete this card - missing card information');
      return;
    }
    
    const cardName = entry.cards.name;
    console.log(`🖱️ Delete button clicked for: ${cardName} (ID: ${entry.id})`);
    
    if (confirm(`Are you sure you want to delete "${cardName}" from your collection?`)) {
      console.log(`✔️ User confirmed deletion of: ${cardName}`);
      onDelete?.(entry.id, cardName);
    } else {
      console.log(`❌ User cancelled deletion of: ${cardName}`);
    }
  };

  // Filter for entries that have card details with a name
  const validCards = cards.filter(entry => entry.cards && entry.cards.name);

  if (validCards.length === 0) {
    return (
      <EmptyState 
        title="No cards in collection yet"
        description="Add some cards to get started!"
      />
    );
  }

  return (
    <div className="card-grid">
      {validCards.map((entry) => {
        const cardDetail = entry.cards;
        const imgUrl = entry.image_url ?? cardDetail.image_url;
        const isHovered = hoveredCard === entry.id;
        const isButtonHovered = hoveredButton === entry.id;
        
        return (
          <div
            key={entry.id}
            className={clsx('card-item', isHovered && 'card-item-hovered')}
            onMouseEnter={() => setHoveredCard(entry.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {onDelete && (
              <button
                className={clsx(
                  'delete-button',
                  isButtonHovered && 'delete-button-hovered'
                )}
                onClick={() => handleDelete(entry)}
                onMouseEnter={() => setHoveredButton(entry.id)}
                onMouseLeave={() => setHoveredButton(null)}
                title={`Delete ${cardDetail.name}`}
              >
                ×
              </button>
            )}
            <Image
              src={imgUrl}
              alt={cardDetail.name}
              width={300}
              height={420}
              className="card-image"
            />
            <div className="card-name">
              {cardDetail.name}
            </div>
            <div className="card-details">
              Base — {cardDetail.number}
            </div>
            <div className="card-stats">
              <span className="card-stats-quantity">{entry.quantity}×</span>
              <span className="card-stats-separator">•</span>
              <span className="card-stats-condition">{formatCondition(entry.condition)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
} 