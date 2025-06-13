import { createBrowserClient } from '@supabase/ssr';

export const createSupabaseClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

let supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const getSupabaseClient = () => {
  if (supabase) {
    return supabase;
  }
  supabase = createSupabaseClient();
  return supabase;
};

// You can export the functions that use the client directly
// so you don't have to call getSupabaseClient() every time.

export async function getCurrentUser() {
  const client = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

export async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  }
  return error;
} 