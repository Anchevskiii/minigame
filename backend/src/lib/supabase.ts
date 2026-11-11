import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  return (
    Boolean(url) &&
    Boolean(key) &&
    url.startsWith('https://') &&
    !url.includes('[PROJEKT]') &&
    !key.includes('vas-')
  );
}

export const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;
