'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/browser';
import { useCards } from '@/hooks/useCards';

import { SimpleCardGrid } from '@/components/simple-card-grid';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { User } from '@supabase/supabase-js';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
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

  return (
    <main className="container">
      {/* Header Section */}
      <header className="header">
        <div className="header-left">
          <h1>My Collection</h1>  
          <p className="user-info">Welcome back, {user.email}!</p>
        </div>
      </header>

      {/* Stats Section */}
      <section className="stats-section">
        <Card>
          <div className="stats-grid">
            <MetricCard title="Collected" value={cards?.length ?? 0} />
            <MetricCard title="Missing" value={27} />
            <MetricCard title="Trading" value={3} />
          </div>
        </Card>
      </section>

      {/* Cards Grid Section */}
      <section className="cards-section">
        <Card>
          {areCardsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading cards...</p>
            </div>
          ) : (cards?.length ?? 0) === 0 ? (
            <EmptyState
              title='No cards yet. Click "Add Card" to begin.'
              description="Start building your collection!"
            />
          ) : (
            <SimpleCardGrid cards={cards || []} onDelete={handleDeleteCard} />
          )}
        </Card>
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
      `}</style>
    </main>
  );
}