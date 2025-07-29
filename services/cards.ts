import { getSupabaseClient } from '@/lib/supabase/browser';

const supabase = getSupabaseClient();

export async function getCards(userId: string) {
  const { data, error } = await supabase
    .from('user_cards')
    .select(`
      id,
      quantity,
      created_at,
      card:cards(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Transform the nested data to match the expected CardEntry interface
  return data?.map((userCard: any) => ({
    id: userCard.id, // user_cards id for deletion
    name: userCard.card?.name || '',
    number: userCard.card?.card_number || '', // Fixed: use card_number from schema
    set_code: userCard.card?.set_code || '',
    set_name: userCard.card?.set_name || '',
    image_url: userCard.card?.image_urls?.large || userCard.card?.image_urls?.small || '', // Fixed: handle JSONB image_urls
    user_id: userId, // Add this for compatibility
    created_at: userCard.created_at,
    quantity: userCard.quantity || 1, // Ensure quantity is always present
  })).filter((card: any) => card.name) || []; // Filter out cards with missing data
}

export async function deleteCard(userCardId: string) {
  const { error } = await supabase
    .from('user_cards')
    .delete()
    .eq('id', userCardId);

  if (error) {
    throw new Error(error.message);
  }

  return userCardId;
} 