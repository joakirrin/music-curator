// src/services/platformLinkService.ts
/**
 * Platform Link Service (On-Demand Resolution)
 * 
 * Handles on-demand fetching of platform links when user clicks "Listen on [Platform]" buttons.
 * Uses ISRC-based search for maximum accuracy, with fallback to text search.
 * 
 * Flow:
 * 1. Check if link is already cached in song.platformIds
 * 2. If not, search by ISRC (Tier 1 - 99%+ accuracy)
 * 3. If no ISRC or not found, search by artist + title (Tier 2)
 * 4. If not found, return manual search URL (Tier 3)
 */

import type { Song } from '@/types/song';
import { searchByISRC as searchAppleMusicByISRC, searchByText as searchAppleMusicByText } from './appleMusicService';

const DEV = import.meta.env?.DEV;

function log(...args: any[]) {
  if (DEV) console.log('[PlatformLink]', ...args);
}

function logError(...args: any[]) {
  if (DEV) console.error('[PlatformLink]', ...args);
}

export type Platform = 'spotify' | 'apple' | 'tidal' | 'youtube';

export type PlatformLinkResult = {
  id: string;
  url: string;
  tier: 'cached' | 'isrc' | 'text' | 'manual';
  isManualSearch?: boolean; // true if it's a search URL, not a direct track link
};

/**
 * Cache manager to avoid re-fetching the same links
 * This is an in-memory cache that persists during the session
 */
const linkCache = new Map<string, PlatformLinkResult>();

function getCacheKey(songId: string, platform: Platform): string {
  return `${songId}-${platform}`;
}

/**
 * Check if song already has platform link cached in song.platformIds
 */
function getCachedLink(song: Song, platform: Platform): PlatformLinkResult | null {
  // Check in-memory cache first
  const cacheKey = getCacheKey(song.id, platform);
  const cached = linkCache.get(cacheKey);
  if (cached) {
    log(`✅ Found in-memory cache for ${platform}: ${song.title}`);
    return cached;
  }
  
  // Check song.platformIds
  const platformData = song.platformIds?.[platform];
  if (platformData?.id && platformData?.url) {
    const result: PlatformLinkResult = {
      id: platformData.id,
      url: platformData.url,
      tier: 'cached',
    };
    
    // Store in memory cache
    linkCache.set(cacheKey, result);
    
    log(`✅ Found cached ${platform} link: ${song.title}`);
    return result;
  }
  
  return null;
}

/**
 * Save link to cache (both memory and return updated song)
 */
function cacheLink(
  song: Song, 
  platform: Platform, 
  result: PlatformLinkResult
): Song {
  // Save to memory cache
  const cacheKey = getCacheKey(song.id, platform);
  linkCache.set(cacheKey, result);
  
  // Update song.platformIds
  const updatedSong: Song = {
    ...song,
    platformIds: {
      ...song.platformIds,
      [platform]: {
        id: result.id,
        url: result.url,
      },
    },
  };
  
  return updatedSong;
}

/**
 * Generate manual search URL for a platform
 */
function getManualSearchUrl(song: Song, platform: Platform): string {
  const query = encodeURIComponent(`${song.artist} ${song.title}`);
  
  switch (platform) {
    case 'spotify':
      return `https://open.spotify.com/search/${query}`;
    case 'apple':
      return `https://music.apple.com/search?term=${query}`;
    case 'tidal':
      return `https://tidal.com/search?q=${query}`;
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${query}`;
    default:
      return '';
  }
}

/**
 * Search Spotify by ISRC
 */
async function searchSpotifyByISRC(
  isrc: string, 
  token: string
): Promise<{ id: string; url: string } | null> {
  try {
    log(`Searching Spotify by ISRC: ${isrc}`);
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=isrc:${encodeURIComponent(isrc)}&type=track&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    const track = data.tracks?.items?.[0];
    
    if (!track) {
      log(`No Spotify track found for ISRC: ${isrc}`);
      return null;
    }
    
    log(`✅ Found Spotify track: ${track.name}`);
    return {
      id: track.id,
      url: track.external_urls.spotify,
    };
    
  } catch (error) {
    logError('Failed to search Spotify by ISRC:', error);
    return null;
  }
}

/**
 * Search Spotify by artist + title
 */
async function searchSpotifyByText(
  artist: string,
  title: string,
  token: string
): Promise<{ id: string; url: string } | null> {
  try {
    log(`Searching Spotify by text: "${title}" by ${artist}`);
    
    const query = encodeURIComponent(`artist:${artist} track:${title}`);
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    const track = data.tracks?.items?.[0];
    
    if (!track) {
      log(`No Spotify track found for: ${artist} - ${title}`);
      return null;
    }
    
    log(`✅ Found Spotify track: ${track.name}`);
    return {
      id: track.id,
      url: track.external_urls.spotify,
    };
    
  } catch (error) {
    logError('Failed to search Spotify by text:', error);
    return null;
  }
}

/**
 * Fetch Spotify link on-demand
 */
async function fetchSpotifyLink(
  song: Song,
  token: string
): Promise<PlatformLinkResult> {
  // Try ISRC first
  if (song.isrc) {
    const result = await searchSpotifyByISRC(song.isrc, token);
    if (result) {
      return {
        ...result,
        tier: 'isrc',
      };
    }
  }
  
  // Fallback to text search
  const result = await searchSpotifyByText(song.artist, song.title, token);
  if (result) {
    return {
      ...result,
      tier: 'text',
    };
  }
  
  // Last resort: manual search URL
  log(`⚠️ No direct link found, returning manual search URL`);
  return {
    id: 'manual',
    url: getManualSearchUrl(song, 'spotify'),
    tier: 'manual',
    isManualSearch: true,
  };
}

async function fetchAppleMusicLink(song: Song): Promise<PlatformLinkResult> {
  // Try ISRC first
  if (song.isrc) {
    const result = await searchAppleMusicByISRC(song.isrc);
    if (result && result.url) {  // ← Verificar que url existe
      return {
        id: result.id,
        url: result.url,
        tier: 'isrc',
      };
    }
  }
  
  // Fallback to text search
  const result = await searchAppleMusicByText(song.artist, song.title);
  if (result && result.url) {  // ← Verificar que url existe
    return {
      id: result.id,
      url: result.url,
      tier: 'text',
    };
  }
  
  // Last resort: manual search URL
  log(`⚠️ No direct link found, returning manual search URL`);
  return {
    id: 'manual',
    url: getManualSearchUrl(song, 'apple'),
    tier: 'manual',
    isManualSearch: true,
  };
}

/**
 * Fetch Tidal link on-demand
 * Note: Tidal doesn't have a public API, so we can only provide search URLs
 */
async function fetchTidalLink(song: Song): Promise<PlatformLinkResult> {
  log(`⚠️ Tidal has no public API, returning manual search URL`);
  return {
    id: 'manual',
    url: getManualSearchUrl(song, 'tidal'),
    tier: 'manual',
    isManualSearch: true,
  };
}

/**
 * Fetch YouTube link on-demand
 * Note: For now, we'll just provide search URLs
 * In the future, we could use YouTube Data API for better results
 */
async function fetchYouTubeLink(song: Song): Promise<PlatformLinkResult> {
  log(`ℹ️ YouTube search - returning manual search URL`);
  return {
    id: 'manual',
    url: getManualSearchUrl(song, 'youtube'),
    tier: 'manual',
    isManualSearch: true,
  };
}

/**
 * Main function: Fetch platform link on-demand
 * 
 * Flow:
 * 1. Check cache
 * 2. Fetch from platform API
 * 3. Cache result
 * 4. Return result + updated song
 * 
 * @param song - Song to fetch link for
 * @param platform - Target platform
 * @param options - Optional parameters (e.g., Spotify token)
 * @returns Result with link and updated song object
 */
export async function fetchPlatformLink(
  song: Song,
  platform: Platform,
  options?: {
    spotifyToken?: string;
  }
): Promise<{
  result: PlatformLinkResult;
  updatedSong: Song;
}> {
  log(`=== Fetching ${platform} link for: ${song.title} ===`);
  
  // Step 1: Check cache
  const cached = getCachedLink(song, platform);
  if (cached) {
    return {
      result: cached,
      updatedSong: song, // No changes needed
    };
  }
  
  // Step 2: Fetch from platform
  let result: PlatformLinkResult;
  
  try {
    switch (platform) {
      case 'spotify':
        if (!options?.spotifyToken) {
          throw new Error('Spotify token required');
        }
        // Type assertion: we know spotifyToken is defined after the check
        result = await fetchSpotifyLink(song, options.spotifyToken as string);
        break;
        
      case 'apple':
        result = await fetchAppleMusicLink(song);
        break;
        
      case 'tidal':
        result = await fetchTidalLink(song);
        break;
        
      case 'youtube':
        result = await fetchYouTubeLink(song);
        break;
        
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    // Step 3: Cache result (only if not manual search)
    let updatedSong = song;
    if (!result.isManualSearch) {
      updatedSong = cacheLink(song, platform, result);
      log(`✅ Cached ${platform} link for future use`);
    }
    
    return {
      result,
      updatedSong,
    };
    
  } catch (error) {
    logError(`Failed to fetch ${platform} link:`, error);
    
    // Return manual search URL as fallback
    return {
      result: {
        id: 'manual',
        url: getManualSearchUrl(song, platform),
        tier: 'manual',
        isManualSearch: true,
      },
      updatedSong: song,
    };
  }
}

/**
 * Batch pre-resolve links for multiple songs
 * Useful before export to ensure all songs have links
 * 
 * @param songs - Songs to resolve
 * @param platform - Target platform
 * @param options - Optional parameters
 * @param onProgress - Progress callback
 * @returns Updated songs with cached links
 */
export async function batchPreResolveLinks(
  songs: Song[],
  platform: Platform,
  options?: {
    spotifyToken?: string;
  },
  onProgress?: (current: number, total: number) => void
): Promise<Song[]> {
  log(`=== Batch pre-resolving ${songs.length} ${platform} links ===`);
  
  const updatedSongs: Song[] = [];
  const BATCH_SIZE = 10;
  const DELAY_BETWEEN_BATCHES = 200; // 200ms delay to avoid rate limits
  
  for (let i = 0; i < songs.length; i += BATCH_SIZE) {
    const batch = songs.slice(i, i + BATCH_SIZE);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(song => fetchPlatformLink(song, platform, options))
    );
    
    updatedSongs.push(...batchResults.map(r => r.updatedSong));
    
    if (onProgress) {
      onProgress(updatedSongs.length, songs.length);
    }
    
    // Delay between batches
    if (i + BATCH_SIZE < songs.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  log(`✅ Pre-resolved ${updatedSongs.length} links`);
  return updatedSongs;
}

/**
 * Clear all cached links (useful for debugging or user action)
 */
export function clearLinkCache(): void {
  linkCache.clear();
  log('🗑️ Cleared link cache');
}
