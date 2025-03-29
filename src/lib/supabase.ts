import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'aka-platform-auth'
  },
  global: {
    headers: {
      'x-application-name': 'aka-platform'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
});

// Add error handling wrapper
export async function handleSupabaseError<T>(promise: Promise<{ data: T | null; error: any }>): Promise<T> {
  try {
    const { data, error } = await promise;
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'An error occurred while fetching data');
    }
    
    if (!data) {
      throw new Error('No data returned from the database');
    }
    
    return data;
  } catch (error) {
    console.error('Error in Supabase operation:', error);
    throw error;
  }
}