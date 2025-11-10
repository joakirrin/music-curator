// src/types/spotify.ts
// Type definitions for Spotify OAuth and user data

export type SpotifyAuthState = {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;        // Unix timestamp (milliseconds)
  user: SpotifyUser | null;
  scopes: string[];
};

export type SpotifyUser = {
  id: string;
  displayName: string;
  email?: string;
  images?: Array<{ 
    url: string; 
    height: number; 
    width: number;
  }>;
  product?: 'free' | 'premium';    // Subscription type
  country?: string;
  externalUrls?: {
    spotify: string;                // Link to user's Spotify profile
  };
};

// Scopes we need for Phase 3 features
export const SPOTIFY_SCOPES = [
  'user-read-private',              // Read user profile
  'user-read-email',                // Read user email
  'playlist-read-private',          // Read private playlists
  'playlist-read-collaborative',    // Read collaborative playlists
  'playlist-modify-public',         // Create/modify public playlists
  'playlist-modify-private',        // Create/modify private playlists
  'user-library-read',              // Read saved tracks (for import feature)
] as const;

// Spotify API response types
export type SpotifyTokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;               // Seconds until expiry
  refresh_token: string;
  scope: string;
};