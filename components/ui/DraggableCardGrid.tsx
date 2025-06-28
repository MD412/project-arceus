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
import { CardInfoModal } from './Modal';

// Match the data structure from your database
export interface CardEntry {
  id: string;
  name: string;
  number: string;
  set_code: string;
  set_name: string;
  image_url: string;
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
}

export function DraggableCardGrid({ 
  cards, 
  onReorder,
  onDelete,
  enableDrag = true,
  viewMode = 'grid' 
}: DraggableCardGridProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [selectedCard, setSelectedCard] = React.useState<CardEntry | null>(null);
  
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
        <div className="card-grid">
          {cards.map((card) => (
            <TradingCard
              key={card.id}
              name={card.name}
              imageUrl={card.image_url}
              number={card.number}
              setCode={card.set_code}
              quantity={card.quantity}
              condition={card.condition}
              onClick={() => setSelectedCard(card)}
            />
          ))}
        </div>
        
        {selectedCard && (
          <CardInfoModal
            isOpen={!!selectedCard}
            onClose={() => setSelectedCard(null)}
            card={{
              name: selectedCard.name,
              imageUrl: selectedCard.image_url,
              number: selectedCard.number,
              setCode: selectedCard.set_code,
              setName: selectedCard.set_name,
              // Add more fields as your modal supports them
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
                quantity={activeCard.quantity}
                condition={activeCard.condition}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedCard && (
        <CardInfoModal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          card={{
            name: selectedCard.name,
            imageUrl: selectedCard.image_url,
            number: selectedCard.number,
            setCode: selectedCard.set_code,
            setName: selectedCard.set_name,
            // Add more fields as your modal supports them
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
        quantity={card.quantity}
        condition={card.condition}
        onClick={onClick}
        className={isDragging ? 'circuit-trading-card--placeholder' : ''}
      />
    </div>
  );
};

export default DraggableCardGrid; 