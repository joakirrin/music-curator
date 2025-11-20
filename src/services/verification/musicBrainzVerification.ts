// src/services/verification/musicBrainzVerification.ts
/**
 * MusicBrainz Verification Service
 * 
 * Uses MusicBrainz API to verify songs and extract:
 * - Core metadata (title, artist, album, year)
 * - Platform IDs (Spotify, Apple Music, Tidal, Qobuz)
 * - ISRC codes for cross-platform matching
 * - 🆕 Album art from Cover Art Archive
 * 
 * Rate Limit: 1 request per second (enforced by User-Agent requirement)
 * Documentation: https://musicbrainz.org/doc/MusicBrainz_API
 */

import type {
  VerificationResult,
  MusicBrainzSearchResponse,
  MusicBrainzRecording,
  MusicBrainzRecordingDetail,
  MusicBrainzUrlRelation,
  RetryConfig,
} from './verificationTypes';

const DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

// MusicBrainz API configuration
const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'FoneaSoundCurator/1.0 ( https://github.com/joakirrin/music-curator )';

// Cover Art Archive configuration
const COVER_ART_ARCHIVE_BASE = 'https://coverartarchive.org';

// Rate limiting: 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

// Retry configuration
const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

function log(...args: any[]) {
  if (DEV) console.log('[MusicBrainz]', ...args);
}

function logError(...args: any[]) {
  if (DEV) console.error('[MusicBrainz]', ...args);
}

/**
 * Rate-limited fetch wrapper
 * Ensures we don't exceed 1 request per second
 */
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    log(`Rate limit: waiting ${delay}ms before request`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
  
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  });
}

/**
 * Retry wrapper with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  config: RetryConfig = RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null;
  let delay = config.initialDelayMs;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      log(`Fetch attempt ${attempt + 1}/${config.maxRetries + 1}: ${url.substring(0, 80)}...`);
      
      const response = await rateLimitedFetch(url);
      
      // Success
      if (response.ok) {
        log(`✅ Request successful (${response.status})`);
        return response;
      }
      
      // Rate limited (503) - wait and retry
      if (response.status === 503) {
        logError(`⚠️ Rate limited (503) - waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
        continue;
      }
      
      // Other errors - throw immediately (don't retry)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      lastError = error as Error;
      logError(`❌ Attempt ${attempt + 1} failed:`, error);
      
      // Don't retry on last attempt
      if (attempt < config.maxRetries) {
        log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * 🆕 Fetch album art from Cover Art Archive
 * Returns the 500px version (good balance of quality and file size)
 * Falls back to 250px if 500px is not available
 */
async function getAlbumArtFromCoverArtArchive(releaseId: string): Promise<string | null> {
  try {
    // Try 500px version first (best quality without being too large)
    const url500 = `${COVER_ART_ARCHIVE_BASE}/release/${releaseId}/front-500`;
    
    const response = await fetch(url500, {
      method: 'HEAD', // Just check if it exists
      redirect: 'manual',
    });
    
    // 307 = redirect (image exists), 200 = direct hit
    if (response.status === 307 || response.status === 200) {
      log(`  ✅ Album art found: ${url500}`);
      return url500;
    }
    
    // Try 250px fallback
    const url250 = `${COVER_ART_ARCHIVE_BASE}/release/${releaseId}/front-250`;
    const response250 = await fetch(url250, {
      method: 'HEAD',
      redirect: 'manual',
    });
    
    if (response250.status === 307 || response250.status === 200) {
      log(`  ✅ Album art found (250px): ${url250}`);
      return url250;
    }
    
    log(`  ⚠️ No album art available for release ${releaseId}`);
    return null;
  } catch (error) {
    logError(`  ❌ Failed to fetch album art for release ${releaseId}:`, error);
    return null;
  }
}

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
 * Uses token-based Jaccard similarity
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
 * Calculate match confidence for a recording
 * Returns 0-1 score based on artist/title similarity and MusicBrainz score
 */
function calculateConfidence(
  searchArtist: string,
  searchTitle: string,
  recording: MusicBrainzRecording
): number {
  const recordingArtist = recording['artist-credit']?.[0]?.name || '';
  const recordingTitle = recording.title || '';
  
  const artistSimilarity = calculateSimilarity(searchArtist, recordingArtist);
  const titleSimilarity = calculateSimilarity(searchTitle, recordingTitle);
  
  // MusicBrainz score is 0-100, normalize to 0-1
  const mbScore = (recording.score || 0) / 100;
  
  // Weighted combination: artist 40%, title 40%, MB score 20%
  const confidence = (artistSimilarity * 0.4) + (titleSimilarity * 0.4) + (mbScore * 0.2);
  
  if (DEV) {
    log(`  Match: "${recordingTitle}" by ${recordingArtist}`);
    log(`    Artist: ${(artistSimilarity * 100).toFixed(0)}% | Title: ${(titleSimilarity * 100).toFixed(0)}% | MB: ${(mbScore * 100).toFixed(0)}% → ${(confidence * 100).toFixed(0)}%`);
  }
  
  return confidence;
}

/**
 * Find best matching recording from search results
 * Returns null if no match meets minimum confidence threshold
 */
function findBestMatch(
  artist: string,
  title: string,
  recordings: MusicBrainzRecording[],
  minConfidence = 0.5
): MusicBrainzRecording | null {
  let bestMatch: { recording: MusicBrainzRecording; confidence: number } | null = null;
  
  for (const recording of recordings) {
    const confidence = calculateConfidence(artist, title, recording);
    
    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { recording, confidence };
    }
  }
  
  if (bestMatch && bestMatch.confidence >= minConfidence) {
    log(`✅ Best match confidence: ${(bestMatch.confidence * 100).toFixed(0)}%`);
    return bestMatch.recording;
  }
  
  log(`❌ No match above ${(minConfidence * 100)}% confidence threshold`);
  return null;
}

/**
 * Extract platform IDs from MusicBrainz URL relations
 * Supports Spotify, Apple Music, Tidal, Qobuz, YouTube
 */
function extractPlatformIds(relations: MusicBrainzUrlRelation[] | undefined): VerificationResult['platformIds'] {
  if (!relations || relations.length === 0) return undefined;
  
  const platformIds: VerificationResult['platformIds'] = {};
  
  for (const relation of relations) {
    const url = relation.url.resource;
    
    // Spotify: spotify:track:ID or https://open.spotify.com/track/ID
    const spotifyMatch = url.match(/(?:spotify:track:|spotify\.com\/track\/)([a-zA-Z0-9]{22})/);
    if (spotifyMatch) {
      const id = spotifyMatch[1];
      platformIds.spotify = {
        id,
        uri: `spotify:track:${id}`,
        url: `https://open.spotify.com/track/${id}`,
      };
      log(`  Found Spotify ID: ${id}`);
      continue;
    }
    
    // Apple Music: https://music.apple.com/.../album/.../ID or https://itunes.apple.com/...?i=ID
    const appleMatch = url.match(/(?:music\.apple\.com\/.*\?i=|itunes\.apple\.com\/.*\?i=)(\d+)/);
    if (appleMatch) {
      const id = appleMatch[1];
      platformIds.apple = {
        id,
        url,
      };
      log(`  Found Apple Music ID: ${id}`);
      continue;
    }
    
    // Tidal: https://tidal.com/browse/track/ID
    const tidalMatch = url.match(/tidal\.com\/(?:browse\/)?track\/(\d+)/);
    if (tidalMatch) {
      const id = tidalMatch[1];
      platformIds.tidal = {
        id,
        url,
      };
      log(`  Found Tidal ID: ${id}`);
      continue;
    }
    
    // Qobuz: https://www.qobuz.com/.../ID
    const qobuzMatch = url.match(/qobuz\.com\/.*\/([a-zA-Z0-9-]+)/);
    if (qobuzMatch) {
      const id = qobuzMatch[1];
      platformIds.qobuz = {
        id,
        url,
      };
      log(`  Found Qobuz ID: ${id}`);
      continue;
    }
    
    // YouTube: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      const id = youtubeMatch[1];
      platformIds.youtube = {
        id,
        url: `https://www.youtube.com/watch?v=${id}`,
      };
      log(`  Found YouTube ID: ${id}`);
      continue;
    }
  }
  
  return Object.keys(platformIds).length > 0 ? platformIds : undefined;
}

/**
 * Search MusicBrainz for a recording
 */
async function searchRecording(
  artist: string,
  title: string
): Promise<MusicBrainzSearchResponse> {
  // Build search query (Lucene syntax)
  const query = `artist:"${artist}" AND recording:"${title}"`;
  const url = `${MUSICBRAINZ_API_BASE}/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=5`;
  
  log(`Searching: "${title}" by ${artist}`);
  
  const response = await fetchWithRetry(url);
  const data = await response.json();
  
  log(`Found ${data.count} results`);
  
  return data;
}

/**
 * Get detailed recording info including URL relations
 */
async function getRecordingDetail(mbid: string): Promise<MusicBrainzRecordingDetail> {
  const url = `${MUSICBRAINZ_API_BASE}/recording/${mbid}?inc=url-rels+artist-credits+releases+isrcs&fmt=json`;
  
  log(`Fetching details for MBID: ${mbid}`);
  
  const response = await fetchWithRetry(url);
  const data = await response.json();
  
  return data;
}

/**
 * Verify a song using MusicBrainz
 * 
 * @param artist - Artist name
 * @param title - Song title
 * @returns VerificationResult with metadata, platform IDs, and album art
 */
export async function verifyWithMusicBrainz(
  artist: string,
  title: string
): Promise<VerificationResult> {
  log('=== MusicBrainz Verification ===');
  log(`Artist: "${artist}"`);
  log(`Title: "${title}"`);
  
  try {
    // Step 1: Search for the recording
    const searchResults = await searchRecording(artist, title);
    
    if (searchResults.count === 0) {
      log('❌ No results found');
      return {
        verified: false,
        source: 'musicbrainz',
        artist,
        title,
        error: 'No matches found in MusicBrainz',
        timestamp: new Date().toISOString(),
      };
    }
    
    // Step 2: Find best match
    const bestMatch = findBestMatch(artist, title, searchResults.recordings);
    
    if (!bestMatch) {
      log('❌ No confident match');
      return {
        verified: false,
        source: 'musicbrainz',
        artist,
        title,
        error: 'No confident match found (similarity too low)',
        timestamp: new Date().toISOString(),
      };
    }
    
    // Step 3: Get detailed info with platform links
    const detail = await getRecordingDetail(bestMatch.id);
    
    // Step 4: Extract metadata
    const recordingArtist = detail['artist-credit']?.[0]?.name || artist;
    const recordingTitle = detail.title || title;
    const firstRelease = detail.releases?.[0];
    const album = firstRelease?.title;
    const releaseDate = firstRelease?.date;
    const year = releaseDate?.substring(0, 4);
    const isrc = detail.isrcs?.[0];
    const durationMs = detail.length;
    const duration = durationMs ? Math.round(durationMs / 1000) : undefined;
    
    // 🆕 Step 4.5: Extract release ID and fetch album art
    const releaseId = firstRelease?.id;
    let albumArtUrl: string | undefined = undefined;
    
    if (releaseId) {
      log(`🎨 Found release ID: ${releaseId}`);
      albumArtUrl = await getAlbumArtFromCoverArtArchive(releaseId) || undefined;
    } else {
      log(`⚠️ No release ID found - cannot fetch album art`);
    }
    
    // Step 5: Extract platform IDs
    const platformIds = extractPlatformIds(detail.relations);
    
    // Step 6: Build result
    const result: VerificationResult = {
      verified: true,
      source: 'musicbrainz',
      artist: recordingArtist,
      title: recordingTitle,
      album,
      year,
      releaseDate,
      musicBrainzId: detail.id,
      releaseId,         // 🆕 Release ID for future use
      albumArtUrl,       // 🆕 Album art URL
      isrc,
      platformIds,
      duration,
      durationMs,
      confidence: calculateConfidence(artist, title, bestMatch),
      timestamp: new Date().toISOString(),
    };
    
    log('=== ✅ Verification successful ===');
    log(`MBID: ${detail.id}`);
    if (releaseId) log(`Release ID: ${releaseId}`);
    if (albumArtUrl) log(`Album Art: ${albumArtUrl}`);
    if (platformIds) {
      log(`Platform IDs: ${Object.keys(platformIds).join(', ')}`);
    }
    
    return result;
    
  } catch (error) {
    logError('=== ❌ Verification failed ===');
    logError(error);
    
    return {
      verified: false,
      source: 'musicbrainz',
      artist,
      title,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Batch verify multiple songs with automatic rate limiting
 * 
 * @param songs - Array of {artist, title} objects
 * @param onProgress - Optional callback for progress updates
 * @returns Array of VerificationResult
 */
export async function batchVerifyWithMusicBrainz(
  songs: Array<{ artist: string; title: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<VerificationResult[]> {
  log(`=== Batch verification: ${songs.length} songs ===`);
  
  const results: VerificationResult[] = [];
  
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    log(`\n[${i + 1}/${songs.length}] Verifying: ${song.artist} - ${song.title}`);
    
    const result = await verifyWithMusicBrainz(song.artist, song.title);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, songs.length);
    }
  }
  
  log(`=== Batch complete: ${results.filter(r => r.verified).length}/${results.length} verified ===`);
  
  return results;
}
