'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/browser';
import { useCards } from '@/hooks/useCards';

import { TradingCard } from '@/components/ui/TradingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { User } from '@supabase/supabase-js';
import { CollectionFilters, type CollectionFiltersState } from '@/components/ui/CollectionFilters';
import { CollectionTable } from '@/components/ui/CollectionTable';
import { CardDetailModal } from '@/components/ui/CardDetailModal';

// Card type for the collection
interface CardEntry {
  id: string;
  name: string;
  number: string;
  set_code: string;
  set_name: string;
  image_url: string;
  raw_crop_url?: string | null;
  rarity?: string | null;
  language?: string;
  user_id: string;
  created_at: string;
  quantity: number;
  condition?: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  // Data Fetching via Custom Hook
  const { cards: dbCards, isLoading: areCardsLoading, deleteCard } = useCards(user?.id);
  
  // Local state for optimistic updates
  const [localCards, setLocalCards] = useState<CardEntry[] | undefined>(undefined);
  const [filters, setFilters] = useState<CollectionFiltersState>({ query: '', setCode: '', rarity: '', viewMode: 'grid' });
  const [selectedCard, setSelectedCard] = useState<CardEntry | null>(null);
  // FUTURE FEATURE: Card size slider
  // const [cardSize, setCardSize] = useState<number>(() => {
  //   if (typeof window !== 'undefined') {
  //     const saved = localStorage.getItem('cardSize');
  //     return saved ? parseInt(saved, 10) : 200;
  //   }
  //   return 200;
  // });

  useEffect(() => {
    // Initialize local state when dbCards are fetched
    if (dbCards) {
      setLocalCards(dbCards);
    }
  }, [dbCards]);

  // FUTURE FEATURE: Save card size to localStorage
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     localStorage.setItem('cardSize', cardSize.toString());
  //   }
  // }, [cardSize]);

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
          {/* Header Section with integrated filters */}
          <header className="header">
            <div className="header-title-group">
              <h5>My Collection</h5>
            </div>
            
            <div className="user-stats">
              <span className="stat-item">Collected: {totalCollected}</span>
              <span className="stat-separator"> · </span>
              <span className="stat-item">Total Quantity: {totalQuantity}</span>
              <span className="stat-separator"> · </span>
              <span className="stat-item">Sets: {uniqueSets}</span>
            </div>

            <CollectionFilters 
              value={filters}
              onChange={setFilters}
              setOptions={[...new Set((localCards || []).map((c) => c.set_code).filter(Boolean))] as string[]}
              rarityOptions={[...new Set((localCards || []).map((c) => c.rarity).filter(Boolean))] as string[]}
            />
          </header>
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
                const matchesRarity = !filters.rarity || c.rarity === filters.rarity;
                return matchesQuery && matchesSet && matchesRarity;
              })}
              onCardClick={setSelectedCard}
              onDelete={handleDeleteCard}
            />
          ) : (
            <div className="card-grid" data-testid="card-grid">
              {(localCards || [])
                .filter((c) => {
                  const q = filters.query.trim().toLowerCase();
                  const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.number.toLowerCase().includes(q);
                  const matchesSet = !filters.setCode || c.set_code === filters.setCode;
                  const matchesRarity = !filters.rarity || c.rarity === filters.rarity;
                  return matchesQuery && matchesSet && matchesRarity;
                })
                .map((card) => (
                  <TradingCard
                    key={card.id}
                    name={card.name}
                    imageUrl={card.image_url}
                    number={card.number}
                    setCode={card.set_code}
                    setName={card.set_name}
                    language={card.language}
                    quantity={card.quantity}
                    condition={card.condition}
                    onClick={() => setSelectedCard(card)}
                  />
                ))}
            </div>
          )}
        </section>
      </div>
      {/* End scroll-wrapper */}

      {/* Floating Card Size Slider - DISABLED - Future feature */}
      {/* {filters.viewMode === 'grid' && (localCards?.length ?? 0) > 0 && (
        <div className="card-size-slider">
          <label htmlFor="card-size-range">Card Size</label>
          <input
            id="card-size-range"
            type="range"
            min="120"
            max="300"
            step="20"
            value={cardSize}
            onChange={(e) => setCardSize(parseInt(e.target.value, 10))}
          />
          <span className="size-label">{cardSize}px</span>
        </div>
      )} */}

      {/* Modal for table view card details */}
      {selectedCard && (
        <CardDetailModal
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
            language: selectedCard.language || 'en',
          }}
          onDeleteCard={async (cardId: string) => {
            handleDeleteCard(cardId, selectedCard.name);
            setSelectedCard(null);
          }}
          onLanguageChange={async (cardId: string, newLanguage: string) => {
            const response = await fetch(`/api/user-cards/${cardId}/language`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ language: newLanguage }),
            });
            if (!response.ok) throw new Error('Failed to update language');
            // Update local state
            setLocalCards((prev) =>
              (prev || []).map((c) =>
                c.id === cardId ? { ...c, language: newLanguage } : c
              )
            );
            setSelectedCard((prev) => prev ? { ...prev, language: newLanguage } : prev);
          }}
          onReplaced={(updated) => {
            // Update collection list
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
            // Keep modal open and reflect updated details
            setSelectedCard((prev) => prev ? {
              ...prev,
              name: updated.name,
              image_url: updated.imageUrl,
              number: updated.number,
              set_code: updated.setCode,
              set_name: updated.setName,
            } : prev);
          }}
        />
      )}

      <style jsx>{`
        .collection-page {
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        /* Header: Edge-to-edge with glass effect */
        .header {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          margin-bottom: 0;
          background: rgba(27, 62, 66, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          gap: 24px;
        }
        .header-title-group h5 {
          margin: 0;
          font-size: var(--font-size-300);
          line-height: 1.2;
        }
        .user-info {
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: normal;
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
        
        /* Scroll wrapper: Main scrolling container */
        .scroll-wrapper {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        /* Sticky header + filters group */
        .sticky-header-group {
          position: sticky;
          top: 0px;
          z-index: 20;
        }
        
        /* Cards: Full width with horizontal padding only */
        .cards-section {
          padding: 12px;
          position: relative;
          z-index: 1;
          margin-bottom: 0px;
        }
        
        /* Table view: needs own scroll container */
        .cards-section--table {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          padding: 0; /* Remove all padding for edge-to-edge table */
          overflow: hidden; /* Contain the table scroll */
        }
        .cards-section--table :global(.table-wrapper) {
          flex: 1;
          min-height: 0;
          max-height: 100%;
          overflow-y: auto;
          overflow-x: auto;
          border-radius: 0; /* Remove border radius for flush edges */
          border-left: none; /* Remove side borders */
          border-right: none;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .header {
            padding: 0 8px;
            gap: 8px;
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-title-group h5 {
            font-size: calc(var(--font-size-300) - 2px);
          }
          
          .user-info {
            font-size: 10px;
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

          .cards-section {
            padding: 12px;
          }
        }

        /* Floating Card Size Slider */
        .card-size-slider {
          position: fixed;
          bottom: 24px;
          top:24px;
          right: 24px;
          background: rgba(27, 62, 66, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 50;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          min-width: 200px;
        }

        .card-size-slider label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          margin: 0;
        }

        .card-size-slider input[type="range"] {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
        }

        .card-size-slider input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--interactive-primary);
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .card-size-slider input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .card-size-slider input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--interactive-primary);
          cursor: pointer;
          border: none;
          transition: transform 0.15s ease;
        }

        .card-size-slider input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        .card-size-slider .size-label {
          font-size: 0.875rem;
          color: var(--text-primary);
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 768px) {
          .card-size-slider {
            bottom: 16px;
            right: 16px;
            min-width: 160px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
}