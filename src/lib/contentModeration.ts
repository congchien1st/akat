import { supabase } from './supabase';
import axios from 'axios';

export interface ModerationPrompt {
  id: string;
  prompt: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacebookPost {
  id: string;
  page_id: string;
  post_id: string;
  message: string;
  created_time: string;
  status: 'pending' | 'approved' | 'violated';
  moderation_result?: {
    violates: boolean;
    category: string | null;
    reason: string | null;
    confidence: number | null;
    processed_at: string;
  };
  moderated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Get current moderation prompt
export async function getModerationPrompt(): Promise<ModerationPrompt> {
  try {
    const { data, error } = await supabase
      .from('moderation_prompts')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching moderation prompt:', error);
    
    // Return a default prompt if none exists
    return {
      id: 'default',
      prompt: 'You are a content moderation system for Facebook posts. Your task is to analyze the content of posts and determine if they violate community standards.\n\nAnalyze the post for the following violations:\n1. Hate speech or discrimination\n2. Violence or threats\n3. Nudity or sexual content\n4. Harassment or bullying\n5. Spam or misleading content\n6. Illegal activities\n7. Self-harm or suicide\n8. Misinformation\n\nRespond with a JSON object in the following format:\n{\n  "violates": boolean,\n  "category": string or null,\n  "reason": string or null,\n  "confidence": number between 0 and 1\n}\n\nWhere:\n- "violates" is true if the post violates community standards, false otherwise\n- "category" is the category of violation (one of the 8 listed above), or null if no violation\n- "reason" is a brief explanation of why the post violates standards, or null if no violation\n- "confidence" is your confidence level in the assessment (0.0 to 1.0)\n\nBe thorough but fair in your assessment. If you are unsure, err on the side of caution.',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// Update moderation prompt
export async function updateModerationPrompt(prompt: string): Promise<ModerationPrompt> {
  try {
    // Deactivate all existing prompts
    await supabase
      .from('moderation_prompts')
      .update({ active: false })
      .eq('active', true);
    
    // Create new active prompt
    const { data, error } = await supabase
      .from('moderation_prompts')
      .insert({
        prompt,
        active: true
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating moderation prompt:', error);
    throw error;
  }
}

// Get moderated posts with pagination
export async function getModeratedPosts(
  status?: 'pending' | 'approved' | 'violated',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<FacebookPost>> {
  try {
    let query = supabase
      .from('facebook_posts')
      .select('*', { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error, count } = await query
      .order('created_time', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) {
      throw error;
    }
    
    return {
      data: data || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching moderated posts:', error);
    
    // Return empty data if error
    return {
      data: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        pages: 0
      }
    };
  }
}

// Send test notification
export async function sendTestNotification(
  type: 'email' | 'lark' | 'zalo',
  recipient: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    // For email notifications
    if (type === 'email') {
      // Create a test notification log
      const { data, error } = await supabase
        .from('notification_logs')
        .insert({
          post_id: null, // No specific post
          notification_type: 'email',
          recipient: recipient,
          status: 'sent',
          details: { 
            subject: 'Test Notification from AKA Platform',
            body: 'This is a test notification from the AKA Platform. If you received this email, your notification system is working correctly.'
          }
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { success: true, messageId: data.id };
    }
    
    // For future integrations
    throw new Error(`${type} notifications not yet implemented`);
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}

// Get Facebook pages for the current user
export async function getUserFacebookPages() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data: connections, error } = await supabase
      .from('facebook_connections')
      .select(`
        id, page_id, status, last_sync,
        facebook_page_details(page_name, page_avatar_url, follower_count)
      `)
      .eq('user_id', user.id)
      .eq('status', 'connected');
    
    if (error) {
      throw error;
    }
    
    return connections.map(conn => ({
      id: conn.id,
      pageId: conn.page_id,
      pageName: conn.facebook_page_details?.[0]?.page_name || 'Unnamed Page',
      avatarUrl: conn.facebook_page_details?.[0]?.page_avatar_url,
      followerCount: conn.facebook_page_details?.[0]?.follower_count,
      lastSync: conn.last_sync
    }));
  } catch (error) {
    console.error('Error fetching user Facebook pages:', error);
    return [];
  }
}