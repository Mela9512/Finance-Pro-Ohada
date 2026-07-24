import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lacapogzijbmabzwxexl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DejGix6k_acJ5nHZ00wdqQ_c1EdW0Fz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
