// src/services/spotifyIsrcResolver.ts
/**
 * Spotify ISRC Resolution Service
 * 
 * Resolves Spotify track URLs using ISRC codes (International Standard Recording Code)
 * Requires user authentication (uses existing spotifyAuth.ts infrastructure)
 * 
 * Usage:
 *   const token = await spotifyAuth.getAccessToken();
 *   const result = await resolveSpotifyByISRC('USUG12345678', token);
 *   if (result) {
 *     song.platformIds.spotify = result;
 *   }
 */

const DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

function log(...args: any[]) {
  if (DEV) console.log('[SpotifyISRC]', ...args);
}

function logError(...args: any[]) {
  if (DEV) console.error('[SpotifyISRC]', ...args);
}

/**
 * Spotify platform ID structure (matches Song.platformIds.spotify)
 */
export type SpotifyPlatformId = {
  id: string;           // Track ID (22 characters)
  uri: string;          // spotify:track:ID
  url: string;          // https://open.spotify.com/track/ID
};

/**
 * Resolve a Spotify track using its ISRC code
 * 
 * @param isrc - International Standard Recording Code (e.g., "USUG12345678")
 * @param token - Valid Spotify access token (from spotifyAuth.getAccessToken())
 * @returns SpotifyPlatformId if found, null if not found or error
 */
export async function resolveSpotifyByISRC(
  isrc: string,
  token: string
): Promise<SpotifyPlatformId | null> {
  log('=== Resolving Spotify track by ISRC ===');
  log(`ISRC: ${isrc}`);
  
  if (!isrc || !token) {
    logError('Missing required parameters');
    return null;
  }
  
  try {
    // Spotify Search API: search by ISRC
    // https://developer.spotify.com/documentation/web-api/reference/search
    const query = `isrc:${isrc}`;
    const url = `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(query)}`;
    
    log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    log(`Response status: ${response.status} ${response.statusText}`);
    
    // Handle auth errors
    if (response.status === 401) {
      logError('Unauthorized - token may be expired');
      return null;
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logError(`Search failed: ${response.status}`, errorText.substring(0, 200));
      return null;
    }
    
    const data = await response.json();
    const tracks = data?.tracks?.items || [];
    
    log(`Found ${tracks.length} track(s)`);
    
    if (tracks.length === 0) {
      log('❌ No Spotify track found for this ISRC');
      return null;
    }
    
    // Get the first (and should be only) result
    const track = tracks[0];
    
    if (!track.id) {
      logError('Track found but missing ID');
      return null;
    }
    
    const result: SpotifyPlatformId = {
      id: track.id,
      uri: `spotify:track:${track.id}`,
      url: `https://open.spotify.com/track/${track.id}`,
    };
    
    log('=== ✅ Resolution successful ===');
    log(`Track: "${track.name}" by ${track.artists?.[0]?.name || 'Unknown'}`);
    log(`Spotify ID: ${result.id}`);
    log(`URL: ${result.url}`);
    
    return result;
    
  } catch (error) {
    logError('=== ❌ Resolution failed ===');
    logError(error);
    return null;
  }
}

/**
 * Batch resolve multiple ISRCs
 * Note: Spotify API doesn't have a bulk ISRC endpoint, so this runs sequentially
 * 
 * @param isrcs - Array of ISRC codes
 * @param token - Valid Spotify access token
 * @param onProgress - Optional progress callback
 * @returns Array of results (null for failed resolutions)
 */
export async function batchResolveSpotifyByISRC(
  isrcs: string[],
  token: string,
  onProgress?: (current: number, total: number) => void
): Promise<(SpotifyPlatformId | null)[]> {
  log(`=== Batch resolving ${isrcs.length} ISRCs ===`);
  
  const results: (SpotifyPlatformId | null)[] = [];
  
  for (let i = 0; i < isrcs.length; i++) {
    const isrc = isrcs[i];
    log(`\n[${i + 1}/${isrcs.length}] Resolving ISRC: ${isrc}`);
    
    const result = await resolveSpotifyByISRC(isrc, token);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, isrcs.length);
    }
    
    // Small delay to avoid rate limiting (30 requests/second limit)
    if (i < isrcs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  log(`=== Batch complete: ${successCount}/${isrcs.length} resolved ===`);
  
  return results;
}
