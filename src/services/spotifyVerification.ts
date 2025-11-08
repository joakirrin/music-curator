// src/services/spotifyVerification.ts
// Spotify API verification service using Client Credentials flow (no user login required)
// ✅ UPDATED: Now uses Spotify Search API instead of trusting ChatGPT's hallucinated links

import type { Song } from '../types/song';

// Spotify API endpoints
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Token cache (in-memory for now)
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not found in environment variables');
  }

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
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return accessToken! ;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
}

/**
 * ✅ NEW: Calculate string similarity (Levenshtein-based)
 * Returns 0-1 score (1 = identical, 0 = completely different)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // Simple similarity: check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.max(s2.length / s1.length, s1.length / s2.length);
  }
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - matrix[s2.length][s1.length] / maxLength;
}

/**
 * ✅ NEW: Normalize string by removing accents and special characters
 * Helps with searching songs with accented titles (e.g., French songs)
 */
function normalizeString(str: string): string {
  return str
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * ✅ NEW: Try a single search query
 */
async function trySearchQuery(query: string, token: string) {
  const encodedQuery = encodeURIComponent(query);
  
  const response = await fetch(
    `${SPOTIFY_API_BASE}/search?q=${encodedQuery}&type=track&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify Search API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.tracks || !data.tracks.items || data.tracks.items.length === 0) {
    return null;
  }

  return data.tracks.items[0];
}

/**
 * ✅ UPDATED: Search Spotify with fallback strategies
 * Tries multiple search approaches to handle accents, special chars, etc.
 */
export async function searchSpotifyTrack(artist: string, title: string, album?: string) {
  try {
    const token = await getAccessToken();
    
    // Define search strategies (in order of preference)
    const strategies = [
      // Strategy 1: Strict search (artist and track fields)
      { 
        name: 'strict',
        query: `artist:"${artist}" track:"${title}"` 
      },
      
      // Strategy 2: Simple search (just the terms)
      { 
        name: 'simple',
        query: `${artist} ${title}` 
      },
      
      // Strategy 3: Normalized search (remove accents/special chars)
      { 
        name: 'normalized',
        query: `${artist} ${normalizeString(title)}` 
      },
      
      // Strategy 4: Album-based search (if album provided)
      ...(album ? [{
        name: 'album',
        query: `artist:"${artist}" album:"${album}"`
      }] : []),
    ];

    let track = null;
    let successfulStrategy = '';
    let rejectedMatch: any = null;

    // Try each strategy until one works
    for (const strategy of strategies) {
      console.log(`🔍 Trying ${strategy.name} search:`, strategy.query);
      
      try {
        const foundTrack = await trySearchQuery(strategy.query, token);
        
        if (foundTrack) {
          // ✅ NEW: Check artist similarity before accepting
          const foundArtist = foundTrack.artists.map((a: any) => a.name).join(', ');
          const similarity = stringSimilarity(artist, foundArtist);
          
          console.log(`🎯 Match found: "${foundTrack.name}" by ${foundArtist}`);
          console.log(`📊 Artist similarity: ${(similarity * 100).toFixed(1)}%`);
          
          // ✅ NEW: Require at least 60% artist similarity
          if (similarity >= 0.6) {
            track = foundTrack;
            successfulStrategy = strategy.name;
            console.log(`✅ Accepted! Found via ${strategy.name} search`);
            break;
          } else {
            // Track rejected match for feedback
            console.warn(`❌ Rejected: Artist mismatch (${(similarity * 100).toFixed(1)}% similar)`);
            if (!rejectedMatch) {
              rejectedMatch = {
                title: foundTrack.name,
                artist: foundArtist,
                similarity: similarity,
                reason: 'Artist name too different from requested',
              };
            }
          }
        }
      } catch (err) {
        console.warn(`Strategy ${strategy.name} failed:`, err);
        // Continue to next strategy
      }
    }

    // If no strategy worked, return failure with details
    if (!track) {
      return {
        success: false,
        error: rejectedMatch 
          ? `Track found but artist mismatch: "${rejectedMatch.artist}" vs requested "${artist}"`
          : 'Track not found on Spotify after trying multiple search strategies',
        rejectedMatch, // ✅ NEW: Include rejected match for feedback
      };
    }
    // If no strategy worked, return failure
    if (!track) {
      return {
        success: false,
        error: 'Track not found on Spotify after trying multiple search strategies',
      };
    }

    // Return success with metadata
    return {
      success: true,
      searchStrategy: successfulStrategy, // ✅ Track which strategy worked
      data: {
        spotifyId: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album.name,
        albumArt: track.album.images[1]?.url || track.album.images[0]?.url,
        releaseDate: track.album.release_date,
        duration: Math.round(track.duration_ms / 1000),
        durationMs: track.duration_ms,
        explicit: track.explicit,
        popularity: track.popularity,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        spotifyUri: track.uri,
        isPlayable: track.is_playable !== false,
      },
    };
  } catch (error) {
    console.error('Error searching Spotify:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * ✅ UPDATED: Verify by SEARCHING Spotify (not checking hallucinated links!)
 */
export async function verifySong(song: Song): Promise<{
  verificationStatus: 'verified' | 'failed';
  verifiedAt: string;
  verificationSource: 'spotify';
  verificationError?: string;
  metadata?: any;
}> {
  if (!song.artist || !song.title) {
    return {
      verificationStatus: 'failed',
      verifiedAt: new Date().toISOString(),
      verificationSource: 'spotify',
      verificationError: 'Missing artist or title',
    };
  }

  // Search Spotify by artist + title (with album if available)
  const result = await searchSpotifyTrack(song.artist, song.title, song.album);

  if (!result.success) {
    return {
      verificationStatus: 'failed',
      verifiedAt: new Date().toISOString(),
      verificationSource: 'spotify',
      verificationError: result.error || 'Track not found',
    };
  }

  return {
    verificationStatus: 'verified',
    verifiedAt: new Date().toISOString(),
    verificationSource: 'spotify',
    metadata: result.data,
  };
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

  if (verificationResult.metadata) {
    const meta = verificationResult.metadata;
    updated.spotifyId = meta.spotifyId;
    updated.spotifyUrl = meta.spotifyUrl;
    updated.spotifyUri = meta.spotifyUri;
    updated.albumArt = meta.albumArt;
    updated.releaseDate = meta.releaseDate;
    updated.explicit = meta.explicit;
    updated.popularity = meta.popularity;
    updated.durationMs = meta.durationMs;
    updated.isPlayable = meta.isPlayable;
    updated.previewUrl = meta.previewUrl;
    
    if (meta.duration) {
      updated.duration = meta.duration;
    }
    if (meta.artist) {
      updated.artist = meta.artist;
    }
    if (meta.title) {
      updated.title = meta.title;
    }
    if (meta.album) {
      updated.album = meta.album;
    }
  }

  return updated;
}

/**
 * Cache management
 */
const CACHE_KEY = 'spotify_verification_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

type VerificationCache = {
  [key: string]: {
    verifiedAt: string;
    metadata: any;
  };
};

function getCacheKey(artist: string, title: string): string {
  return `${artist.toLowerCase().trim()}|${title.toLowerCase().trim()}`;
}

export function getCachedVerification(artist: string, title: string): any | null {
  try {
    const cache: VerificationCache = JSON.parse(
      localStorage.getItem(CACHE_KEY) || '{}'
    );
    
    const key = getCacheKey(artist, title);
    const cached = cache[key];
    if (!cached) return null;

    const age = Date.now() - new Date(cached.verifiedAt).getTime();
    if (age > CACHE_DURATION) {
      return null;
    }

    return cached.metadata;
  } catch {
    return null;
  }
}

export function setCachedVerification(artist: string, title: string, metadata: any): void {
  try {
    const cache: VerificationCache = JSON.parse(
      localStorage.getItem(CACHE_KEY) || '{}'
    );
    
    const key = getCacheKey(artist, title);
    cache[key] = {
      verifiedAt: new Date().toISOString(),
      metadata,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching verification:', error);
  }
}
