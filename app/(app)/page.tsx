'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/browser';
import { useCards } from '@/hooks/useCards';

import { DraggableCardGrid } from '@/components/ui/DraggableCardGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { User } from '@supabase/supabase-js';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [enableDrag, setEnableDrag] = useState(false);
  const router = useRouter();

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

  // Data Fetching via Custom Hook
  const { cards, isLoading: areCardsLoading, deleteCard } = useCards(user?.id);
  
  // Mock data for testing
  const mockCards = [
    {
      id: '1',
      name: 'Cynthia\'s Garchomp ex',
      number: 'SIR',
      set_code: 'TEF',
      set_name: 'Temporal Forces',
      image_url: '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 1
    },
    {
      id: '2',
      name: 'Gyarados',
      number: '021',
      set_code: 'MEW',
      set_name: 'Scarlet & Violet',
      image_url: '/ui-playground-pk-img/gyarados.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 2
    },
    {
      id: '3',
      name: 'Sylveon VMAX',
      number: '075',
      set_code: 'EVS',
      set_name: 'Evolving Skies',
      image_url: '/ui-playground-pk-img/slveon.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 1
    },
    {
      id: '4',
      name: 'Walking Wake ex',
      number: '050',
      set_code: 'PAR',
      set_name: 'Paradox Rift',
      image_url: '/ui-playground-pk-img/walking-wake.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 1
    },
    {
      id: '5',
      name: 'Galarian Moltres V',
      number: '097',
      set_code: 'CRE',
      set_name: 'Chilling Reign',
      image_url: '/ui-playground-pk-img/moltres.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 3
    },
    {
      id: '6',
      name: 'Bulbasaur',
      number: '001',
      set_code: 'MEW',
      set_name: 'Scarlet & Violet 151',
      image_url: '/ui-playground-pk-img/bulbasaur.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 4
    },
    {
      id: '7',
      name: 'Pikachu',
      number: '025',
      set_code: 'SVP',
      set_name: 'Scarlet & Violet Promo',
      image_url: '/ui-playground-pk-img/pikachu.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 2
    },
    {
      id: '8',
      name: 'Charizard ex',
      number: '054',
      set_code: 'OBF',
      set_name: 'Obsidian Flames',
      image_url: '/ui-playground-pk-img/sv5-195.webp',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 1
    },
    {
      id: '9',
      name: 'Garchomp ex',
      number: '090',
      set_code: 'PAR',
      set_name: 'Paradox Rift',
      image_url: '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 1
    },
    {
      id: '10',
      name: 'Mewtwo VSTAR',
      number: '031',
      set_code: 'PGO',
      set_name: 'Pokemon GO',
      image_url: '/ui-playground-pk-img/1600.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 1
    },
    {
      id: '11',
      name: 'Gyarados ex',
      number: '187',
      set_code: 'MEW',
      set_name: 'Scarlet & Violet 151',
      image_url: '/ui-playground-pk-img/gyarados.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 1
    },
    {
      id: '12',
      name: 'Pikachu VMAX',
      number: '044',
      set_code: 'VIV',
      set_name: 'Vivid Voltage',
      image_url: '/ui-playground-pk-img/pikachu.jpg',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      quantity: 1
    }
  ];
  
  // Use mock data instead of real cards for now
  const [localCards, setLocalCards] = useState(mockCards);

  const handleDeleteCard = (cardId: string, cardName: string) => {
    if (window.confirm(`Are you sure you want to delete ${cardName}?`)) {
      deleteCard(cardId);
    }
  };

  const handleReorder = (reorderedCards: typeof localCards) => {
    setLocalCards(reorderedCards);
    // TODO: Persist order to database or localStorage
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
            <MetricCard title="Total Quantity" value={localCards.reduce((sum, card) => sum + (card.quantity || 1), 0)} />
            <MetricCard title="Sets" value={new Set(localCards.map(card => card.set_code)).size} />
          </div>
      </section>

      {/* Cards Grid Section */}
      <section className="cards-section">
          {(localCards?.length ?? 0) === 0 ? (
            <EmptyState
              title='No cards yet. Click "Add Card" to begin.'
              description="Start building your collection!"
            />
          ) : (
            <DraggableCardGrid 
              cards={localCards} 
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