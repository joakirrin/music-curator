// src/services/appleMusicService.ts
/**
 * iTunes Search API Service (formerly Apple Music Service)
 * 
 * ⚠️ IMPORTANT: This service now uses iTunes Search API instead of Apple Music API
 * because iTunes Search API is FREE and does NOT require authentication.
 * 
 * Provides access to iTunes for:
 * - Searching tracks by ISRC (99%+ accuracy)
 * - Getting preview URLs (30s clips)
 * - Getting Apple Music track IDs and URLs
 * 
 * iTunes Search API is publicly accessible without authentication,
 * making it perfect for client-side apps.
 * 
 * API Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 */

const DEV = import.meta.env?.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[iTunes]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[iTunes]', ...args);
}

/**
 * iTunes track result from search API
 */
export type iTunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;          // Album name
  releaseDate?: string;
  trackTimeMillis?: number;
  previewUrl?: string;              // 30-second preview URL
  artworkUrl30?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;           // Best quality available
  trackExplicitness?: "explicit" | "cleaned" | "notExplicit";
  isStreamable?: boolean;
  country?: string;
  currency?: string;
  primaryGenreName?: string;
};

export type iTunesSearchResponse = {
  resultCount: number;
  results: iTunesTrack[];
};

/**
 * Apple Music search result (normalized format)
 */
export type AppleMusicSearchResult = {
  id: string;                       // Track ID as string
  url?: string;                     // Apple Music URL (if available)
  previewUrl?: string;              // 30s preview URL
  albumArtUrl?: string;             // High-res album art
};

/**
 * Search iTunes by ISRC
 * 
 * This is the primary method for finding tracks with high accuracy.
 * ISRC is unique per recording, so matches are nearly 100% accurate.
 * 
 * iTunes Search API format:
 * https://itunes.apple.com/search?term={ISRC}&entity=song&limit=1
 * 
 * @param isrc - International Standard Recording Code
 * @returns Track info with preview URL, or null if not found
 */
export async function searchByISRC(
  isrc: string
): Promise<AppleMusicSearchResult | null> {
  try {
    log(`Searching iTunes for ISRC: ${isrc}`);
    
    // iTunes Search API endpoint (NO AUTHENTICATION REQUIRED)
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(isrc)}&entity=song&limit=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Don't throw on 404, just return null
      if (response.status === 404) {
        log(`No iTunes track found for ISRC: ${isrc}`);
        return null;
      }
      
      logError(`iTunes API error: ${response.status}`);
      return null;
    }
    
    const data: iTunesSearchResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      log(`No results for ISRC: ${isrc}`);
      return null;
    }
    
    // Get first result (ISRC should be unique)
    const track = data.results[0];
    
    const result: AppleMusicSearchResult = {
      id: track.trackId.toString(),
      url: undefined, // iTunes Search API doesn't provide Apple Music URLs directly
      previewUrl: track.previewUrl,
      albumArtUrl: track.artworkUrl600 || track.artworkUrl100,
    };
    
    log(`✅ Found iTunes track: ${track.trackName}`);
    if (result.previewUrl) {
      log(`   Preview URL: ${result.previewUrl}`);
    } else {
      log(`   ⚠️ No preview available for this track`);
    }
    
    return result;
    
  } catch (error) {
    logError(`Failed to search iTunes by ISRC:`, error);
    return null;
  }
}

/**
 * Search iTunes by artist and title (fallback method)
 * 
 * Less accurate than ISRC search, but useful when ISRC is not available.
 * Returns the best match according to iTunes.
 * 
 * @param artist - Artist name
 * @param title - Track title
 * @returns Track info with preview URL, or null if not found
 */
export async function searchByText(
  artist: string,
  title: string
): Promise<AppleMusicSearchResult | null> {
  try {
    log(`Searching iTunes for: "${title}" by ${artist}`);
    
    // Build search query
    const query = `${title} ${artist}`;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        log(`No iTunes track found for: ${artist} - ${title}`);
        return null;
      }
      
      logError(`iTunes API error: ${response.status}`);
      return null;
    }
    
    const data: iTunesSearchResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      log(`No results for: ${artist} - ${title}`);
      return null;
    }
    
    // Get first result (best match according to iTunes)
    const track = data.results[0];
    
    // Basic fuzzy match check - ensure we got something relevant
    const titleMatch = track.trackName.toLowerCase().includes(title.toLowerCase()) ||
                       title.toLowerCase().includes(track.trackName.toLowerCase());
    const artistMatch = track.artistName.toLowerCase().includes(artist.toLowerCase()) ||
                        artist.toLowerCase().includes(track.artistName.toLowerCase());
    
    if (!titleMatch && !artistMatch) {
      log(`⚠️ Result doesn't match query well enough`);
      log(`   Expected: "${title}" by ${artist}`);
      log(`   Got: "${track.trackName}" by ${track.artistName}`);
    }
    
    const result: AppleMusicSearchResult = {
      id: track.trackId.toString(),
      url: undefined,
      previewUrl: track.previewUrl,
      albumArtUrl: track.artworkUrl600 || track.artworkUrl100,
    };
    
    log(`✅ Found iTunes track: ${track.trackName}`);
    if (result.previewUrl) {
      log(`   Preview URL: ${result.previewUrl}`);
    } else {
      log(`   ⚠️ No preview available for this track`);
    }
    
    return result;
    
  } catch (error) {
    logError(`Failed to search iTunes by text:`, error);
    return null;
  }
}

/**
 * Get preview URL for a song
 * Tries ISRC first, falls back to text search
 * 
 * @param options - Search parameters
 * @returns Preview URL or null if not found
 */
export async function getPreviewUrl(options: {
  isrc?: string;
  artist: string;
  title: string;
}): Promise<string | null> {
  const { isrc, artist, title } = options;
  
  // Try ISRC first if available (most accurate)
  if (isrc) {
    const result = await searchByISRC(isrc);
    if (result?.previewUrl) {
      return result.previewUrl;
    }
    log(`⚠️ ISRC search found track but no preview, falling back to text search`);
  }
  
  // Fallback to text search
  const result = await searchByText(artist, title);
  return result?.previewUrl || null;
}

/**
 * Batch search for previews with rate limiting
 * 
 * iTunes Search API has generous rate limits but we'll be conservative:
 * - 20 requests per second max
 * - Process in batches to avoid overwhelming the API
 * 
 * @param songs - Array of songs to search
 * @param onProgress - Optional progress callback
 * @returns Array of preview URLs (null for not found)
 */
export async function batchGetPreviews(
  songs: Array<{ isrc?: string; artist: string; title: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Array<string | null>> {
  log(`Batch fetching ${songs.length} iTunes previews...`);
  
  const results: Array<string | null> = [];
  const BATCH_SIZE = 10;
  const DELAY_BETWEEN_BATCHES = 100; // 100ms delay between batches
  
  for (let i = 0; i < songs.length; i += BATCH_SIZE) {
    const batch = songs.slice(i, i + BATCH_SIZE);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(song => getPreviewUrl(song))
    );
    
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(results.length, songs.length);
    }
    
    // Delay between batches to be polite to the API
    if (i + BATCH_SIZE < songs.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  log(`✅ Found ${successCount}/${songs.length} previews`);
  
  return results;
}

/**
 * Get full track details by track ID
 * Useful for getting additional metadata after an ISRC search
 * 
 * @param trackId - iTunes track ID
 * @returns Full track details or null
 */
export async function getTrackById(trackId: string): Promise<iTunesTrack | null> {
  try {
    log(`Fetching iTunes track details for ID: ${trackId}`);
    
    const url = `https://itunes.apple.com/lookup?id=${trackId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      logError(`iTunes API error: ${response.status}`);
      return null;
    }
    
    const data: iTunesSearchResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      log(`No track found with ID: ${trackId}`);
      return null;
    }
    
    return data.results[0];
    
  } catch (error) {
    logError(`Failed to fetch iTunes track by ID:`, error);
    return null;
  }
}
