import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isClientSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('[PROJEKT]') &&
    !supabaseAnonKey.includes('vas-')
);

export const supabaseClient = isClientSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
