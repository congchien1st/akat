import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : process.env.VITE_SUPABASE_URL || 'https://pmybhyeyienzwgthbfkh.supabase.co';
const supabaseKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODQ2MDAsImV4cCI6MjA1NjU2MDYwMH0.0OKhvJkCUaRmGK1ryttl7yprtltcldjPQ_5xGppxeSs';

let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Missing Supabase environment variables');
  // Create a mock client that won't throw errors
  supabase = {
    from: () => ({
      insert: () => Promise.resolve({ data: null, error: null }),
      select: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        limit: () => Promise.resolve({ data: null, error: null }),
        select: () => Promise.resolve({ data: null, error: null })
      })
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
    },
    channel: () => ({
      on: () => ({
        subscribe: () => {}
      })
    }),
    removeChannel: () => {}
  };
}

export interface WebhookConfig {
  id: string;
  page_id: string;
  verify_token: string;
  webhook_url: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: string;
      value: any;
    }>;
  }>;
}

/**
 * Verify webhook request from Facebook
 */
export const verifyWebhook = async (mode: string, token: string, challenge: string): Promise<string | null> => {
  try {
    // Check if mode is 'subscribe'
    if (mode !== 'subscribe') {
      console.error('Invalid webhook mode:', mode);
      return null;
    }
    
    // For simplicity, always accept the default token
    if (token === 'akamediaplatfrom9924') {
      console.log('Webhook verified with default token');
      return challenge;
    }
    
    // Get all verify tokens from database
    const { data: configs, error } = await supabase
      .from('webhook_configs')
      .select('verify_token');
    
    if (error) {
      console.error('Error fetching webhook configs:', error);
      return null;
    }
    
    // Check if the token matches any of our stored tokens
    const validToken = configs?.some(config => config.verify_token === token);
    
    if (!validToken) {
      console.error('Invalid webhook token:', token);
      return null;
    }
    
    // Return the challenge string to confirm verification
    return challenge;
  } catch (error) {
    console.error('Error in verifyWebhook:', error);
    return null;
  }
};

/**
 * Process webhook event from Facebook
 */
export const processWebhookEvent = async (event: WebhookEvent): Promise<boolean> => {
  try {
    // Check if this is a page event
    if (event.object !== 'page') {
      console.error('Received non-page event:', event.object);
      return false;
    }
    
    // Store the webhook in the webhook_logs table
    const { error: insertError } = await supabase
      .from('webhook_logs')
      .insert({
        source: 'facebook',
        event_type: 'page',
        payload: event,
        processed: false
      });
    
    if (insertError) {
      console.error('Error storing webhook:', insertError);
      throw insertError;
    }
    
    // The PostgreSQL trigger will handle the processing
    return true;
  } catch (error) {
    console.error('Error processing webhook event:', error);
    
    // Log error to database
    await supabase
      .from('error_logs')
      .insert({
        error_type: 'webhook_processing',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        details: { event }
      });
    
    return false;
  }
};

/**
 * Get webhook configuration for a page
 */
export const getWebhookConfig = async (pageId: string): Promise<WebhookConfig | null> => {
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
};

/**
 * Subscribe to webhook events for violations
 */
export const subscribeToViolations = (callback: (violation: any) => void) => {
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
};