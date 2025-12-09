// src/services/youtubeAuth.ts
// YouTube OAuth 2.0 PKCE authentication (using Vercel serverless function)
// ✅ UPDATED: Calls /api/youtube-token instead of Google directly
// ✅ FIXED: Uses shared pkceHelper with no expiry

import {
  generatePKCEParams,
  storePKCEParams,
  retrievePKCEParams,
  clearPKCEParams,
  validateState,
} from './youtube/pkceHelper';

type AuthState = {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
  scope: string;
  token_type: 'Bearer';
  user?: { id: string; display_name?: string; picture?: string };
};

const CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID!;
const REDIRECT_URI = import.meta.env.VITE_YOUTUBE_REDIRECT_URI!;
const STORAGE_KEY = 'fonea_youtube_auth_v1';
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtubepartner',
].join(' ');

const DEV = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[YouTubeAuth]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[YouTubeAuth]', ...args);
}

function load(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      log('No stored auth state found');
      return null;
    }
    const state = JSON.parse(raw) as AuthState;
    log('Loaded auth state:', {
      hasToken: !!state.access_token,
      hasRefresh: !!state.refresh_token,
      expiresAt: new Date(state.expires_at).toISOString(),
      userId: state.user?.id,
    });
    return state;
  } catch (err) {
    logError('Failed to load auth state:', err);
    return null;
  }
}

function save(s: AuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    log('Saved auth state:', {
      hasToken: !!s.access_token,
      hasRefresh: !!s.refresh_token,
      expiresAt: new Date(s.expires_at).toISOString(),
      userId: s.user?.id,
    });
  } catch (err) {
    logError('Failed to save auth state:', err);
  }
}

function clear() {
  localStorage.removeItem(STORAGE_KEY);
  log('Cleared auth state');
}

async function fetchJSON(input: RequestInfo, init?: RequestInit) {
  log('Fetching:', input);
  const res = await fetch(input, init);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logError('Fetch failed:', {
      url: input,
      status: res.status,
      statusText: res.statusText,
      body: text.substring(0, 500),
    });
    throw new Error(`${res.status}: ${text}`);
  }

  const json = await res.json();
  log('Fetch success:', input);
  return json;
}

async function getMe(token: string) {
  return await fetchJSON(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export const youtubeAuth = {
  // Opens Google's OAuth consent screen
  async login() {
    log('=== Starting YouTube login flow ===');

    if (!CLIENT_ID) {
      logError('VITE_YOUTUBE_CLIENT_ID is not set!');
      alert('Configuration error: Missing YouTube Client ID');
      return;
    }

    if (!REDIRECT_URI) {
      logError('VITE_YOUTUBE_REDIRECT_URI is not set!');
      alert('Configuration error: Missing YouTube Redirect URI');
      return;
    }

    log('Client ID:', CLIENT_ID);
    log('Redirect URI:', REDIRECT_URI);

    // Generate PKCE parameters
    const { verifier, challenge, state } = await generatePKCEParams();

    // ✅ Store in localStorage (no expiry)
    storePKCEParams('youtube', verifier, state);

    // Build authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('access_type', 'offline'); // For refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen

    const finalUrl = authUrl.toString();
    log('=== Authorization URL ===');
    log('Full URL:', finalUrl);
    log('Parameters:', Object.fromEntries(authUrl.searchParams.entries()));

    // Redirect to Google
    setTimeout(() => {
      log('Redirecting to Google OAuth...');
      window.location.href = finalUrl;
    }, DEV ? 500 : 0);
  },

  // Handles OAuth callback: code → tokens (via Vercel serverless function)
  async handleCallback(code: string, state: string): Promise<boolean> {
    log('=== Handling YouTube OAuth callback ===');
    log('Received code:', code.substring(0, 20) + '...');
    log('Received state:', state);

    // Retrieve stored PKCE params
    const { verifier } = retrievePKCEParams('youtube');

    // Validate state (CSRF protection)
    if (!validateState('youtube', state)) {
      logError('❌ State validation failed');
      clearPKCEParams('youtube');
      return false;
    }

    if (!verifier) {
      logError('❌ No PKCE verifier found in localStorage!');
      clearPKCEParams('youtube');
      return false;
    }

    log('✅ State validated');

    try {
      // ✅ Call our Vercel serverless function instead of Google directly
      log('Calling /api/youtube-token (serverless function)...');

      const tokenData = await fetchJSON('/api/youtube-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier,
        }),
      });

      log('Token response received:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
      });

      const now = Date.now();
      const auth: AuthState = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: now + (tokenData.expires_in - 60) * 1000,
        scope: tokenData.scope,
        token_type: 'Bearer',
      };

      // Fetch user info
      try {
        log('Fetching user profile...');
        const channelData = await getMe(auth.access_token);
        if (channelData.items && channelData.items.length > 0) {
          const channel = channelData.items[0];
          auth.user = {
            id: channel.id,
            display_name: channel.snippet?.title,
            picture: channel.snippet?.thumbnails?.default?.url,
          };
          log('✅ User profile loaded:', {
            id: channel.id,
            name: channel.snippet?.title,
          });
        }
      } catch (err) {
        logError('Failed to fetch user profile (non-fatal):', err);
      }

      save(auth);
      
      // ✅ Clear PKCE params after successful auth
      clearPKCEParams('youtube');
      
      // Dispatch event to notify components
      window.dispatchEvent(new Event('youtube-auth-changed'));
      
      log('=== ✅ YouTube login successful ===');
      return true;
    } catch (err: unknown) {
      logError('=== ❌ Token exchange failed ===');
      logError(err);
      clearPKCEParams('youtube');
      return false;
    }
  },

  // Returns a valid access token (refreshes if needed)
  async getAccessToken(): Promise<string | null> {
    log('getAccessToken() called');
    const auth = load();

    if (!auth) {
      log('No auth state - user not logged in');
      return null;
    }

    const now = Date.now();
    const timeUntilExpiry = auth.expires_at - now;

    log('Token status:', {
      expiresAt: new Date(auth.expires_at).toISOString(),
      timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000)}s`,
      isExpired: now >= auth.expires_at,
    });

    if (now < auth.expires_at && auth.access_token) {
      log('✅ Token is still valid');
      return auth.access_token;
    }

    log('Token expired or missing, attempting refresh...');
    const ok = await this.refreshAccessToken();

    if (!ok) {
      logError('Refresh failed');
      return null;
    }

    const refreshed = load();
    log('✅ Token refreshed successfully');
    return refreshed?.access_token ?? null;
  },

  // Explicit token refresh (via Vercel serverless function)
  async refreshAccessToken(): Promise<boolean> {
    log('=== Refreshing YouTube access token ===');
    const auth = load();

    if (!auth?.refresh_token) {
      logError('No refresh token available');
      clear();
      return false;
    }

    try {
      // ✅ Call our Vercel serverless function instead of Google directly
      log('Calling /api/youtube-token (serverless function) for refresh...');

      const tokenData = await fetchJSON('/api/youtube-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: auth.refresh_token,
        }),
      });

      log('Refresh response:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      });

      const now = Date.now();
      const next: AuthState = {
        ...auth,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? auth.refresh_token,
        expires_at: now + (tokenData.expires_in - 60) * 1000,
        scope: tokenData.scope ?? auth.scope,
      };

      save(next);
      log('=== ✅ Token refreshed ===');
      return true;
    } catch (err) {
      logError('=== ❌ Refresh failed ===');
      logError(err);
      clear();
      return false;
    }
  },

  // For UI/hooks
  getAuthState(): AuthState | null {
    return load();
  },

  getUser() {
    const state = load();
    return state?.user ?? null;
  },

  isAuthenticated(): boolean {
    const state = load();
    if (!state) return false;
    return Date.now() < state.expires_at;
  },

  logout() {
    log('Logging out');
    clear();
    // ✅ Also clear any leftover PKCE params
    clearPKCEParams('youtube');
    window.dispatchEvent(new Event('youtube-auth-changed'));
  },
};
