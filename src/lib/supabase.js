import { createClient } from '@supabase/supabase-js';

// For client-side usage
const supabaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || 'https://pmybhyeyienzwgthbfkh.supabase.co', supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODQ2MDAsImV4cCI6MjA1NjU2MDYwMH0.0OKhvJkCUaRmGK1ryttl7yprtltcldjPQ_5xGppxeSs', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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
export async function handleSupabaseError(promise) {
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