import { supabase } from './supabase';
import axios from 'axios';

export interface WebhookConfig {
  id?: string;
  page_id: string;
  verify_token: string;
  webhook_url: string;
}

export interface FacebookApp {
  id: string;
  name: string;
}

export interface FacebookWebhookSubscription {
  object: string;
  callback_url: string;
  fields: string[];
  active: boolean;
}

/**
 * Generate a random verify token
 */
export function generateVerifyToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Save webhook configuration to database
 */
export async function saveWebhookConfig(config: WebhookConfig): Promise<WebhookConfig> {
  try {
    const { data, error } = await supabase
      .from('webhook_configs')
      .upsert({
        page_id: config.page_id,
        verify_token: config.verify_token,
        webhook_url: config.webhook_url,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error saving webhook config:', error);
    throw error;
  }
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
 * Set up webhook automatically
 * This would require Facebook Graph API access with appropriate permissions
 */
export async function setupWebhookAutomatically(
  pageId: string, 
  accessToken: string, 
  appId: string,
  webhookUrl: string,
  verifyToken: string,
  fields: string[] = ['feed', 'messages']
): Promise<boolean> {
  try {
    // This is a simplified example - in a real implementation, you would:
    // 1. Create or update webhook subscription using Facebook Graph API
    // 2. Subscribe the page to the webhook
    
    // For demonstration purposes, we'll just save the config locally
    await saveWebhookConfig({
      page_id: pageId,
      verify_token: verifyToken,
      webhook_url: webhookUrl
    });
    
    // Log the action
    await supabase
      .from('automation_logs')
      .insert({
        event_type: 'webhook_setup',
        payload: {
          page_id: pageId,
          app_id: appId,
          webhook_url: webhookUrl,
          fields,
          timestamp: new Date().toISOString()
        },
        status: 'success'
      });
    
    return true;
  } catch (error) {
    console.error('Error setting up webhook automatically:', error);
    
    // Log the error
    await supabase
      .from('error_logs')
      .insert({
        error_type: 'webhook_setup',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        details: { pageId, appId, webhookUrl }
      });
    
    throw error;
  }
}

/**
 * Test webhook connection
 */
export async function testWebhookConnection(config: WebhookConfig): Promise<boolean> {
  try {
    // In a real implementation, you would send a test event to the webhook
    // and verify that it's received correctly
    
    // For demonstration purposes, we'll just check if the URL is reachable
    const response = await axios.get(config.webhook_url, { 
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });
    
    // Log the test result
    await supabase
      .from('automation_logs')
      .insert({
        event_type: 'webhook_test',
        payload: {
          page_id: config.page_id,
          webhook_url: config.webhook_url,
          status_code: response.status,
          timestamp: new Date().toISOString()
        },
        status: response.status >= 200 && response.status < 300 ? 'success' : 'failed'
      });
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('Error testing webhook connection:', error);
    
    // Log the error
    await supabase
      .from('error_logs')
      .insert({
        error_type: 'webhook_test',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        details: { config }
      });
    
    return false;
  }
}

/**
 * Get webhook subscription status
 * This would require Facebook Graph API access with appropriate permissions
 */
export async function getWebhookSubscriptionStatus(
  appId: string,
  accessToken: string
): Promise<FacebookWebhookSubscription[]> {
  try {
    // In a real implementation, you would call the Facebook Graph API
    // to get the current webhook subscriptions
    
    // For demonstration purposes, we'll return a mock response
    return [
      {
        object: 'page',
        callback_url: 'https://example.com/webhook',
        fields: ['feed', 'messages'],
        active: true
      }
    ];
  } catch (error) {
    console.error('Error getting webhook subscription status:', error);
    throw error;
  }
}