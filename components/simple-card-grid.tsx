// import { EmptyState, TradingCard } from '@/components/ui'; // Old barrel import
import { EmptyState } from '@/components/ui/EmptyState';
import { TradingCard } from '@/components/ui/TradingCard';

// Define the structure for cards from the cards table
interface CardEntry {
  id: string;
  name: string;
  number: string;
  set_code: string;
  set_name: string;
  image_url: string;
  user_id: string;
  created_at: string;
  quantity: number;
}

interface SimpleCardGridProps {
  cards: CardEntry[];
  onDelete?: (cardId: string, cardName: string) => void;
}

export function SimpleCardGrid({ cards, onDelete }: SimpleCardGridProps) {
  const handleDelete = async (card: CardEntry) => {
    if (!card.name) {
      console.error('Cannot delete card: missing card data', card);
      alert('Cannot delete this card - missing card information');
      return;
    }
    
    const cardName = card.name;
    console.log(`🖱️ Delete button clicked for: ${cardName} (ID: ${card.id})`);
    
    if (confirm(`Are you sure you want to delete "${cardName}" from your collection?`)) {
      console.log(`✔️ User confirmed deletion of: ${cardName}`);
      onDelete?.(card.id, cardName);
    } else {
      console.log(`❌ User cancelled deletion of: ${cardName}`);
    }
  };

  // Filter for cards that have a name
  const validCards = cards.filter(card => card.name);

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
      {validCards.map((card) => {
        return (
          <TradingCard
            key={card.id}
            name={card.name}
            imageUrl={card.image_url}
            number={card.number}
            setCode={card.set_code}
            onDelete={onDelete ? () => handleDelete(card) : undefined}
          />
        );
      })}
    </div>
  );
} 