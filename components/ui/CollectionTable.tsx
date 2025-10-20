'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
import type { CardEntry } from './DraggableCardGrid';
import { formatLanguageDisplay, type LanguageCode } from '@/lib/languages';
import Image from 'next/image';
import { Trash, CaretUp, CaretDown } from '@phosphor-icons/react';

type SortField = 'name' | 'number' | 'set_code' | 'rarity' | 'quantity' | 'condition' | 'created_at';
type SortDirection = 'asc' | 'desc' | null;

interface CollectionTableProps {
  cards: CardEntry[];
  onCardClick: (card: CardEntry) => void;
  onDelete?: (cardId: string, cardName: string) => void;
}

export function CollectionTable({ cards, onCardClick, onDelete }: CollectionTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aValue: any = a[sortField as keyof CardEntry];
    let bValue: any = b[sortField as keyof CardEntry];

    // Handle rarity
    if (sortField === 'rarity') {
      aValue = a.rarity || '';
      bValue = b.rarity || '';
    }

    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Number comparison
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Date comparison
    if (sortField === 'created_at') {
      const aTime = new Date(aValue).getTime();
      const bTime = new Date(bValue).getTime();
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    }

    return 0;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
    return `${Math.floor(diffInDays / 365)}y ago`;
  };

  const getRarityBadgeClass = (rarity?: string) => {
    if (!rarity) return 'rarity-badge';
    const lower = rarity.toLowerCase();
    if (lower.includes('rare') && lower.includes('ultra')) return 'rarity-badge rarity-badge--ultra-rare';
    if (lower.includes('rare') && lower.includes('secret')) return 'rarity-badge rarity-badge--secret-rare';
    if (lower.includes('rare')) return 'rarity-badge rarity-badge--rare';
    if (lower.includes('uncommon')) return 'rarity-badge rarity-badge--uncommon';
    if (lower.includes('common')) return 'rarity-badge rarity-badge--common';
    return 'rarity-badge';
  };

  const SortableHeader = ({ field, children, ...props }: { field: SortField; children: React.ReactNode; [key: string]: any }) => (
    <TableHead
      className="circuit-table-head--sortable"
      onClick={() => handleSort(field)}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none' }}>
        {children}
        {sortField === field && sortDirection === 'asc' && <CaretUp size={14} weight="bold" />}
        {sortField === field && sortDirection === 'desc' && <CaretDown size={14} weight="bold" />}
      </div>
    </TableHead>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead style={{ width: '60px' }}>Image</TableHead>
          <SortableHeader field="name">Name</SortableHeader>
          <SortableHeader field="number" style={{ width: '100px' }}>Number</SortableHeader>
          <SortableHeader field="set_code" style={{ width: '140px' }}>Set</SortableHeader>
          <SortableHeader field="rarity" style={{ width: '120px' }}>Rarity</SortableHeader>
          <TableHead style={{ width: '90px' }}>Language</TableHead>
          <SortableHeader field="quantity" className="circuit-table-cell--numeric" style={{ width: '80px' }}>Qty</SortableHeader>
          <SortableHeader field="condition" style={{ width: '120px' }}>Condition</SortableHeader>
          <SortableHeader field="created_at" style={{ width: '120px' }}>Added</SortableHeader>
          <TableHead style={{ width: '80px' }}>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedCards.map((card) => (
          <TableRow 
            key={card.id}
            onClick={() => onCardClick(card)}
            style={{ cursor: 'pointer' }}
          >
            <TableCell>
              <div className="table-card-thumbnail">
                <Image
                  src={card.image_url}
                  alt={card.name}
                  width={32}
                  height={44}
                  style={{ objectFit: 'cover', borderRadius: 'var(--sds-size-radius-100)' }}
                />
              </div>
            </TableCell>
            <TableCell className="table-card-name">{card.name}</TableCell>
            <TableCell className="table-card-number">{card.number}</TableCell>
            <TableCell title={card.set_name}>
              {card.set_name}
            </TableCell>
            <TableCell>
              {card.rarity || 'Unknown'}
            </TableCell>
            <TableCell>
              {formatLanguageDisplay((card.language || 'en') as LanguageCode, 'flag-code')}
            </TableCell>
            <TableCell className="circuit-table-cell--numeric">
              {card.quantity}
            </TableCell>
            <TableCell>
              {card.condition || 'NM'}
            </TableCell>
            <TableCell className="table-date-cell">
              {formatDate(card.created_at)}
            </TableCell>
            <TableCell>
              <div className="table-actions">
                {onDelete && (
                  <button
                    className="table-action-button table-action-button--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(card.id, card.name);
                    }}
                    aria-label="Delete card"
                  >
                    <Trash size={18} weight="regular" className="table-action-icon" />
                  </button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

