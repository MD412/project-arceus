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
import Image from 'next/image';
import { PlayerCardData } from './SortablePlayerGrid';

interface StaticDragGridProps {
  cards: PlayerCardData[];
  setCards: (cards: PlayerCardData[]) => void;
  viewMode?: 'grid' | 'list';
}

export const StaticDragGrid: React.FC<StaticDragGridProps> = ({ 
  cards, 
  setCards, 
  viewMode = 'grid' 
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  
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
    setCards(newCards);
  };

  const activeCard = cards.find((c) => c.id === activeId);

  return (
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
      <div className={`player-grid ${viewMode === 'list' ? 'player-grid--list' : ''}`}>
        {cards.map((card, index) => (
          <DroppableCard
            key={card.id}
            card={card}
            index={index}
            isDragging={activeId === card.id}
            isOver={overId === card.id && activeId !== card.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? <DraggingCard card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

interface DroppableCardProps {
  card: PlayerCardData;
  index: number;
  isDragging: boolean;
  isOver: boolean;
}

const DroppableCard: React.FC<DroppableCardProps> = ({ 
  card, 
  index, 
  isDragging,
  isOver 
}) => {
  const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({
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

  // Apply transform only if NOT dragging (to prevent the sortable behavior)
  const style = {
    transform: isDragging ? undefined : transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={`
        player-card 
        ${card.variant === 'outlined' ? 'player-card--outlined' : 
          card.variant === 'elevated' ? 'player-card--elevated' : 
          'player-card--default'}
        ${isDragging ? 'player-card--placeholder' : ''}
        ${isOver ? 'player-card--drop-target' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <button className="player-card__menu" title="Card Options">
        <span className="player-card__menu-icon">⋯</span>
      </button>

      <div className={`player-card__header player-card__header--theme-${card.theme}`}>
        <Image 
          src={card.icon} 
          alt={card.title} 
          width={48} 
          height={48} 
          className="player-card__icon" 
        />
      </div>
      <div className="player-card__content">
        <h3 className="player-card__title">{card.title}</h3>
        <p className="player-card__description">{card.description}</p>
      </div>
    </div>
  );
};

const DraggingCard: React.FC<{ card: PlayerCardData }> = ({ card }) => (
  <div
    className={`
      player-card 
      ${card.variant === 'outlined' ? 'player-card--outlined' : 
        card.variant === 'elevated' ? 'player-card--elevated' : 
        'player-card--default'}
      player-card--dragging
    `}
  >
    <div className={`player-card__header player-card__header--theme-${card.theme}`}>
      <Image 
        src={card.icon} 
        alt={card.title} 
        width={48} 
        height={48} 
        className="player-card__icon" 
      />
    </div>
    <div className="player-card__content">
      <h3 className="player-card__title">{card.title}</h3>
      <p className="player-card__description">{card.description}</p>
    </div>
  </div>
);

export default StaticDragGrid; 