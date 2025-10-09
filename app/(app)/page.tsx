'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/browser';
import { useCards } from '@/hooks/useCards';

import { DraggableCardGrid, type CardEntry } from '@/components/ui/DraggableCardGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { User } from '@supabase/supabase-js';
import { CollectionFilters, type CollectionFiltersState } from '@/components/ui/CollectionFilters';
import { CollectionTable } from '@/components/ui/CollectionTable';
import { Modal } from '@/components/ui/Modal';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [enableDrag, setEnableDrag] = useState(false);
  const router = useRouter();

  // Data Fetching via Custom Hook
  const { cards: dbCards, isLoading: areCardsLoading, deleteCard } = useCards(user?.id);
  
  // Local state for optimistic reordering
  const [localCards, setLocalCards] = useState<CardEntry[] | undefined>(undefined);
  const [filters, setFilters] = useState<CollectionFiltersState>({ query: '', setCode: '', rarity: '', viewMode: 'grid' });
  const [selectedCard, setSelectedCard] = useState<CardEntry | null>(null);

  useEffect(() => {
    // Initialize local state when dbCards are fetched
    if (dbCards) {
      setLocalCards(dbCards);
    }
  }, [dbCards]);

  // Authentication
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
      setIsAuthLoading(false);
    };
    checkUser();
  }, [router]);

  const handleDeleteCard = (cardId: string, cardName: string) => {
    if (window.confirm(`Are you sure you want to delete ${cardName}?`)) {
      deleteCard(cardId);
    }
  };

  const handleReorder = (reorderedCards: CardEntry[]) => {
    // Optimistically update the local state for instant feedback
    setLocalCards(reorderedCards);
    // TODO: Persist the new order to the database via an API call
  };

  // Loading state for auth
  if (isAuthLoading) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Authenticating...</p>
        </div>
      </main>
    );
  }

  // This should not happen if useEffect logic is correct, but as a safeguard
  if (!user) {
    return null;
  }

  // Collection stats for header details
  const totalCollected = localCards?.length ?? 0;
  const totalQuantity = (localCards || []).reduce((sum: number, card: CardEntry) => sum + (card.quantity || 1), 0);
  const uniqueSets = localCards ? new Set(localCards.map((card: CardEntry) => card.set_code)).size : 0;

  return (
    <div className="container">
      {/* Header Section */}
      <header className="header">
        <div className="header-left">
          <h1>My Collection</h1>  
          <p className="user-info">Welcome back, {user.email}!</p>
          <p className="user-info">Collected: {totalCollected} · Total Quantity: {totalQuantity} · Sets: {uniqueSets}</p>
        </div>
        <div className="header-right">
          {/* Payment Link Button */}
          {process.env.NEXT_PUBLIC_PAYMENT_LINK_URL && (
            <a
              href={process.env.NEXT_PUBLIC_PAYMENT_LINK_URL}
              target="_blank"
              rel="noreferrer"
              className="support-button"
            >
              Go Pro / Support
            </a>
          )}
          <button 
            className={`drag-toggle ${enableDrag ? 'drag-toggle--active' : ''}`}
            onClick={() => setEnableDrag(!enableDrag)}
            aria-label={enableDrag ? 'Disable drag mode' : 'Enable drag mode'}
          >
            {enableDrag ? '🔓 Drag Enabled' : '🔒 Drag Disabled'}
          </button>
        </div>
      </header>

      {/* Filters Section */}
      <section className="stats-section">
          <CollectionFilters 
            value={filters}
            onChange={setFilters}
            setOptions={[...new Set((localCards || []).map((c) => c.set_code).filter(Boolean))] as string[]}
            rarityOptions={[...new Set((localCards || []).map((c: any) => c.rarity).filter(Boolean))] as string[]}
          />
      </section>

      {/* Cards Grid/Table Section */}
      <section className={`cards-section ${filters.viewMode === 'table' ? 'cards-section--table' : ''}`}>
          {areCardsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading your collection...</p>
            </div>
          ) : (localCards?.length ?? 0) === 0 ? (
            <EmptyState
              title='No cards yet. Upload your first scan to begin!'
              description="Start building your collection by uploading Pokemon card images."
            />
          ) : filters.viewMode === 'table' ? (
            <CollectionTable
              cards={(localCards || []).filter((c) => {
                const q = filters.query.trim().toLowerCase();
                const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.number.toLowerCase().includes(q);
                const matchesSet = !filters.setCode || c.set_code === filters.setCode;
                const matchesRarity = !filters.rarity || (c as any).rarity === filters.rarity;
                return matchesQuery && matchesSet && matchesRarity;
              })}
              onCardClick={setSelectedCard}
              onDelete={handleDeleteCard}
            />
          ) : (
            <DraggableCardGrid 
              cards={(localCards || []).filter((c) => {
                const q = filters.query.trim().toLowerCase();
                const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.number.toLowerCase().includes(q);
                const matchesSet = !filters.setCode || c.set_code === filters.setCode;
                const matchesRarity = !filters.rarity || (c as any).rarity === filters.rarity;
                return matchesQuery && matchesSet && matchesRarity;
              })}
              onReorder={handleReorder}
              onDelete={handleDeleteCard}
              enableDrag={enableDrag}
              onCardReplaced={(userCardId, update) => {
                setLocalCards((prev) =>
                  (prev || []).map((c) =>
                    c.id === userCardId ? { ...c, ...update } : c
                  )
                );
              }}
            />
          )}
      </section>

      {/* Modal for table view card details */}
      {selectedCard && (
        <Modal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          card={{
            id: selectedCard.id,
            name: selectedCard.name,
            imageUrl: selectedCard.image_url,
            number: selectedCard.number,
            setCode: selectedCard.set_code,
            setName: selectedCard.set_name,
            quantity: selectedCard.quantity,
            condition: selectedCard.condition,
            rawCropUrl: selectedCard.raw_crop_url || undefined,
          }}
          onDeleteCard={async (cardId: string) => {
            handleDeleteCard(cardId, selectedCard.name);
            setSelectedCard(null);
          }}
          onReplaced={(updated) => {
            setLocalCards((prev) =>
              (prev || []).map((c) =>
                c.id === selectedCard.id ? { 
                  ...c, 
                  name: updated.name,
                  image_url: updated.imageUrl,
                  number: updated.number,
                  set_code: updated.setCode,
                  set_name: updated.setName,
                } : c
              )
            );
            setSelectedCard(null);
          }}
        />
      )}

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-8);
          flex-wrap: wrap;
          gap: var(--spacing-4);
          flex-shrink: 0;
        }
        .header-left h1 {
          margin: 0;
          margin-bottom: var(--spacing-1);
        }
        .user-info {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }
        .header-right {
          display: flex;
          gap: var(--sds-size-space-200);
        }
        .support-button {
          padding: var(--sds-size-space-200) var(--sds-size-space-400);
          border-radius: var(--sds-size-radius-100);
          border: 1px solid var(--interactive-primary);
          background: var(--interactive-primary);
          color: var(--text-on-primary);
          text-decoration: none;
        }
        .drag-toggle {
          padding: var(--sds-size-space-200) var(--sds-size-space-400);
          border-radius: var(--sds-size-radius-100);
          border: 1px solid var(--border-default);
          background: var(--surface-background);
          color: var(--text-primary);
          font-size: var(--font-size-100);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .drag-toggle:hover {
          border-color: var(--border-strong);
          transform: translateY(-1px);
        }
        .drag-toggle--active {
          background: var(--interactive-primary);
          color: var(--text-on-primary);
          border-color: var(--interactive-primary);
        }
        .stats-section {
          flex-shrink: 0;
          margin-bottom: 8px;
        }
        .cards-section {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }
        /* Table view: disable scroll on parent, let table-wrapper handle it */
        .cards-section--table {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .cards-section--table :global(.table-wrapper) {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}