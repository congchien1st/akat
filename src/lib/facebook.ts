import {supabase} from "./supabase";
import axios from "axios";

// import { getCurrentBaseUrl } from '../pages/resource/fetch-data.js';

function getCurrentBaseUrl() {
    if (typeof window !== "undefined") {
        const isLocal = window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";
        return isLocal
            ? "http://127.0.0.1:54321"
            : "https://pmybhyeyienzwgthbfkh.supabase.co";
    } else {
        // fallback nếu chạy trong SSR hoặc Deno (không phải browser)
        return "https://pmybhyeyienzwgthbfkh.supabase.co";
    }
}

export interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    category: string;
    connected: boolean;
    avatar_url?: string | null;
    follower_count?: number | null;
    page_url?: string | null;
    page_type?: "classic" | "new" | null;
}

// Required Facebook permissions
export const REQUIRED_PERMISSIONS = [
    "pages_manage_posts", // Manage posts on behalf of the page
    "pages_read_engagement", // Read engagement metrics
    "pages_show_list", // Show list of pages
    "pages_messaging", // Manage messaging
    "pages_manage_metadata", // Manage page metadata
    "pages_manage_engagement", // Manage engagement
    "pages_read_user_content", // Read user content
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
            reject(new Error("Facebook App ID is not configured"));
            return;
        }

        // Add Facebook SDK script
        const script = document.createElement("script");
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        document.body.appendChild(script);

        window.fbAsyncInit = function () {
            FB.init({
                appId: appId,
                cookie: true,
                xfbml: true,
                version: "v19.0",
            });

            fbSDKInitialized = true;
            resolve();
        };

        script.onerror = () => {
            reject(new Error("Failed to load Facebook SDK"));
        };
    });
}

// Login with Facebook
export function loginWithFacebook(): Promise<FB.AuthResponse> {
    return new Promise((resolve, reject) => {
        FB.login(
            (response) => {
                if (response.status === "connected") {
                    resolve(response.authResponse);
                } else {
                    reject(new Error("Facebook login failed or was cancelled"));
                }
            },
            { scope: REQUIRED_PERMISSIONS.join(",") },
        );
    });
}

// Exchange short-lived token for long-lived token
export async function exchangeForLongLivedToken(
    shortLivedToken: string,
): Promise<string> {
    try {
        /**
         * truy cập biến môi trường
         * + trong frontend bằng Vite => import.meta.env.VITE_MY_ENV_VAR
         * + trong BE => process.env.MY_ENV_VAR
         * Các biến phải bắt đầu bằng VITE_ thì mới được expose ra frontend.
         */
        const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
        const appSecret = import.meta.env.VITE_FACEBOOK_APP_SECRET;

        if (!appId || !appSecret) {
            throw new Error("Facebook App ID or App Secret is not configured");
        }

        // Make the API call to exchange the token
        const response = await axios.get(
            `https://graph.facebook.com/v22.0/oauth/access_token`,
            {
                params: {
                    grant_type: "fb_exchange_token",
                    client_id: appId,
                    client_secret: appSecret,
                    fb_exchange_token: shortLivedToken,
                },
            },
        );

        if (response.data && response.data.access_token) {
            return response.data.access_token;
        } else {
            throw new Error("Failed to obtain long-lived token");
        }
    } catch (error) {
        console.error("Error exchanging for long-lived token:", error);
        throw error;
    }
}

// Exchange page token for long-lived page token
export async function getLongLivedPageToken(
    pageId: string,
    userAccessToken: string,
): Promise<string> {
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v22.0/${pageId}`,
            {
                params: {
                    fields: "access_token",
                    access_token: userAccessToken,
                },
            },
        );

        if (response.data && response.data.access_token) {
            return response.data.access_token;
        } else {
            throw new Error("Failed to obtain page token");
        }
    } catch (error) {
        console.error("Error getting long-lived page token:", error);
        throw error;
    }
}

// Get Facebook Pages
export async function getFacebookPages(
    accessToken: string,
): Promise<FacebookPage[]> {
    return new Promise((resolve, reject) => {
        FB.api(
            "me/accounts?fields=id,name,link,category,picture{url},is_published,verification_status,tasks",
            { access_token: accessToken },
            async (response) => {
                if (!response || response.error) {
                    reject(
                        new Error(
                            response?.error?.message || "Failed to fetch pages",
                        ),
                    );
                    return;
                }
                // console.log("RESPONSE: " + JSON.stringify(response));

                /**
                 * is_published: Page có đang công khai (public) hay không
                 * verification_status: Page đã được xác minh (blue tick) chưa
                 * tasks: Vai trò/tác vụ của người dùng trên page
                 */
                const pages = response.data.map((page: any) => ({
                    id: page.id,
                    name: page.name,
                    page_url: page.link,
                    category: page.category || "Unknown",
                    avatar_url: page.picture?.data?.url,
                    connected: page.is_published,
                    verification_status: page.verification_status,
                    tasks: page.tasks
                }));
                // tra ve danh sach cac fanpages
                resolve(pages);
            },
        );
    });
}

// Get Facebook Page Info
export async function getFacebookPageInfo(
    pageId: string,
    accessToken: string,
): Promise<FacebookPage> {
    return new Promise((resolve, reject) => {
        FB.api(
            `/${pageId}`,
            {
                access_token: accessToken,
                fields: "name,category,picture,followers_count,fan_count,link",
            },
            (response) => {
                if (!response || response.error) {
                    reject(
                        new Error(
                            response?.error?.message ||
                                "Failed to fetch page info",
                        ),
                    );
                    return;
                }

                resolve({
                    id: pageId,
                    name: response.name,
                    access_token: accessToken,
                    category: response.category || "Unknown",
                    connected: true,
                    avatar_url: response.picture?.data?.url,
                    follower_count: response.followers_count ||
                        response.fan_count,
                    page_url: response.link,
                    page_type: response.followers_count ? "new" : "classic",
                });
            },
        );
    });
}

// Connect Facebook Page
export async function connectFacebookPage(page: FacebookPage) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("User not authenticated");
        }

        // First exchange the user token for a long-lived user token
        const longLivedUserToken = await exchangeForLongLivedToken(
            page.access_token,
        );

        // Then get a long-lived page token using the long-lived user token
        const longLivedPageToken = await getLongLivedPageToken(
            page.id,
            longLivedUserToken,
        );

        // Check if page is already connected
        const { data: existingConnection } = await supabase
            .from("facebook_connections")
            .select("*")
            .eq("page_id", page.id)
            .eq("user_id", user.id)
            .single();  // chi tra ve 1 ban ghi duy nhat

        if (existingConnection) {
            await supabase
                .from("facebook_connections")
                .update({
                    access_token: longLivedPageToken,
                    status: "connected",
                    last_sync: new Date().toISOString(),
                })
                .eq("id", existingConnection.id);

            await supabase
                .from("facebook_page_insights")
                .update({ status: "connected" })
                .eq("connection_id", existingConnection.id);
        } else {
            // Create new connection
            const { data: connection } = await supabase
                .from("facebook_connections")
                .insert({
                    user_id: user.id,
                    page_id: page.id,
                    access_token: longLivedPageToken,
                    status: "connected",
                    permissions: REQUIRED_PERMISSIONS,
                    last_sync: new Date().toISOString(),
                })
                .select()
                .single();

            if (connection) {
                // Add page details
                await supabase
                    .from("facebook_page_details")
                    .insert({
                        connection_id: connection.id,
                        page_name: page.name,
                        page_category: page.category,
                        page_avatar_url: page.avatar_url,
                        page_url: page.page_url,
                        page_id: page.id
                        // page_type: page.page_type,
                    });
            }


            const {data: dataSession, error} = await supabase.auth.getSession();
            if (error || !dataSession.session) {
                console.error("No session found", error);
                return [];
            }

            const baseUrl = getCurrentBaseUrl();
            const url = baseUrl + "/functions/v1/fetch-graph-and-save-database";

            await fetch(`${url}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${dataSession.session.access_token}`,
                },
                body: JSON.stringify({
                    connectionId: connection.id
                })
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error connecting Facebook page:", error);
        throw error;
    }
}

// Disconnect Facebook Page
export async function disconnectFacebookPage(
    pageId: string,
    connectionId: string,
) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("User not authenticated");
        }

        // Update connection status to disconnected
        const { error } = await supabase
            .from("facebook_connections")
            .update({
                status: "disconnected",
                updated_at: new Date().toISOString(),
            })
            .eq("page_id", pageId)
            .eq("user_id", user.id);

        const { error: errorConnectionId } = await supabase
            .from("facebook_page_insights")
            .update({ status: "disconnected" })
            .eq("connection_id", connectionId)
            .eq("user_id", user.id);

        if (errorConnectionId) {
            console.error("Lỗi cập nhật trạng thái:", errorConnectionId);
        } else {
            console.log("Cập nhật trạng thái thành công");
        }

        return { success: true };
    } catch (error) {
        console.error("Error disconnecting Facebook page:", error);
        throw error;
    }
}

// Refresh Page Connection
export async function refreshPageConnection(
    pageId: string,
    accessToken: string,
): Promise<FacebookPage> {
    try {
        // console.log("Refreshing page connection for page ID:", pageId);

        // First exchange for a long-lived user token
        const longLivedUserToken = await exchangeForLongLivedToken(accessToken);
        // console.log("Obtained long-lived user token");

        // Then get a long-lived page token
        const longLivedPageToken = await getLongLivedPageToken(
            pageId,
            longLivedUserToken,
        );
        // console.log("Obtained long-lived page token");

        // Get updated page info using the long-lived token
        const pageInfo = await getFacebookPageInfo(pageId, longLivedPageToken);

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("User not authenticated");
        }

        // Update connection in database
        const { data: connection, error: connectionError } = await supabase
            .from("facebook_connections")
            .update({
                access_token: longLivedPageToken,
                last_sync: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("page_id", pageId)
            .eq("user_id", user.id)
            .select()
            .single();

        if (connectionError) {
            throw connectionError;
        }

        // Update page details
        const { error: detailsError } = await supabase
            .from("facebook_page_details")
            .update({
                page_name: pageInfo.name,
                page_category: pageInfo.category,
                page_avatar_url: pageInfo.avatar_url,
                follower_count: pageInfo.follower_count,
                page_url: pageInfo.page_url,
                page_type: pageInfo.page_type,
                updated_at: new Date().toISOString(),
            })
            .eq("connection_id", connection.id);

        if (detailsError) {
            throw detailsError;
        }

        return pageInfo;
    } catch (error) {
        console.error("Error refreshing page connection:", error);
        throw error;
    }
}
