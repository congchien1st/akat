/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_FACEBOOK_APP_ID: string;
  readonly VITE_FACEBOOK_APP_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  FB: any;
  fbAsyncInit?: () => void;
}

declare namespace FB {
  interface AuthResponse {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
    status?: string;
  }

  interface StatusResponse {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse: AuthResponse;
  }

  interface LoginOptions {
    scope?: string;
    return_scopes?: boolean;
    enable_profile_selector?: boolean;
    auth_type?: string;
  }

  function init(options: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
    status?: boolean;
  }): void;

  function getLoginStatus(
    callback: (response: StatusResponse) => void,
    force?: boolean
  ): void;

  function login(
    callback: (response: StatusResponse) => void,
    options?: LoginOptions
  ): void;

  function api(
    path: string,
    params: any,
    callback: (response: any) => void
  ): void;
}