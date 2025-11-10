// src/services/spotifyAuth.ts
// Spotify PKCE auth (no client secret). Full surface: login, handleCallback,
// getAccessToken, refreshAccessToken, getAuthState, getUser, logout.

type AuthState = {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
  scope: string;
  token_type: 'Bearer';
  user?: { id: string; display_name?: string; images?: { url: string }[] };
};

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI!;
const STORAGE_KEY = 'fonea_spotify_auth_v1';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
].join(' ');

const DEV = import.meta.env.DEV;

function log(...args: any[]) {
  if (DEV) console.log('[SpotifyAuth]', ...args);
}

function logError(...args: any[]) {
  if (DEV) console.error('[SpotifyAuth]', ...args);
}

function toB64Url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  return await crypto.subtle.digest('SHA-256', data);
}

function randHex(len = 64) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
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
  return await fetchJSON('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export const spotifyAuth = {
  // Opens Spotify's consent screen
  async login() {
    log('=== Starting login flow ===');
    
    if (!CLIENT_ID) {
      logError('VITE_SPOTIFY_CLIENT_ID is not set!');
      alert('Configuration error: Missing Spotify Client ID');
      return;
    }
    
    if (!REDIRECT_URI) {
      logError('VITE_SPOTIFY_REDIRECT_URI is not set!');
      alert('Configuration error: Missing Redirect URI');
      return;
    }
    
    log('Client ID:', CLIENT_ID);
    log('Redirect URI:', REDIRECT_URI);
    
    const state = randHex(16);
    const verifier = randHex(64);
    const challenge = toB64Url(await sha256(verifier));
    
    sessionStorage.setItem('spotify_pkce_verifier', verifier);
    sessionStorage.setItem('spotify_auth_state', state);
    
    log('Generated PKCE params:', {
      state,
      verifierLength: verifier.length,
      challengeLength: challenge.length,
    });

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('code_challenge', challenge);

    const finalUrl = authUrl.toString();
    log('=== Authorization URL ===');
    log('Full URL:', finalUrl);
    log('Parameters:', Object.fromEntries(authUrl.searchParams.entries()));
    
    // Give user a moment to see the logs
    setTimeout(() => {
      log('Redirecting to Spotify...');
      window.location.href = finalUrl;
    }, DEV ? 500 : 0);
  },

  // Handles code → tokens on /callback
  async handleCallback(code: string, state: string): Promise<boolean> {
    log('=== Handling OAuth callback ===');
    log('Received code:', code.substring(0, 20) + '...');
    log('Received state:', state);
    
    const storedState = sessionStorage.getItem('spotify_auth_state');
    const verifier = sessionStorage.getItem('spotify_pkce_verifier');
    
    log('Stored state:', storedState);
    log('Stored verifier:', verifier ? `${verifier.substring(0, 20)}... (${verifier.length} chars)` : 'null');
    
    sessionStorage.removeItem('spotify_auth_state');
    sessionStorage.removeItem('spotify_pkce_verifier');
    
    if (!verifier) {
      logError('❌ No PKCE verifier found in sessionStorage!');
      return false;
    }
    
    if (!storedState) {
      logError('❌ No state found in sessionStorage!');
      return false;
    }
    
    if (storedState !== state) {
      logError('❌ State mismatch!', { stored: storedState, received: state });
      return false;
    }
    
    log('✅ State validated');

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    });
    
    log('Token exchange body:', Object.fromEntries(body.entries()));

    try {
      const tokenData = await fetchJSON('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
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
        const me = await getMe(auth.access_token);
        auth.user = { 
          id: me.id, 
          display_name: me.display_name, 
          images: me.images 
        };
        log('✅ User profile loaded:', { id: me.id, name: me.display_name });
      } catch (err) {
        logError('Failed to fetch user profile (non-fatal):', err);
      }

      save(auth);
      log('=== ✅ Login successful ===');
      return true;
      
    } catch (err: any) {
      logError('=== ❌ Token exchange failed ===');
      logError(err);
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

  // Explicit refresh for hooks
  async refreshAccessToken(): Promise<boolean> {
    log('=== Refreshing access token ===');
    const auth = load();
    
    if (!auth?.refresh_token) {
      logError('No refresh token available');
      clear();
      return false;
    }

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: auth.refresh_token,
    });

    try {
      const tokenData = await fetchJSON('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
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
  
  logout() { 
    log('Logging out');
    clear(); 
  },
};
