import { EmptyState, TradingCard } from '@/components/ui';

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
        
        return (
          <TradingCard
            key={entry.id}
            name={cardDetail.name}
            imageUrl={imgUrl}
            quantity={entry.quantity}
            condition={entry.condition}
            number={cardDetail.number}
            setCode={cardDetail.set_code}
            onDelete={onDelete ? () => handleDelete(entry) : undefined}
          />
        );
      })}
    </div>
  );
} 