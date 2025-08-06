'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/browser';
import { useCards } from '@/hooks/useCards';

import { DraggableCardGrid, type CardEntry } from '@/components/ui/DraggableCardGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { User } from '@supabase/supabase-js';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [enableDrag, setEnableDrag] = useState(false);
  const router = useRouter();

  // Data Fetching via Custom Hook
  const { cards: dbCards, isLoading: areCardsLoading, deleteCard } = useCards(user?.id);
  
  // Local state for optimistic reordering
  const [localCards, setLocalCards] = useState<CardEntry[] | undefined>(undefined);

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

  return (
    <div className="container">
      {/* Header Section */}
      <header className="header">
        <div className="header-left">
          <h1>My Collection</h1>  
          <p className="user-info">Welcome back, {user.email}!</p>
        </div>
        <div className="header-right">
          <button 
            className={`drag-toggle ${enableDrag ? 'drag-toggle--active' : ''}`}
            onClick={() => setEnableDrag(!enableDrag)}
            aria-label={enableDrag ? 'Disable drag mode' : 'Enable drag mode'}
          >
            {enableDrag ? '🔓 Drag Enabled' : '🔒 Drag Disabled'}
          </button>
        </div>
      </header>

      {/* Stats Section */}
      <section className="stats-section">
          <div className="stats-grid">
            <MetricCard title="Collected" value={localCards?.length ?? 0} />
            <MetricCard title="Total Quantity" value={localCards?.reduce((sum: number, card: CardEntry) => sum + (card.quantity || 1), 0) ?? 0} />
            <MetricCard title="Sets" value={localCards ? new Set(localCards.map((card: CardEntry) => card.set_code)).size : 0} />
          </div>
      </section>

      {/* Cards Grid Section */}
      <section className="cards-section">
          {areCardsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading your collection...</p>
            </div>
          ) : (localCards?.length ?? 0) === 0 ? (
            <EmptyState
              title='No cards yet. Upload your first scan to begin!'
              description="Start building your collection by uploading Pokemon card images."
            />
          ) : (
            <DraggableCardGrid 
              cards={localCards || []} 
              onReorder={handleReorder}
              onDelete={handleDeleteCard}
              enableDrag={enableDrag}
            />
          )}
      </section>

      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-8);
          flex-wrap: wrap;
          gap: var(--spacing-4);
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
      `}</style>
    </div>
  );
}