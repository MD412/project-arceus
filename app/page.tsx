'use client';

import { useEffect, useState } from 'react';
import { supabase, signOut, getCurrentUser } from '@/lib/supabase';
import { SimpleCardGrid } from '@/components/simple-card-grid';
import UploadCardForm from '@/components/UploadCardForm';
// import { Button, Card, StatsCard, EmptyState, MetricCard } from '@/components/ui'; // Old barrel import
import { Button } from '@/components/ui/Button';
import { Card, StatsCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { useRouter } from 'next/navigation';

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
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (!currentUser) {
        // User is not logged in, redirect to login
        router.push('/login');
        return;
      }
      
      // User is logged in, load their cards
      loadCards();
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
        return;
      }
      
      // Clear local state
      setUser(null);
      setUserCards([]);
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Unexpected logout error:', error);
      alert('Error logging out. Please try again.');
    }
  }

  async function loadCards() {
    console.log('🔄 Loading cards from database...');
    
    try {
      console.log('👤 Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000001';
      
      console.log('👤 Loading cards for user:', userId);
      
      console.log('🔍 Executing Supabase query...');
      
      // TEMPORARY: Check if we can query without RLS constraints
      console.log('🔧 Testing basic query capabilities...');
      const testQuery = await supabase.from('user_cards').select('count');
      console.log('🧪 Test query result:', testQuery);
      
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
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('✅ Loaded cards from database:', data?.length || 0, 'cards');
      console.log('📊 Card data (raw):', data);
      
      // Transform returned rows so `cards` is a single object (first element)
      console.log('🔄 Processing card data...');
      const processed: UserCard[] = (data as RawUserCard[] ?? []).map((row) => ({
        ...row,
        cards: Array.isArray(row.cards) ? row.cards[0] : (row.cards as unknown as CardDetail),
      }));
      console.log('✅ Processed card data:', processed);

      setUserCards(processed);
      console.log('🎉 Cards loaded successfully!');
    } catch (err: unknown) {
      console.error('💥 Error loading cards:', err);
      console.error('💥 Error type:', typeof err);
      console.error('💥 Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('💥 Final error message:', errorMessage);
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

  // Show loading state
  if (isLoading) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  // If no user, the useEffect will redirect to login
  if (!user) {
    return null;
  }

  return (
    <main className="container">
      {/* Header Section */}
      <header className="header">
        <div className="header-left">
          <h1>Project Arceus Collection</h1>
          <p className="user-info">Welcome back, {user.email}!</p>
        </div>
        <div className="header-right">
          <Button onClick={() => setShowForm(true)}>
            + Add Card
          </Button>
          <Button 
            onClick={handleLogout}
            style={{ 
              background: '#ef4444', 
              marginLeft: '0.5rem',
              border: '1px solid #dc2626'
            }}
          >
            Logout
          </Button>
        </div>
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
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
        }
        
        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-right {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
