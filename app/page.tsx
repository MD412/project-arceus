'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SimpleCardGrid } from '@/components/simple-card-grid';
import UploadCardForm from '@/components/UploadCardForm';
import { Button, Card, StatsCard, EmptyState } from '@/components/ui';

export default function HomePage() {
  const [userCards, setUserCards] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function loadCards() {
    console.log('🔄 Loading cards from database...');
    
    try {
      // Get the current user from auth (or fallback to hardcoded for testing)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000001'; // fallback for testing
      
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
      console.log('📊 Card data:', data);
      
      setUserCards(data ?? []);
    } catch (err: any) {
      console.error('💥 Error loading cards:', err);
      alert(`Error loading cards: ${err.message}`);
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
      
      // Remove from local state immediately for better UX
      setUserCards(prev => prev.filter(card => card.id !== cardId));
      
      console.log(`🔄 Updated local state, removed card from UI`);
    } catch (err: any) {
      console.error('💥 Unexpected error:', err);
      alert(`Error deleting card: ${err.message}`);
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
            <StatsCard label="Collected" value={userCards.length} />
            <StatsCard label="Missing" value={27} />
            <StatsCard label="Trading" value={3} />
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
