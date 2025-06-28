'use client';
import React from 'react';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Image from 'next/image';

export interface PlayerCardData {
  id: string;
  title: string;
  description: string;
  theme: string;
  icon: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

interface SortablePlayerGridProps {
  cards: PlayerCardData[];
  setCards: (cards: PlayerCardData[]) => void;
  viewMode?: 'grid' | 'list';
}

const SortablePlayerGrid: React.FC<SortablePlayerGridProps> = ({ cards, setCards, viewMode = 'grid' }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  const activeCard = cards.find((c) => c.id === activeId) || null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setCards(arrayMove(cards, oldIndex, newIndex));
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id ? String(event.over.id) : null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragCancel={() => {
        setActiveId(null);
        setOverId(null);
      }}
    >
      <SortableContext items={cards.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className={"player-grid" + (viewMode === 'list' ? ' player-grid--list' : '')}>
          {cards.map((card) => (
            <SortableCard 
              key={card.id} 
              card={card} 
              isDropTarget={overId === card.id && activeId !== card.id}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeCard ? <CardInner card={activeCard} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SortablePlayerGrid;

interface SortableCardProps {
  card: PlayerCardData;
  isDropTarget?: boolean;
}

const SortableCard: React.FC<SortableCardProps> = ({ card, isDropTarget }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        'player-card ' +
        (card.variant === 'outlined'
          ? 'player-card--outlined'
          : card.variant === 'elevated'
          ? 'player-card--elevated'
          : 'player-card--default') +
        (isDragging ? ' player-card--placeholder' : '') +
        (isDropTarget ? ' player-card--drop-target' : '')
      }
      {...attributes}
      {...listeners}
    >
      {/* Drag handle area is entire card for simplicity */}
      <button className="player-card__menu" title="Card Options">
        <span className="player-card__menu-icon">⋯</span>
      </button>

      <div className={`player-card__header player-card__header--theme-${card.theme}`}>
        <Image src={card.icon} alt={card.title} width={48} height={48} className="player-card__icon" />
      </div>
      <div className="player-card__content">
        <h3 className="player-card__title">{card.title}</h3>
        <p className="player-card__description">{card.description}</p>
      </div>
    </div>
  );
};

interface CardInnerProps {
  card: PlayerCardData;
  dragging?: boolean;
}

const CardInner: React.FC<CardInnerProps> = ({ card, dragging }) => (
  <div
    className={
      'player-card ' +
      (card.variant === 'outlined'
        ? 'player-card--outlined'
        : card.variant === 'elevated'
        ? 'player-card--elevated'
        : 'player-card--default') +
      (dragging ? ' player-card--dragging' : '')
    }
    /* No fixed width so overlay matches original size */
  >
    <div className={`player-card__header player-card__header--theme-${card.theme}`}>
      <Image src={card.icon} alt={card.title} width={48} height={48} className="player-card__icon" />
    </div>
    <div className="player-card__content">
      <h3 className="player-card__title">{card.title}</h3>
      <p className="player-card__description">{card.description}</p>
    </div>
  </div>
); 