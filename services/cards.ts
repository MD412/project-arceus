import { supabase } from '@/lib/supabase/browser';

export async function getCards(userId: string) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteCard(cardId: string) {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId);

  if (error) {
    throw new Error(error.message);
  }

  return cardId;
} 