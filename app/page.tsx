'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SimpleCardGrid } from '@/components/simple-card-grid';
import UploadCardForm from '@/components/UploadCardForm';
import { Button, Card, StatsCard, EmptyState, MetricCard } from '@/components/ui';

// Define the structure for the nested card details
interface CardDetail {
  id: string;
  name: string;
  number: string;
  set_code: string;
  image_url: string;
}

// Define the structure for a user's card entry
interface UserCard {
  id: string;
  quantity: number;
  condition: string;
  image_url?: string; // Optional: image_url from the user_cards table itself
  cards: CardDetail; // The joined card details, a single object due to !inner join
}

interface RawUserCard extends Omit<UserCard, 'cards'> {
  // Supabase join returns an array; we'll coerce to single object later
  cards: CardDetail[];
}

export default function HomePage() {
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function loadCards() {
    console.log('🔄 Loading cards from database...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000001';
      
      console.log('👤 Loading cards for user:', userId);
      
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          id,
          quantity,
          condition,
          image_url,
          cards!inner (
            id,
            name,
            number,
            set_code,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Database error loading cards:', error);
        throw error;
      }
      
      console.log('✅ Loaded cards from database:', data?.length || 0, 'cards');
      console.log('📊 Card data (raw):', data);
      
      // Transform returned rows so `cards` is a single object (first element)
      const processed: UserCard[] = (data as RawUserCard[] ?? []).map((row) => ({
        ...row,
        cards: Array.isArray(row.cards) ? row.cards[0] : (row.cards as unknown as CardDetail),
      }));

      setUserCards(processed);
    } catch (err: unknown) {
      console.error('💥 Error loading cards:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      alert(`Error loading cards: ${errorMessage}`);
    }
  }

  async function deleteCard(cardId: string, cardName: string) {
    console.log(`🗑️ Attempting to delete card: ${cardName} (ID: ${cardId})`);
    
    try {
      const { error } = await supabase
        .from('user_cards')
        .delete()
        .eq('id', cardId);
      
      if (error) {
        console.error('❌ Supabase delete error:', error);
        alert(`Failed to delete ${cardName}: ${error.message}`);
        return;
      }
      
      console.log(`✅ Successfully deleted ${cardName} from Supabase`);
      
      setUserCards(prev => prev.filter(card => card.id !== cardId));
      
      console.log(`🔄 Updated local state, removed card from UI`);
    } catch (err: unknown) {
      console.error('💥 Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      alert(`Error deleting card: ${errorMessage}`);
    }
  }

  useEffect(() => { loadCards(); }, []);

  return (
    <main className="container">
      {/* Header Section */}
      <header className="header">
        <h1>Project Arceus Collection</h1>
        <Button onClick={() => setShowForm(true)}>
          + Add Card
        </Button>
      </header>

      {/* Stats Section */}
      <section className="stats-section">
        <Card>
          <div className="stats-grid">
            <MetricCard title="Collected" value={userCards.length} />
            <MetricCard title="Missing" value={27} />
            <MetricCard title="Trading" value={3} />
          </div>
        </Card>
      </section>

      {/* Cards Grid Section */}
      <section className="cards-section">
        <Card>
          {userCards.length === 0 ? (
            <EmptyState 
              title='No cards yet. Click "Add Card" to begin.'
              description="Start building your collection!"
            />
          ) : (
            <SimpleCardGrid cards={userCards} onDelete={deleteCard} />
          )}
        </Card>
      </section>

      {showForm && (
        <UploadCardForm
          close={() => setShowForm(false)}
          onAdded={loadCards}
        />
      )}
    </main>
  );
}
