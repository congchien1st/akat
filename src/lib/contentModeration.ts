import { supabase } from './supabase';
import axios from 'axios';
import { getAutomationConfig, updateAutomationConfig } from './automation';

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
  page_name?: string;
  page_avatar_url?: string;
}

export interface ViolationStat {
  violation_type: string;
  count: number;
  percentage: number;
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

export interface FacebookPage {
  id: string;
  pageId: string;
  pageName: string;
  avatarUrl?: string;
  followerCount?: number;
  lastSync: string;
}

export interface PaginatedPages {
  data: FacebookPage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getFacebookPages(
    page: number = 1,
    limit: number = 10,
    search?: string
): Promise<PaginatedPages> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
        .from('facebook_connections')
        .select(`
        id, page_id, status, last_sync,
        facebook_page_details(page_name, page_avatar_url, follower_count)
      `, { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'connected')
        .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`facebook_page_details.page_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query
        .range((page - 5) * limit, page * limit - 5);

    if (error) throw error;

    return {
      data: (data || []).map(conn => ({
        id: conn.id,
        pageId: conn.page_id,
        pageName: conn.facebook_page_details?.[0]?.page_name || 'Unnamed Page',
        avatarUrl: conn.facebook_page_details?.[0]?.page_avatar_url,
        followerCount: conn.facebook_page_details?.[0]?.follower_count,
        lastSync: conn.last_sync
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      }
    };
  }
}


export interface AutoEngineConfig {
  autoHide: boolean;
  autoCorrect: boolean;
  confidenceThreshold: number;
  prompt: string;
}

export async function getPageConfig(pageId: string): Promise<AutoEngineConfig | null> {
  try {
    const config = await getAutomationConfig(pageId, 'moderation');
    return config.config;
  } catch (error) {
    console.error('Error getting page config:', error);
    return null;
  }
}

export async function updatePageConfig(pageId: string, config: AutoEngineConfig): Promise<void> {
  try {
    await updateAutomationConfig(pageId, 'moderation', {
      name: 'Content Moderation',
      description: 'Automated content moderation for Facebook page',
      config,
      is_active: true
    });
  } catch (error) {
    console.error('Error updating page config:', error);
    throw error;
  }
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

// Lấy bài viết đã kiểm duyệt với phân trang
export async function getModeratedPosts(
  status?: 'pending' | 'approved' | 'violated' | 'edited' | 'deleted',
  page: number = 1,
  limit: number = 20,
  search?: string,
  pageId?: string
): Promise<PaginatedResponse<FacebookPost>> {
  try {
    // Bước 1: Lấy danh sách trang người dùng có quyền
    const pageDetails = await getUserFacebookPages();
    
    const pageMap = (pageDetails || []).reduce((acc: Record<string, { page_name: string; page_avatar_url: string }>, page: any) => {
      acc[page.pageId] = {
        page_name: page.pageName,
        page_avatar_url: page.avatarUrl
      };
      return acc;
    }, {} as Record<string, { page_name: string; page_avatar_url: string }>);

    const pageIds = Object.keys(pageMap);
    if (pageIds.length === 0 && !pageId) {
      return {
        data: [],
        pagination: { page, limit, total: 0, pages: 0 }
      };
    }

    // Bước 2: Xây dựng query lấy bài viết
    let query = supabase
      .from('facebook_posts')
      .select('*', { count: 'exact' });

    // Sửa cách truy vấn để tránh lỗi với toán tử OR và IN
    if (pageId) {
      query = query.eq('page_id', pageId);
    } else if (pageIds.length > 0) {
      query = query.in('page_id', pageIds);
    }

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('message', `%${search}%`);

    const offset = (page - 1) * limit;

    const { data: posts, error: postError, count } = await query
      .order('created_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postError) throw postError;

    // Bước 3: Gắn thông tin page vào bài viết
    const transformedData = (posts || []).map(post => ({
      ...post,
      page_name: pageMap[post.page_id]?.page_name || 'Không rõ tên trang',
      page_avatar_url: pageMap[post.page_id]?.page_avatar_url || ''
    }));

    // Bước 4: Trả kết quả phân trang
    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    console.error('Lỗi khi lấy bài viết đã kiểm duyệt:', error);
    return {
      data: [],
      pagination: { page, limit, total: 0, pages: 0 }
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

export async function getModeratedPostsWithFilters(
    pageIds?: string[],
    status?: 'pending' | 'approved' | 'violated',
    startDate?: Date,
    endDate?: Date,
    limit: number = 20,
    offset: number = 0
): Promise<PaginatedResponse<FacebookPost>> {
  try {
    const { data, error } = await supabase.rpc('get_moderated_posts', {
      p_page_ids: pageIds,
      p_status: status,
      p_start_date: startDate?.toISOString(),
      p_end_date: endDate?.toISOString(),
      p_limit: limit,
      p_offset: offset
    });

    if (error) throw error;

    const count = await getModeratedPostsCount(pageIds, status, startDate, endDate);

    return {
      data: data || [],
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (err) {
    console.error('Error fetching moderated posts:', err);
    throw err;
  }
}

export async function getModeratedPostsCount(
    pageIds?: string[],
    status?: 'pending' | 'approved' | 'violated',
    startDate?: Date,
    endDate?: Date
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_moderated_posts_count', {
      p_page_ids: pageIds,
      p_status: status,
      p_start_date: startDate?.toISOString(),
      p_end_date: endDate?.toISOString()
    });

    if (error) throw error;
    return data || 0;
  } catch (err) {
    console.error('Error getting moderated posts count:', err);
    throw err;
  }
}

export async function getViolationStats(
    pageIds?: string[],
    startDate?: Date,
    endDate?: Date
): Promise<ViolationStat[]> {
  try {
    const { data, error } = await supabase.rpc('get_violation_stats', {
      p_page_ids: pageIds,
      p_start_date: startDate?.toISOString(),
      p_end_date: endDate?.toISOString()
    });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error getting violation stats:', err);
    throw err;
  }
}