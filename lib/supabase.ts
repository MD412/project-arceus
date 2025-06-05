import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// This creates a Supabase client for use in client components
export const supabase = createClientComponentClient()

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
