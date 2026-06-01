/**
 * Supabase public configuration (from NEXT_PUBLIC_* env vars).
 * Install @supabase/supabase-js and add createClient here when needed.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
