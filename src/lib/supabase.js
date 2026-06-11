import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseAuthStorageKey = getSupabaseAuthStorageKey(supabaseUrl)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storageKey: supabaseAuthStorageKey || 'habitropolis-auth-token',
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    },
  }
)

function getSupabaseAuthStorageKey(url) {
  if (!url) return null

  try {
    const { hostname } = new URL(url)
    const [projectRef] = hostname.split('.')

    return projectRef ? `sb-${projectRef}-auth-token` : null
  } catch {
    return null
  }
}

export function clearSupabaseAuthSession() {
  if (typeof window === 'undefined' || !supabaseAuthStorageKey) return

  window.localStorage.removeItem(supabaseAuthStorageKey)
  window.sessionStorage.removeItem(supabaseAuthStorageKey)
}
