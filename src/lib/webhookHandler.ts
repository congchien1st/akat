import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : process.env.VITE_SUPABASE_URL || 'https://pmybhyeyienzwgthbfkh.supabase.co';
const supabaseKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODQ2MDAsImV4cCI6MjA1NjU2MDYwMH0.0OKhvJkCUaRmGK1ryttl7yprtltcldjPQ_5xGppxeSs';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface WebhookConfig {
  id: string;
  page_id: string;
  verify_token: string;
  webhook_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get webhook configuration for a page
 */
export async function getWebhookConfig(pageId: string): Promise<WebhookConfig | null> {
  try {
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('page_id', pageId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Not found error
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting webhook config:', error);
    throw error;
  }
}

/**
 * Subscribe to webhook events for violations
 */
export function subscribeToViolations(callback: (violation: any) => void) {
  try {
    const channel = supabase
      .channel('new_violations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'violations'
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Error subscribing to violations:', error);
    return () => {};
  }
}