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
    <div className="collection-page">
      {/* Scrollable content area - includes header so content scrolls behind it */}
      <div className="scroll-wrapper">
        {/* Sticky header + filters group */}
        <div className="sticky-header-group">
          {/* Header Section */}
          <header className="header">
            <div className="header-left">
              <div className="header-title-group">
                <h1>My Collection</h1>  
                <p className="user-info">Welcome back, {user.email}!</p>
              </div>
              <div className="user-stats">
                <span className="stat-item">Collected: {totalCollected}</span>
                <span className="stat-separator"> · </span>
                <span className="stat-item">Total Quantity: {totalQuantity}</span>
                <span className="stat-separator"> · </span>
                <span className="stat-item">Sets: {uniqueSets}</span>
              </div>
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
              {/* Drag toggle temporarily removed */}
            </div>
          </header>

          {/* Floating Filters */}
          <CollectionFilters 
            className="floating-filters"
            value={filters}
            onChange={setFilters}
            setOptions={[...new Set((localCards || []).map((c) => c.set_code).filter(Boolean))] as string[]}
            rarityOptions={[...new Set((localCards || []).map((c: any) => c.rarity).filter(Boolean))] as string[]}
          />
        </div>

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
      </div>
      {/* End scroll-wrapper */}

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
        .collection-page {
          height: 100%;
          overflow: hidden;
        }
        
        /* Header: Edge-to-edge with glass effect */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          margin-bottom: 0;
          background: rgba(27, 62, 66, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          flex-wrap: wrap;
          gap: 12px;
        }
        .header-left {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
          gap: 16px;
        }
        .header-title-group h1 {
          margin: 0;
          font-size: var(--font-size-500);
          line-height: 1.2;
        }
        .user-info {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.4;
        }
        .user-stats {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.4;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .stat-item {
          display: inline;
        }
        .stat-separator {
          display: inline;
        }
        .header-right {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .support-button {
          padding: 8px 16px;
          border-radius: var(--sds-size-radius-100);
          border: 1px solid var(--interactive-primary);
          background: var(--interactive-primary);
          color: var(--text-on-primary);
          text-decoration: none;
          font-size: 0.875rem;
        }
        .drag-toggle {
          padding: 8px 16px;
          border-radius: var(--sds-size-radius-100);
          border: 1px solid var(--border-default);
          background: var(--surface-background);
          color: var(--text-primary);
          font-size: 0.875rem;
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
        
        /* Scroll wrapper: Main scrolling container */
        .scroll-wrapper {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        /* Sticky header + filters group */
        .sticky-header-group {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: -16px;
        }
        
        /* Filters: Floating with glass effect */
        :global(.floating-filters) {
          margin: 0 24px 16px 24px;
          padding: 12px;
          background: rgba(27, 62, 66, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          pointer-events: auto;
        }
        
        /* Cards: Full width with horizontal padding only */
        .cards-section {
          padding: 0 24px 24px 24px;
          position: relative;
          z-index: 1;
        }
        
        /* Table view: needs own scroll container */
        .cards-section--table {
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 0; /* Remove all padding for edge-to-edge table */
        }
        .cards-section--table :global(.table-wrapper) {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: auto;
          border-radius: 0; /* Remove border radius for flush edges */
          border-left: none; /* Remove side borders */
          border-right: none;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .header-title-group h1 {
            font-size: calc(var(--font-size-500) - 8px);
          }
          
          .user-info {
            font-size: 12px;
          }
          
          .user-stats {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            white-space: normal;
            font-size: 10px;
          }
          
          .stat-separator {
            display: none;
          }
          
          :global(.floating-filters) {
            margin: 0 12px 12px 12px;
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}