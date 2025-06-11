import { getSupabaseClient } from './devAuth'

// Get the Supabase client using environment variables
export const supabase = getSupabaseClient()

// Helper function to check if user is logged in
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}
