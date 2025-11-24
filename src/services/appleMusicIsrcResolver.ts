// src/services/appleMusicIsrcResolver.ts
/**
 * Apple Music / iTunes ISRC Resolution Service
 * 
 * Resolves Apple Music track URLs using ISRC codes (International Standard Recording Code)
 * Uses the public iTunes Search API - NO AUTHENTICATION REQUIRED!
 * 
 * API Documentation: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 * 
 * Usage:
 *   const result = await resolveAppleMusicByISRC('USUG12345678');
 *   if (result) {
 *     song.platformIds.apple = result;
 *   }
 */

const DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[AppleMusicISRC]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[AppleMusicISRC]', ...args);
}

/**
 * Apple Music platform ID structure (matches Song.platformIds.apple)
 */
export type AppleMusicPlatformId = {
  id: string;           // Track ID (e.g., "1440857781")
  url: string;          // Direct URL to track on Apple Music
};

/**
 * Resolve an Apple Music track using its ISRC code
 * 
 * @param isrc - International Standard Recording Code (e.g., "USUG12345678")
 * @returns AppleMusicPlatformId if found, null if not found or error
 */
export async function resolveAppleMusicByISRC(
  isrc: string
): Promise<AppleMusicPlatformId | null> {
  log('=== Resolving Apple Music track by ISRC ===');
  log(`ISRC: ${isrc}`);
  
  if (!isrc) {
    logError('Missing ISRC parameter');
    return null;
  }
  
  try {
    // iTunes Search API: search by ISRC
    // The API doesn't have a direct ISRC parameter, but we can search by term
    // and filter by media type
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(isrc)}&entity=song&limit=5`;
    
    log(`Request URL: ${url}`);
    
    const response = await fetch(url);
    
    log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logError(`Search failed: ${response.status}`, errorText.substring(0, 200));
      return null;
    }
    
    const data = await response.json();
    const results = data?.results || [];
    
    log(`Found ${results.length} result(s)`);
    
    if (results.length === 0) {
      log('❌ No Apple Music track found for this ISRC');
      return null;
    }
    
    // Find the best match - iTunes API might return multiple results
    // We need to find one that actually matches the ISRC
    // Unfortunately, the iTunes Search API doesn't return ISRC in results,
    // so we take the first song result as the best match
    let bestMatch = null;
    
    for (const track of results) {
      // Only consider song results
      if (track.kind === 'song' && track.trackId) {
        bestMatch = track;
        break;
      }
    }
    
    if (!bestMatch || !bestMatch.trackId) {
      log('❌ No valid song found in results');
      return null;
    }
    
    const trackId = bestMatch.trackId.toString();
    
    // Build Apple Music URL
    // Format: https://music.apple.com/us/album/{albumName}/{albumId}?i={trackId}
    let appleMusicUrl: string;
    
    if (bestMatch.trackViewUrl) {
      // Use the provided URL if available
      appleMusicUrl = bestMatch.trackViewUrl;
    } else if (bestMatch.collectionId) {
      // Construct URL from album and track IDs
      appleMusicUrl = `https://music.apple.com/us/album/${bestMatch.collectionId}?i=${trackId}`;
    } else {
      // Fallback: just use the track ID in a search URL
      appleMusicUrl = `https://music.apple.com/us/song/${trackId}`;
    }
    
    const result: AppleMusicPlatformId = {
      id: trackId,
      url: appleMusicUrl,
    };
    
    log('=== ✅ Resolution successful ===');
    log(`Track: "${bestMatch.trackName}" by ${bestMatch.artistName || 'Unknown'}`);
    log(`Track ID: ${result.id}`);
    log(`URL: ${result.url}`);
    
    return result;
    
  } catch (error) {
    logError('=== ❌ Resolution failed ===');
    logError(error);
    return null;
  }
}

/**
 * Batch resolve multiple ISRCs for Apple Music
 * 
 * @param isrcs - Array of ISRC codes
 * @param onProgress - Optional progress callback
 * @returns Array of results (null for failed resolutions)
 */
export async function batchResolveAppleMusicByISRC(
  isrcs: string[],
  onProgress?: (current: number, total: number) => void
): Promise<(AppleMusicPlatformId | null)[]> {
  log(`=== Batch resolving ${isrcs.length} ISRCs for Apple Music ===`);
  
  const results: (AppleMusicPlatformId | null)[] = [];
  
  for (let i = 0; i < isrcs.length; i++) {
    const isrc = isrcs[i];
    log(`\n[${i + 1}/${isrcs.length}] Resolving ISRC: ${isrc}`);
    
    const result = await resolveAppleMusicByISRC(isrc);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, isrcs.length);
    }
    
    // Small delay to be respectful to the API
    if (i < isrcs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  log(`=== Batch complete: ${successCount}/${isrcs.length} resolved ===`);
  
  return results;
}
