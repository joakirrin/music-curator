// src/services/appleMusicResolver.ts
/**
 * Apple Music / iTunes Resolution Service
 * 
 * Resolves Apple Music track URLs using artist + title search
 * Uses the public iTunes Search API - NO AUTHENTICATION REQUIRED!
 * 
 * NOTE: iTunes Search API does NOT support ISRC search, so we use artist+title matching
 * 
 * API Documentation: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 * 
 * Usage:
 *   const result = await resolveAppleMusic(artist, title);
 *   if (result) {
 *     song.platformIds.apple = result;
 *   }
 */

const DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

function log(...args: any[]) {
  if (DEV) console.log('[AppleMusic]', ...args);
}

function logError(...args: any[]) {
  if (DEV) console.error('[AppleMusic]', ...args);
}

/**
 * Apple Music platform ID structure (matches Song.platformIds.apple)
 */
export type AppleMusicPlatformId = {
  id: string;           // Track ID (e.g., "1440857781")
  url: string;          // Direct URL to track on Apple Music
  artworkUrl?: string;  // Album artwork URL (600x600 high-res)
};

/**
 * Normalize string for comparison (remove accents, lowercase, etc.)
 */
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s]/g, ' ')        // Replace punctuation with space
    .replace(/\s+/g, ' ')            // Collapse whitespace
    .trim()
    .toLowerCase();
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalize(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalize(b).split(' ').filter(Boolean));
  
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  
  let intersection = 0;
  tokensA.forEach(token => {
    if (tokensB.has(token)) intersection++;
  });
  
  return intersection / Math.max(tokensA.size, tokensB.size);
}

/**
 * Resolve an Apple Music track using artist and title
 * 
 * @param artist - Artist name
 * @param title - Song title
 * @returns AppleMusicPlatformId if found, null if not found or error
 */
export async function resolveAppleMusic(
  artist: string,
  title: string
): Promise<AppleMusicPlatformId | null> {
  log('=== Resolving Apple Music track ===');
  log(`Artist: "${artist}"`);
  log(`Title: "${title}"`);
  
  if (!artist || !title) {
    logError('Missing artist or title');
    return null;
  }
  
  try {
    // iTunes Search API: search by artist + title
    const searchTerm = `${artist} ${title}`;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=5`;
    
    log(`Request URL: ${url.substring(0, 100)}...`);
    
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
      log('❌ No Apple Music tracks found');
      return null;
    }
    
    // Find best match using similarity scoring
    let bestMatch = null;
    let bestScore = 0;
    
    for (const track of results) {
      // Only consider song results
      if (track.kind !== 'song' || !track.trackId) continue;
      
      const trackArtist = track.artistName || '';
      const trackTitle = track.trackName || '';
      
      const artistSim = calculateSimilarity(artist, trackArtist);
      const titleSim = calculateSimilarity(title, trackTitle);
      
      // Weighted score: title 60%, artist 40%
      const score = (titleSim * 0.6) + (artistSim * 0.4);
      
      if (DEV && score > 0.3) {
        log(`  Match: "${trackTitle}" by ${trackArtist} (score: ${(score * 100).toFixed(0)}%)`);
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = track;
      }
    }
    
    // Require at least 50% match confidence
    if (!bestMatch || bestScore < 0.5) {
      log(`❌ No confident match (best: ${(bestScore * 100).toFixed(0)}%)`);
      return null;
    }
    
    const trackId = bestMatch.trackId.toString();
    
    // Build Apple Music URL
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
    
    // Extract artwork URL and upgrade to high-res (600x600)
    let artworkUrl: string | undefined = undefined;
    if (bestMatch.artworkUrl100 || bestMatch.artworkUrl60) {
      const baseArtwork = bestMatch.artworkUrl100 || bestMatch.artworkUrl60;
      // Replace size to get 600x600 high-res version
      artworkUrl = baseArtwork
        .replace('100x100bb', '600x600bb')
        .replace('60x60bb', '600x600bb')
        .replace('30x30bb', '600x600bb');
      
      if (DEV) {
        log(`Artwork URL: ${artworkUrl}`);
      }
    }
    
    const result: AppleMusicPlatformId = {
      id: trackId,
      url: appleMusicUrl,
      artworkUrl: artworkUrl,
    };
    
    log('=== ✅ Resolution successful ===');
    log(`Track: "${bestMatch.trackName}" by ${bestMatch.artistName || 'Unknown'}`);
    log(`Match confidence: ${(bestScore * 100).toFixed(0)}%`);
    log(`Track ID: ${result.id}`);
    log(`URL: ${result.url}`);
    if (result.artworkUrl) {
      log(`Artwork: ${result.artworkUrl}`);
    }
    
    return result;
    
  } catch (error) {
    logError('=== ❌ Resolution failed ===');
    logError(error);
    return null;
  }
}
