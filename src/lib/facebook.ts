import { useAuthStore } from '../store/authStore';
import { supabase } from './supabase';

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  connected: boolean;
  avatar_url?: string | null;
  follower_count?: number | null;
  page_url?: string | null;
  page_type?: 'classic' | 'new' | null;
}

// Required Facebook permissions
export const REQUIRED_PERMISSIONS = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'pages_messaging',
  'pages_manage_metadata',
  'pages_manage_engagement'
];

let fbSDKInitialized = false;

// Initialize Facebook SDK
export function initFacebookSDK(): Promise<void> {
  if (fbSDKInitialized) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
      reject(new Error('Facebook App ID is not configured'));
      return;
    }

    // Add Facebook SDK script
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    window.fbAsyncInit = function() {
      FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
      
      fbSDKInitialized = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Facebook SDK'));
    };
  });
}

// Login with Facebook
export function loginWithFacebook(): Promise<FB.AuthResponse> {
  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        if (response.status === 'connected') {
          resolve(response.authResponse);
        } else {
          reject(new Error('Facebook login failed or was cancelled'));
        }
      },
      { scope: REQUIRED_PERMISSIONS.join(',') }
    );
  });
}

// Get Facebook Pages
export async function getFacebookPages(accessToken: string): Promise<FacebookPage[]> {
  return new Promise((resolve, reject) => {
    FB.api(
      '/me/accounts',
      { access_token: accessToken },
      async (response) => {
        if (!response || response.error) {
          reject(new Error(response?.error?.message || 'Failed to fetch pages'));
          return;
        }

        const pages = response.data.map((page: any) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          category: page.category || 'Unknown',
          connected: false,
          avatar_url: page.picture?.data?.url,
          follower_count: page.followers_count || page.fan_count,
          page_url: page.link,
          page_type: page.followers_count ? 'new' : 'classic'
        }));

        resolve(pages);
      }
    );
  });
}

// Get Facebook Page Info
export async function getFacebookPageInfo(pageId: string, accessToken: string): Promise<FacebookPage> {
  return new Promise((resolve, reject) => {
    FB.api(
      `/${pageId}`,
      { 
        access_token: accessToken,
        fields: 'name,category,picture,followers_count,fan_count,link'
      },
      (response) => {
        if (!response || response.error) {
          reject(new Error(response?.error?.message || 'Failed to fetch page info'));
          return;
        }

        resolve({
          id: pageId,
          name: response.name,
          access_token: accessToken,
          category: response.category || 'Unknown',
          connected: true,
          avatar_url: response.picture?.data?.url,
          follower_count: response.followers_count || response.fan_count,
          page_url: response.link,
          page_type: response.followers_count ? 'new' : 'classic'
        });
      }
    );
  });
}

// Connect Facebook Page
export async function connectFacebookPage(page: FacebookPage) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if page is already connected
    const { data: existingConnection } = await supabase
      .from('facebook_connections')
      .select('*')
      .eq('page_id', page.id)
      .eq('user_id', user.id)
      .single();

    if (existingConnection) {
      // Update existing connection
      await supabase
        .from('facebook_connections')
        .update({
          access_token: page.access_token,
          status: 'connected',
          last_sync: new Date().toISOString()
        })
        .eq('id', existingConnection.id);
    } else {
      // Create new connection
      const { data: connection } = await supabase
        .from('facebook_connections')
        .insert({
          user_id: user.id,
          page_id: page.id,
          access_token: page.access_token,
          status: 'connected',
          permissions: REQUIRED_PERMISSIONS
        })
        .select()
        .single();

      if (connection) {
        // Add page details
        await supabase
          .from('facebook_page_details')
          .insert({
            connection_id: connection.id,
            page_name: page.name,
            page_category: page.category,
            page_avatar_url: page.avatar_url,
            follower_count: page.follower_count,
            page_url: page.page_url,
            page_type: page.page_type
          });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error connecting Facebook page:', error);
    throw error;
  }
}

// Disconnect Facebook Page
export async function disconnectFacebookPage(pageId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update connection status to disconnected
    const { error } = await supabase
      .from('facebook_connections')
      .update({
        status: 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('page_id', pageId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting Facebook page:', error);
    throw error;
  }
}

// Refresh Page Connection
export async function refreshPageConnection(pageId: string, accessToken: string): Promise<FacebookPage> {
  try {
    // Get updated page info from Facebook
    const pageInfo = await getFacebookPageInfo(pageId, accessToken);

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update connection in database
    const { data: connection, error: connectionError } = await supabase
      .from('facebook_connections')
      .update({
        access_token: pageInfo.access_token,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('page_id', pageId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (connectionError) {
      throw connectionError;
    }

    // Update page details
    const { error: detailsError } = await supabase
      .from('facebook_page_details')
      .update({
        page_name: pageInfo.name,
        page_category: pageInfo.category,
        page_avatar_url: pageInfo.avatar_url,
        follower_count: pageInfo.follower_count,
        page_url: pageInfo.page_url,
        page_type: pageInfo.page_type,
        updated_at: new Date().toISOString()
      })
      .eq('connection_id', connection.id);

    if (detailsError) {
      throw detailsError;
    }

    return pageInfo;
  } catch (error) {
    console.error('Error refreshing page connection:', error);
    throw error;
  }
}