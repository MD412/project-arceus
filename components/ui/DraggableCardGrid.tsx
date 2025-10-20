'use client';
import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { TradingCard } from './TradingCard';
import { CardDetailModal } from './CardDetailModal';

// Match the data structure from your database
export interface CardEntry {
  id: string;
  name: string;
  number: string;
  set_code: string;
  set_name: string;
  image_url: string;
  raw_crop_url?: string | null;
  user_id: string;
  created_at: string;
  quantity: number; // Required field from user_cards
  condition?: string; // Optional field
}

interface DraggableCardGridProps {
  cards: CardEntry[];
  onReorder: (cards: CardEntry[]) => void;
  onDelete?: (cardId: string, cardName: string) => void;
  enableDrag?: boolean;
  viewMode?: 'grid' | 'list';
  onCardReplaced?: (userCardId: string, update: Partial<CardEntry>) => void;
}

export function DraggableCardGrid({ 
  cards, 
  onReorder,
  onDelete,
  enableDrag = true,
  viewMode = 'grid',
  onCardReplaced,
}: DraggableCardGridProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [selectedCard, setSelectedCard] = React.useState<CardEntry | null>(null);
  
  // Enable left/right arrow navigation while the modal is open
  React.useEffect(() => {
    if (!selectedCard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas/selects or contenteditable
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isFormField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
      if (isFormField) return;

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      const currentIndex = cards.findIndex((c) => c.id === selectedCard.id);
      if (currentIndex === -1) return;

      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + delta + cards.length) % cards.length;
      const nextCard = cards[nextIndex];
      if (nextCard) {
        setSelectedCard(nextCard);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    // Find the indices
    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Swap the cards
    const newCards = [...cards];
    [newCards[oldIndex], newCards[newIndex]] = [newCards[newIndex], newCards[oldIndex]];
    onReorder(newCards);
  };

  const activeCard = cards.find((c) => c.id === activeId);

  // If drag is disabled, just render a simple grid
  if (!enableDrag) {
    return (
      <>
        <div className="card-grid" data-testid="card-grid">
          {cards.map((card) => (
            <TradingCard
              key={card.id}
              name={card.name}
              imageUrl={card.image_url}
              number={card.number}
              setCode={card.set_code}
              setName={card.set_name}
              language={(card as any).language}
              quantity={card.quantity}
              condition={card.condition}
              onClick={() => setSelectedCard(card)}
            />
          ))}
        </div>
        
        {selectedCard && (
          <CardDetailModal
            isOpen={!!selectedCard}
            onClose={() => setSelectedCard(null)}
            card={{
              id: selectedCard.id,
              name: selectedCard.name,
              imageUrl: selectedCard.image_url || '', // Ensure imageUrl is passed correctly
              number: selectedCard.number,
              setCode: selectedCard.set_code,
              setName: selectedCard.set_name,
              quantity: selectedCard.quantity,
              condition: selectedCard.condition,
              rawCropUrl: selectedCard.raw_crop_url || undefined,
              language: (selectedCard as any).language || 'en',
            }}
            onDeleteCard={async (cardId: string) => {
              if (onDelete && selectedCard) {
                onDelete(cardId, selectedCard.name);
                setSelectedCard(null); // Close modal after deletion
              }
            }}
            onLanguageChange={async (cardId: string, newLanguage: string) => {
              const response = await fetch(`/api/user-cards/${cardId}/language`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: newLanguage }),
              });
              if (!response.ok) throw new Error('Failed to update language');
              setSelectedCard((prev) => prev ? ({ ...prev, language: newLanguage } as any) : prev);
            }}
            onReplaced={(u) => {
              // Optimistically update selected card details locally
              setSelectedCard((prev) => prev ? ({ ...prev, name: u.name, image_url: u.imageUrl, number: u.number, set_code: u.setCode, set_name: u.setName }) : prev);
              // Notify parent to update grid state
              onCardReplaced?.(selectedCard.id, {
                name: u.name,
                image_url: u.imageUrl,
                number: u.number,
                set_code: u.setCode,
                set_name: u.setName,
              } as any);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={(event) => {
          setOverId(event.over ? String(event.over.id) : null);
        }}
        onDragCancel={() => {
          setActiveId(null);
          setOverId(null);
        }}
      >
        <div className={`card-grid ${viewMode === 'list' ? 'card-grid--list' : ''}`}>
          {cards.map((card) => (
            <DraggableCard
              key={card.id}
              card={card}
              isDragging={activeId === card.id}
              isOver={overId === card.id && activeId !== card.id}
              onDelete={onDelete}
              onClick={() => setSelectedCard(card)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="dragging-card-overlay">
              <TradingCard
                name={activeCard.name}
                imageUrl={activeCard.image_url}
                number={activeCard.number}
                setCode={activeCard.set_code}
                setName={activeCard.set_name}
                language={(activeCard as any).language}
                quantity={activeCard.quantity}
                condition={activeCard.condition}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

              {selectedCard && (
          <CardDetailModal
            isOpen={!!selectedCard}
            onClose={() => setSelectedCard(null)}
            card={{
              id: selectedCard.id,
              name: selectedCard.name,
              imageUrl: selectedCard.image_url || '', // Ensure imageUrl is passed correctly
              number: selectedCard.number,
              setCode: selectedCard.set_code,
              setName: selectedCard.set_name,
              quantity: selectedCard.quantity,
              condition: selectedCard.condition,
              rawCropUrl: selectedCard.raw_crop_url || undefined,
              language: (selectedCard as any).language || 'en',
            }}
            onDeleteCard={async (cardId: string) => {
              if (onDelete && selectedCard) {
                onDelete(cardId, selectedCard.name);
                setSelectedCard(null); // Close modal after deletion
              }
            }}
            onLanguageChange={async (cardId: string, newLanguage: string) => {
              const response = await fetch(`/api/user-cards/${cardId}/language`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: newLanguage }),
              });
              if (!response.ok) throw new Error('Failed to update language');
              setSelectedCard((prev) => prev ? ({ ...prev, language: newLanguage } as any) : prev);
            }}
            onReplaced={(u) => {
              // Optimistically update selected card details locally
              setSelectedCard((prev) => prev ? ({ ...prev, name: u.name, image_url: u.imageUrl, number: u.number, set_code: u.setCode, set_name: u.setName }) : prev);
              // Notify parent to update grid state
              onCardReplaced?.(selectedCard.id, {
                name: u.name,
                image_url: u.imageUrl,
                number: u.number,
                set_code: u.setCode,
                set_name: u.setName,
              } as any);
            }}
          />
        )}
    </>
  );
}

interface DraggableCardProps {
  card: CardEntry;
  isDragging: boolean;
  isOver: boolean;
  onDelete?: (cardId: string, cardName: string) => void;
  onClick: () => void;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ 
  card, 
  isDragging,
  isOver,
  onDelete,
  onClick
}) => {
  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
    id: card.id,
  });
  
  const { setNodeRef: setDropRef } = useDroppable({
    id: card.id,
  });

  // Combine refs
  const setRefs = React.useCallback((node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  }, [setDragRef, setDropRef]);

  return (
    <div
      ref={setRefs}
      className={`
        draggable-card-wrapper
        ${isDragging ? 'draggable-card-wrapper--dragging' : ''}
        ${isOver ? 'draggable-card-wrapper--drop-target' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <TradingCard
        name={card.name}
        imageUrl={card.image_url}
        number={card.number}
        setCode={card.set_code}
        setName={card.set_name}
        language={(card as any).language}
        quantity={card.quantity}
        condition={card.condition}
        onClick={onClick}
        className={isDragging ? 'circuit-trading-card--placeholder' : ''}
      />
    </div>
  );
};

export default DraggableCardGrid; 