import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL || 'https://lacapogzijbmabzwxexl.supabase.co';
    const key = process.env.SUPABASE_ANON_KEY || 'sb_publishable_DejGix6k_acJ5nHZ00wdqQ_c1EdW0Fz';
    this.client = createClient(url, key);
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
