import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = !!(url && key);

export const supabase: SupabaseClient = supabaseEnabled
  ? createClient(url!, key!)
  : createClient('https://placeholder.supabase.co', 'placeholder');
