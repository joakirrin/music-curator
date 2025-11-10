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
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch { return null; }
}
function save(s: AuthState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function clear() { localStorage.removeItem(STORAGE_KEY); }

async function fetchJSON(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}:${text}`);
  }
  return await res.json();
}
async function getMe(token: string) {
  return await fetchJSON('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export const spotifyAuth = {
  // Opens Spotify’s consent screen
  async login() {
    const state = randHex(16);
    const verifier = randHex(64);
    const challenge = toB64Url(await sha256(verifier));
    sessionStorage.setItem('spotify_pkce_verifier', verifier);
    sessionStorage.setItem('spotify_auth_state', state);

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('code_challenge', challenge);

    // debug aid:
    // console.log('PKCE →', authUrl.toString());
    window.location.href = authUrl.toString();
  },

  // Handles code → tokens on /callback
  async handleCallback(code: string, state: string): Promise<boolean> {
    const storedState = sessionStorage.getItem('spotify_auth_state');
    const verifier = sessionStorage.getItem('spotify_pkce_verifier');
    sessionStorage.removeItem('spotify_auth_state');
    sessionStorage.removeItem('spotify_pkce_verifier');
    if (!verifier || !storedState || storedState !== state) return false;

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    });

    const tokenData = await fetchJSON('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const now = Date.now();
    const auth: AuthState = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: now + (tokenData.expires_in - 60) * 1000,
      scope: tokenData.scope,
      token_type: 'Bearer',
    };

    try {
      const me = await getMe(auth.access_token);
      auth.user = { id: me.id, display_name: me.display_name, images: me.images };
    } catch { /* ignore */ }

    save(auth);
    return true;
  },

  // Returns a valid access token (refreshes if needed)
  async getAccessToken(): Promise<string | null> {
    const auth = load();
    if (!auth) return null;
    if (Date.now() < auth.expires_at && auth.access_token) return auth.access_token;
    const ok = await this.refreshAccessToken();
    if (!ok) return null;
    return load()?.access_token ?? null;
  },

  // Explicit refresh for hooks
  async refreshAccessToken(): Promise<boolean> {
    const auth = load();
    if (!auth?.refresh_token) { clear(); return false; }

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
      const now = Date.now();
      const next: AuthState = {
        ...auth,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? auth.refresh_token,
        expires_at: now + (tokenData.expires_in - 60) * 1000,
        scope: tokenData.scope ?? auth.scope,
      };
      save(next);
      return true;
    } catch {
      clear();
      return false;
    }
  },

  // For UI/hooks
  getAuthState(): AuthState | null { return load(); },
  getUser() { return load()?.user ?? null; },
  logout() { clear(); },
};
