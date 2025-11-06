// src/services/spotifyVerification.ts
// Spotify API verification service using Client Credentials flow (no user login required)

import { validateSpotifyUrl, type ValidationResult } from '../utils/linkValidator';
import type { Song } from '../types/song';

// Spotify API endpoints
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Token cache (in-memory for now)
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get Spotify access token using Client Credentials flow
 * This doesn't require user login - just app credentials
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not found in environment variables');
  }

  // Encode credentials as Base64
  const credentials = btoa(`${clientId}:${clientSecret}`);

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Token expires in 3600 seconds, we'll refresh 5 minutes early
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return accessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
}

/**
 * Fetch track metadata from Spotify by track ID
 */
export async function fetchSpotifyTrackMetadata(trackId: string) {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Track not found on Spotify' };
      }
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const track = await response.json();

    // Extract useful metadata
    return {
      success: true,
      data: {
        spotifyId: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album.name,
        albumArt: track.album.images[1]?.url || track.album.images[0]?.url, // 300x300 or largest
        releaseDate: track.album.release_date,
        duration: Math.round(track.duration_ms / 1000), // Convert to seconds
        durationMs: track.duration_ms,
        explicit: track.explicit,
        popularity: track.popularity,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        isPlayable: track.is_playable !== false,
      },
    };
  } catch (error) {
    console.error('Error fetching Spotify track metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify a song by checking if its Spotify URL is valid and the track exists
 */
export async function verifySong(song: Song): Promise<{
  verificationStatus: 'verified' | 'failed';
  verifiedAt: string;
  verificationSource: 'spotify';
  verificationError?: string;
  metadata?: any;
}> {
  // Step 1: Validate URL format
  const urlToCheck = song.spotifyUri || song.spotifyUrl;
  
  if (!urlToCheck) {
    return {
      verificationStatus: 'failed',
      verifiedAt: new Date().toISOString(),
      verificationSource: 'spotify',
      verificationError: 'No Spotify URL provided',
    };
  }

  const validation = validateSpotifyUrl(urlToCheck);
  
  if (!validation.isValid) {
    return {
      verificationStatus: 'failed',
      verifiedAt: new Date().toISOString(),
      verificationSource: 'spotify',
      verificationError: validation.error || 'Invalid Spotify URL format',
    };
  }

  // Step 2: Fetch metadata from Spotify API
  const result = await fetchSpotifyTrackMetadata(validation.trackId!);

  if (!result.success) {
    return {
      verificationStatus: 'failed',
      verifiedAt: new Date().toISOString(),
      verificationSource: 'spotify',
      verificationError: result.error,
    };
  }

  // Step 3: Return success with metadata
  return {
    verificationStatus: 'verified',
    verifiedAt: new Date().toISOString(),
    verificationSource: 'spotify',
    metadata: result.data,
  };
}

/**
 * Verify multiple songs in batch (up to 50 at a time)
 * Returns array of results in same order as input
 */
export async function verifyMultipleSongs(songs: Song[]): Promise<Array<{
  songId: string;
  verificationStatus: 'verified' | 'failed';
  verifiedAt: string;
  verificationSource: 'spotify';
  verificationError?: string;
  metadata?: any;
}>> {
  // For now, verify sequentially
  // TODO: In future, use Spotify's batch endpoint for efficiency
  const results = [];

  for (const song of songs) {
    const result = await verifySong(song);
    results.push({
      songId: song.id,
      ...result,
    });
  }

  return results;
}

/**
 * Update a song with verification results
 */
export function applySongVerification(
  song: Song,
  verificationResult: Awaited<ReturnType<typeof verifySong>>
): Song {
  const updated: Song = {
    ...song,
    verificationStatus: verificationResult.verificationStatus,
    verifiedAt: verificationResult.verifiedAt,
    verificationSource: verificationResult.verificationSource,
    verificationError: verificationResult.verificationError,
  };

  // If verified successfully, merge in the metadata
  if (verificationResult.metadata) {
    const meta = verificationResult.metadata;
    updated.spotifyId = meta.spotifyId;
    updated.spotifyUrl = meta.spotifyUrl;
    updated.albumArt = meta.albumArt;
    updated.releaseDate = meta.releaseDate;
    updated.explicit = meta.explicit;
    updated.popularity = meta.popularity;
    updated.durationMs = meta.durationMs;
    updated.isPlayable = meta.isPlayable;
    updated.previewUrl = meta.previewUrl;
    
    // Update duration if more accurate
    if (meta.duration) {
      updated.duration = meta.duration;
    }
  }

  return updated;
}

/**
 * Check verification cache in localStorage
 * Avoids re-verifying the same track
 */
const CACHE_KEY = 'spotify_verification_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

type VerificationCache = {
  [spotifyId: string]: {
    verifiedAt: string;
    metadata: any;
  };
};

export function getCachedVerification(spotifyId: string): any | null {
  try {
    const cache: VerificationCache = JSON.parse(
      localStorage.getItem(CACHE_KEY) || '{}'
    );
    
    const cached = cache[spotifyId];
    if (!cached) return null;

    // Check if cache is still valid
    const age = Date.now() - new Date(cached.verifiedAt).getTime();
    if (age > CACHE_DURATION) {
      return null;
    }

    return cached.metadata;
  } catch {
    return null;
  }
}

export function setCachedVerification(spotifyId: string, metadata: any): void {
  try {
    const cache: VerificationCache = JSON.parse(
      localStorage.getItem(CACHE_KEY) || '{}'
    );
    
    cache[spotifyId] = {
      verifiedAt: new Date().toISOString(),
      metadata,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching verification:', error);
  }
}
