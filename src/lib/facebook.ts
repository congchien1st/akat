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

export interface FacebookConnection {
  userId: string;
  pageId: string;
  accessToken: string;
  permissions: string[];
  status: 'connected' | 'disconnected';
  lastSync: string;
}

// Required Facebook permissions for the app
export const REQUIRED_PERMISSIONS = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'pages_messaging',
  'pages_manage_metadata',
  'pages_manage_engagement'
];

let fbSDKInitialized = false;

// Khởi tạo Facebook SDK
export function initFacebookSDK() {
  if (fbSDKInitialized) {
    return Promise.resolve();
  }

  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  if (!appId) {
    return Promise.reject(new Error('Facebook App ID is not configured'));
  }

  return new Promise<void>((resolve, reject) => {
    try {
      // Load SDK asynchronously if not already loaded
      if (!document.getElementById('facebook-jssdk')) {
        const js = document.createElement('script');
        js.id = 'facebook-jssdk';
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        js.onerror = () => reject(new Error('Failed to load Facebook SDK'));
        const fjs = document.getElementsByTagName('script')[0];
        fjs.parentNode?.insertBefore(js, fjs);
      }

      // Initialize the SDK once loaded
      window.fbAsyncInit = function() {
        try {
          FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v19.0',
            status: true // Enable status checking
          });
          fbSDKInitialized = true;
          console.log('Facebook SDK initialized successfully');
          resolve();
        } catch (error) {
          console.error('FB.init error:', error);
          reject(error instanceof Error ? error : new Error('Failed to initialize Facebook SDK'));
        }
      };
    } catch (error) {
      console.error('SDK setup error:', error);
      reject(error instanceof Error ? error : new Error('Failed to setup Facebook SDK'));
    }
  });
}

// Kiểm tra trạng thái đăng nhập Facebook
export async function checkLoginState(): Promise<FB.AuthResponse> {
  await initFacebookSDK();
  return new Promise((resolve, reject) => {
    FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        resolve(response.authResponse);
      } else {
        reject(new Error('Not logged in to Facebook'));
      }
    });
  });
}

// Đăng nhập Facebook và yêu cầu quyền quản lý Page
export async function loginWithFacebook(): Promise<FB.AuthResponse> {
  await initFacebookSDK();
  return new Promise((resolve, reject) => {
    FB.login(function(response) {
      console.log('FB.login response:', response);
      if (response.status === 'connected') {
        resolve(response.authResponse);
      } else {
        reject(new Error('Facebook login failed or was cancelled by user'));
      }
    }, {
      scope: REQUIRED_PERMISSIONS.join(','),
      return_scopes: true, // Return granted scopes
      enable_profile_selector: true // Enable page selection
    });
  });
}

// Xác định loại Page (classic hoặc new)
function determinePageType(page: any): 'classic' | 'new' | null {
  // Các Page mới thường không có trường fan_count mà có trường followers_count
  // Hoặc có thể kiểm tra các trường khác đặc trưng cho từng loại
  if (page.hasOwnProperty('followers_count') && !page.hasOwnProperty('fan_count')) {
    return 'new';
  } else if (page.hasOwnProperty('fan_count')) {
    return 'classic';
  }
  
  // Nếu không thể xác định rõ ràng
  return null;
}

// Lấy số lượng người theo dõi từ dữ liệu Page
function getFollowerCount(page: any): number | null {
  // Ưu tiên sử dụng followers_count cho Page mới
  if (page.hasOwnProperty('followers_count') && typeof page.followers_count === 'number') {
    return page.followers_count;
  }
  
  // Sử dụng fan_count cho Page cổ điển
  if (page.hasOwnProperty('fan_count') && typeof page.fan_count === 'number') {
    return page.fan_count;
  }
  
  return 0;
}

// Lấy danh sách Facebook Pages
export async function getFacebookPages(accessToken: string): Promise<FacebookPage[]> {
  await initFacebookSDK();
  return new Promise((resolve, reject) => {
    FB.api('/me/accounts', { 
      access_token: accessToken,
      fields: 'id,name,access_token,category,picture,fan_count,followers_count,link'
    }, function(response) {
      console.log('FB.api /me/accounts response:', response);
      if (!response || response.error) {
        reject(new Error(response?.error?.message || 'Failed to fetch pages'));
        return;
      }
      
      if (!response.data || !Array.isArray(response.data)) {
        reject(new Error('Invalid response format from Facebook API'));
        return;
      }
      
      resolve(response.data.map((page: any) => {
        const pageType = determinePageType(page);
        const followerCount = getFollowerCount(page);
        
        return {
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          category: page.category || 'Unknown',
          connected: false,
          avatar_url: page.picture?.data?.url || null,
          follower_count: followerCount,
          page_url: page.link || null,
          page_type: pageType
        };
      }));
    });
  });
}

// Verify page permissions
async function verifyPagePermissions(pageId: string, accessToken: string) {
  return new Promise<{ success: boolean; missingPermissions: string[] }>((resolve) => {
    FB.api(
      `/${pageId}/permissions`,
      { access_token: accessToken },
      function(response) {
        if (!response || response.error) {
          resolve({ success: false, missingPermissions: REQUIRED_PERMISSIONS });
          return;
        }

        const grantedPermissions = response.data.map((p: any) => p.permission);
        const missingPermissions = REQUIRED_PERMISSIONS.filter(
          permission => !grantedPermissions.includes(permission)
        );

        resolve({
          success: missingPermissions.length === 0,
          missingPermissions
        });
      }
    );
  });
}

// Tự động thiết lập webhook khi kết nối page
async function setupWebhookForPage(pageId: string, accessToken: string) {
  try {
    // Sử dụng token mặc định
    const verifyToken = 'akamediaplatfrom9924';
    
    // Lấy URL webhook từ domain hiện tại
    const baseUrl = window.location.origin;
    const webhookUrl = `${baseUrl}/webhook`;
    
    // Kiểm tra xem webhook config đã tồn tại chưa
    const { data: existingConfig, error: checkError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('page_id', pageId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing webhook config:', checkError);
      return false;
    }
    
    // Nếu đã tồn tại, cập nhật
    if (existingConfig) {
      const { error: updateError } = await supabase
        .from('webhook_configs')
        .update({
          verify_token: verifyToken,
          webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id);
      
      if (updateError) {
        console.error('Error updating webhook config:', updateError);
        return false;
      }
    } else {
      // Nếu chưa tồn tại, tạo mới
      const { error: insertError } = await supabase
        .from('webhook_configs')
        .insert({
          page_id: pageId,
          verify_token: verifyToken,
          webhook_url: webhookUrl
        });
      
      if (insertError) {
        console.error('Error inserting webhook config:', insertError);
        return false;
      }
    }
    
    // Đăng ký webhook với Facebook
    try {
      await subscribeAppToPage(pageId, accessToken);
      return true;
    } catch (err) {
      console.error('Error auto-registering webhook:', err);
      return false;
    }
  } catch (error) {
    console.error('Error setting up webhook:', error);
    return false;
  }
}

// Đăng ký webhook với Facebook
export async function subscribeAppToPage(pageId: string, accessToken: string): Promise<boolean> {
  await initFacebookSDK();
  
  return new Promise((resolve, reject) => {
    FB.api(
      `/${pageId}/subscribed_apps`,
      'POST',
      {
        access_token: accessToken,
        // Sử dụng 'feed' thay vì 'comments' vì Facebook API v18.0+ không còn hỗ trợ 'comments'
        // 'feed' sẽ bao gồm cả sự kiện về bài viết và bình luận
        subscribed_fields: ['feed', 'messages']
      },
      function(response) {
        if (!response || response.error) {
          console.error('Error subscribing app to page:', response?.error);
          reject(new Error(response?.error?.message || 'Failed to subscribe app to page'));
          return;
        }
        
        if (response.success) {
          resolve(true);
        } else {
          reject(new Error('Unknown error subscribing app to page'));
        }
      }
    );
  });
}

export const connectFacebookPage = async (page: FacebookPage) => {
  try {
    console.log('Connecting page:', page);
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Current user:', user.id);
    
    // Check if the page is already connected
    const { data: existingConnection, error: checkError } = await supabase
      .from('facebook_connections')
      .select('*')
      .eq('page_id', page.id)
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing connection:', checkError);
      throw new Error('Failed to check existing connection');
    }

    console.log('Existing connection:', existingConnection);

    let connectionId;

    if (existingConnection) {
      // Update existing connection
      connectionId = existingConnection.id;
      
      const { error: updateError } = await supabase
        .from('facebook_connections')
        .update({
          access_token: page.access_token,
          status: 'connected',
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);

      if (updateError) {
        console.error('Error updating connection:', updateError);
        throw updateError;
      }
      
      console.log('Updated existing connection');
      
      // Check if page details exist
      const { data: existingDetails, error: detailsCheckError } = await supabase
        .from('facebook_page_details')
        .select('*')
        .eq('connection_id', connectionId)
        .single();
        
      if (detailsCheckError && detailsCheckError.code !== 'PGRST116') {
        console.error('Error checking existing details:', detailsCheckError);
        throw detailsCheckError;
      }
      
      if (existingDetails) {
        // Update page details
        const { error: detailsUpdateError } = await supabase
          .from('facebook_page_details')
          .update({
            page_name: page.name,
            page_category: page.category,
            page_avatar_url: page.avatar_url || null,
            follower_count: page.follower_count || 0,
            page_url: page.page_url || null,
            page_type: page.page_type || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDetails.id);

        if (detailsUpdateError) {
          console.error('Error updating page details:', detailsUpdateError);
          throw detailsUpdateError;
        }
        
        console.log('Updated page details');
      } else {
        // Insert page details
        const { error: detailsInsertError } = await supabase
          .from('facebook_page_details')
          .insert({
            connection_id: connectionId,
            page_name: page.name,
            page_category: page.category,
            page_avatar_url: page.avatar_url || null,
            follower_count: page.follower_count || 0,
            page_url: page.page_url || null,
            page_type: page.page_type || null
          });

        if (detailsInsertError) {
          console.error('Error inserting page details:', detailsInsertError);
          throw detailsInsertError;
        }
        
        console.log('Inserted page details for existing connection');
      }
    } else {
      // Create new connection
      console.log('Creating new connection for page:', page.name);
      
      // First, insert the connection
      const { data: newConnection, error: insertError } = await supabase
        .from('facebook_connections')
        .insert({
          user_id: user.id,
          page_id: page.id,
          access_token: page.access_token,
          status: 'connected',
          permissions: REQUIRED_PERMISSIONS,
          last_sync: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting connection:', insertError);
        throw insertError;
      }

      if (!newConnection) {
        throw new Error('Failed to create connection - no data returned');
      }

      console.log('Created new connection:', newConnection);
      connectionId = newConnection.id;

      // Then, insert page details
      console.log('Inserting page details for connection ID:', connectionId);
      const { data: pageDetails, error: detailsError } = await supabase
        .from('facebook_page_details')
        .insert({
          connection_id: connectionId,
          page_name: page.name,
          page_category: page.category,
          page_avatar_url: page.avatar_url || null,
          follower_count: page.follower_count || 0,
          page_url: page.page_url || null,
          page_type: page.page_type || null
        })
        .select();

      if (detailsError) {
        console.error('Error inserting page details:', detailsError);
        throw detailsError;
      }
      
      console.log('Inserted page details:', pageDetails);
    }

    // Set up webhook for the page
    await setupWebhookForPage(page.id, page.access_token);

    return { success: true, connectionId };
  } catch (error) {
    console.error('Error connecting Facebook page:', error);
    throw error;
  }
};

export const disconnectFacebookPage = async (pageId: string) => {
  try {
    const { error } = await supabase
      .from('facebook_connections')
      .update({
        status: 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('page_id', pageId);

    if (error) {
      console.error('Error disconnecting page:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting Facebook page:', error);
    throw error;
  }
};

export async function refreshPageConnection(pageId: string, accessToken: string): Promise<FacebookPage> {
  await initFacebookSDK();
  
  try {
    // Get updated page info from Facebook
    const pageInfo = await getFacebookPageInfo(pageId, accessToken);

    // Verify permissions
    const permissionsResponse = await verifyPagePermissions(pageId, pageInfo.access_token);
    if (!permissionsResponse.success) {
      throw new Error(`Missing required permissions: ${permissionsResponse.missingPermissions.join(', ')}`);
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Update connection in database
    const { error: connectionError } = await supabase
      .from('facebook_connections')
      .update({
        access_token: pageInfo.access_token,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('page_id', pageId)
      .eq('user_id', user.id);

    if (connectionError) {
      console.error('Error updating connection:', connectionError);
      throw connectionError;
    }

    // Get connection to update page details
    const { data: connection, error: getError } = await supabase
      .from('facebook_connections')
      .select('id')
      .eq('page_id', pageId)
      .eq('user_id', user.id)
      .single();

    if (getError) {
      console.error('Error getting connection:', getError);
      throw getError;
    }

    // Get existing page details
    const { data: existingDetails, error: detailsCheckError } = await supabase
      .from('facebook_page_details')
      .select('id')
      .eq('connection_id', connection.id)
      .single();
      
    if (detailsCheckError && detailsCheckError.code !== 'PGRST116') {
      console.error('Error checking existing details:', detailsCheckError);
      throw detailsCheckError;
    }
    
    if (existingDetails) {
      // Update page details
      const { error: detailsError } = await supabase
        .from('facebook_page_details')
        .update({
          page_name: pageInfo.name,
          page_category: pageInfo.category,
          page_avatar_url: pageInfo.avatar_url || null,
          follower_count: pageInfo.follower_count || 0,
          page_url: pageInfo.page_url || null,
          page_type: pageInfo.page_type || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDetails.id);

      if (detailsError) {
        console.error('Error updating page details:', detailsError);
        throw detailsError;
      }
    } else {
      // Insert page details if they don't exist
      const { error: insertError } = await supabase
        .from('facebook_page_details')
        .insert({
          connection_id: connection.id,
          page_name: pageInfo.name,
          page_category: pageInfo.category,
          page_avatar_url: pageInfo.avatar_url || null,
          follower_count: pageInfo.follower_count || 0,
          page_url: pageInfo.page_url || null,
          page_type: pageInfo.page_type || null
        });

      if (insertError) {
        console.error('Error inserting page details:', insertError);
        throw insertError;
       }
    }

    return pageInfo;
  } catch (error) {
    console.error('Error refreshing page connection:', error);
    throw error;
  }
}

export async function getFacebookPageInfo(pageId: string, accessToken: string): Promise<FacebookPage> {
  await initFacebookSDK();
  return new Promise((resolve, reject) => {
    FB.api(
      `/${pageId}`,
      { 
        access_token: accessToken,
        fields: 'name,category,fan_count,followers_count,picture,link'
      },
      function(response) {
        if (!response || response.error) {
          reject(new Error(response?.error?.message || 'Failed to fetch page info'));
          return;
        }
        
        const pageType = determinePageType(response);
        const followerCount = getFollowerCount(response);
        
        resolve({
          id: pageId,
          name: response.name,
          access_token: accessToken,
          category: response.category || 'Unknown',
          connected: true,
          avatar_url: response.picture?.data?.url || null,
          follower_count: followerCount,
          page_url: response.link || null,
          page_type: pageType
        });
      }
    );
  });
}