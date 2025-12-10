// src/services/export/youtubeResolver.ts
// Smart Resolver for YouTube Music Export
// Implements 3-tier resolution strategy to minimize API quota usage
// Pattern inspired by Spotify resolver but optimized for YouTube constraints

import type { Song } from '@/types/song';
import type { SmartResolveResult } from './types';
import { youtubeApiClient } from '../youtube/YouTubeApiClient';
import type { YouTubeSearchResult } from '../youtube/YouTubeApiClient';

const DEV = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[YouTubeResolver]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[YouTubeResolver]', ...args);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize string for comparison (remove accents, punctuation, lowercase)
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
 * Calculate similarity score between two strings (Jaccard similarity)
 * Returns value between 0 (no match) and 1 (perfect match)
 */
function calculateSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalize(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalize(b).split(' ').filter(Boolean));
  
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  
  let intersection = 0;
  tokensA.forEach(token => {
    if (tokensB.has(token)) intersection++;
  });
  
  const union = tokensA.size + tokensB.size - intersection;
  return intersection / union;
}

/**
 * Parse YouTube video title to extract artist and title
 * Common patterns:
 * - "Artist - Title"
 * - "Artist | Title"
 * - "Title by Artist"
 * - "Artist: Title"
 */
function parseVideoTitle(videoTitle: string): { artist: string; title: string } {
  // Remove common suffixes first
  let cleaned = videoTitle
    .replace(/\s*\(.*?(official|video|audio|lyric|hd|4k|music video).*?\)\s*/gi, '')
    .replace(/\s*\[.*?(official|video|audio|lyric|hd|4k|music video).*?\]\s*/gi, '')
    .trim();
  
  // Try common separators
  const separators = [' - ', ' | ', ' : ', ': ', ' – ', ' — '];
  
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep);
      if (parts.length >= 2) {
        return {
          artist: parts[0].trim(),
          title: parts.slice(1).join(sep).trim(),
        };
      }
    }
  }
  
  // Try "Title by Artist"
  if (cleaned.toLowerCase().includes(' by ')) {
    const parts = cleaned.split(/\s+by\s+/i);
    if (parts.length >= 2) {
      return {
        title: parts[0].trim(),
        artist: parts[1].trim(),
      };
    }
  }
  
  // Fallback: couldn't parse
  return {
    artist: '',
    title: cleaned,
  };
}

/**
 * Find best match from YouTube search results
 * Uses weighted scoring: title (70%) + artist (30%)
 * This prioritizes title matching as YouTube titles are more consistent
 */
function findBestMatch(
  results: YouTubeSearchResult[],
  targetArtist: string,
  targetTitle: string
): { video: YouTubeSearchResult; score: number } | null {
  if (results.length === 0) return null;
  
  const matches = results.map(video => {
    const parsed = parseVideoTitle(video.snippet.title);
    
    // Use parsed artist if available, otherwise use channel title
    const videoArtist = parsed.artist || video.snippet.channelTitle;
    const videoTitle = parsed.title;
    
    const artistMatch = calculateSimilarity(videoArtist, targetArtist);
    const titleMatch = calculateSimilarity(videoTitle, targetTitle);
    
    // Title is more important for YouTube (70/30 split)
    const score = (titleMatch * 0.7) + (artistMatch * 0.3);
    
    if (DEV && score > 0.3) {
      log(`  Candidate: "${videoTitle}" by ${videoArtist} (score: ${score.toFixed(2)})`);
    }
    
    return { video, score };
  });
  
  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  
  return matches[0];
}

// ============================================
// TIER EXTRACTION FUNCTIONS
// ============================================

/**
 * TIER 1: Extract YouTube video ID from song's existing data
 * This is the best case - no API calls needed
 * 
 * Checks in order:
 * 1. platformIds.youtube.id
 * 2. serviceUri (youtube:video:ID format)
 * 3. serviceUrl (youtube.com/watch?v=ID)
 */
function extractYouTubeId(song: Song): string | null {
  // Check platformIds first (most reliable)
  if (song.platformIds?.youtube?.id) {
    const id = song.platformIds.youtube.id;
    if (id && id.length === 11) { // YouTube video IDs are 11 chars
      return id;
    }
  }
  
  // Check serviceUri (format: youtube:video:ID)
  if (song.serviceUri?.startsWith('youtube:video:')) {
    const id = song.serviceUri.split(':')[2];
    if (id && id.length === 11) return id;
  }
  
  // Check serviceUrl (URL format)
  if (song.serviceUrl?.includes('youtube.com/watch?v=')) {
    const match = song.serviceUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  
  if (song.serviceUrl?.includes('youtu.be/')) {
    const match = song.serviceUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * TIER 2: Soft Search (simple query, first result)
 * Used when song is verified by MusicBrainz (high confidence in metadata)
 * API Cost: ~100 quota units (1 search)
 */
async function searchSoft(
  artist: string,
  title: string
): Promise<YouTubeSearchResult | null> {
  try {
    log(`TIER 2 (Soft): Searching for "${title}" by ${artist}`);
    
    // Simple query: artist + title
    const query = `${artist} ${title}`;
    const results = await youtubeApiClient.search(query, 1);
    
    if (results.length === 0) {
      log(`TIER 2: No results found`);
      return null;
    }
    
    const result = results[0];
    const parsed = parseVideoTitle(result.snippet.title);
    
    // Calculate confidence
    const videoArtist = parsed.artist || result.snippet.channelTitle;
    const confidence = (
      calculateSimilarity(videoArtist, artist) * 0.3 +
      calculateSimilarity(parsed.title, title) * 0.7
    );
    
    // Low threshold (50%) since MusicBrainz already validated the song
    if (confidence > 0.5) {
      log(`TIER 2: Match found with ${confidence.toFixed(2)} confidence`);
      return result;
    }
    
    log(`TIER 2: Match too low confidence (${confidence.toFixed(2)})`);
    return null;
  } catch (err) {
    logError('TIER 2: Search failed', err);
    return null;
  }
}

/**
 * TIER 3: Hard Search (multiple results with scoring)
 * Last resort - tries flexible queries and picks best match
 * API Cost: ~100 quota units (1 search with 5 results)
 */
async function searchHard(
  artist: string,
  title: string
): Promise<YouTubeSearchResult | null> {
  try {
    log(`TIER 3 (Hard): Searching with flexible query`);
    
    // Most flexible query - let YouTube's ranking do the work
    const query = `${title} ${artist}`;
    const results = await youtubeApiClient.search(query, 5);
    
    if (results.length === 0) {
      log(`TIER 3: No results found`);
      return null;
    }
    
    // Find best match using similarity scoring
    const bestMatch = findBestMatch(results, artist, title);
    
    if (!bestMatch) {
      log(`TIER 3: No matches found`);
      return null;
    }
    
    // Threshold: 50% (we're more lenient in Tier 3)
    if (bestMatch.score >= 0.50) {
      log(`TIER 3: Match found with ${bestMatch.score.toFixed(2)} confidence`);
      return bestMatch.video;
    }
    
    log(`TIER 3: Best match score too low (${bestMatch.score.toFixed(2)})`);
    return null;
  } catch (err) {
    logError('TIER 3: Search failed', err);
    return null;
  }
}

// ============================================
// MAIN RESOLVER FUNCTION
// ============================================

/**
 * Resolve a song to YouTube video ID using 3-tier strategy
 * 
 * TIER 1 (Direct): Extract ID from song data (0 API calls)
 * TIER 2 (Soft): Simple search if verified by MusicBrainz (~100 units)
 * TIER 3 (Hard): Flexible search with scoring (~100 units)
 * 
 * Returns SmartResolveResult with:
 * - youtubeId: Video ID if found
 * - tier: Which tier found it
 * - confidence: Match confidence (0-1)
 * - reason: Error message if failed
 * 
 * @param song - Song to resolve
 * @returns Resolution result
 */
export async function resolveYouTubeSong(
  song: Song
): Promise<SmartResolveResult> {
  log(`\n=== Resolving: "${song.title}" by ${song.artist} ===`);
  
  // TIER 1: Direct Link (Best - 100% confidence, 0 API calls)
  const directId = extractYouTubeId(song);
  if (directId) {
    log(`✅ TIER 1 (Direct): Found ID ${directId}`);
    return {
      song,
      youtubeId: directId,
      tier: 'direct',
      confidence: 1.0,
    };
  }
  
  // TIER 2: Soft Search (MusicBrainz verified songs only)
  // This minimizes API calls for unverified songs
  if (song.verificationSource === 'musicbrainz' || song.musicBrainzId) {
    const softResult = await searchSoft(song.artist, song.title);
    
    if (softResult) {
      const videoId = softResult.id.videoId;
      const parsed = parseVideoTitle(softResult.snippet.title);
      const videoArtist = parsed.artist || softResult.snippet.channelTitle;
      
      const confidence = (
        calculateSimilarity(videoArtist, song.artist) * 0.3 +
        calculateSimilarity(parsed.title, song.title) * 0.7
      );
      
      log(`✅ TIER 2 (Soft): Found ${videoId} with ${confidence.toFixed(2)} confidence`);
      
      return {
        song,
        youtubeId: videoId,
        tier: 'soft',
        confidence: 0.85, // High confidence for MusicBrainz + successful match
      };
    }
  }
  
  // TIER 3: Hard Search (Last resort - flexible with scoring)
  log(`Attempting TIER 3 (Hard)...`);
  const hardResult = await searchHard(song.artist, song.title);
  
  if (hardResult) {
    const videoId = hardResult.id.videoId;
    const parsed = parseVideoTitle(hardResult.snippet.title);
    const videoArtist = parsed.artist || hardResult.snippet.channelTitle;
    
    const confidence = (
      calculateSimilarity(videoArtist, song.artist) * 0.3 +
      calculateSimilarity(parsed.title, song.title) * 0.7
    );
    
    log(`✅ TIER 3 (Hard): Found ${videoId} with ${confidence.toFixed(2)} confidence`);
    
    return {
      song,
      youtubeId: videoId,
      tier: 'hard',
      confidence: confidence,
    };
  }
  
  // TIER 4: Not Available
  log(`❌ Failed to resolve: "${song.title}" by ${song.artist}`);
  
  return {
    song,
    youtubeId: null,
    tier: 'failed',
    confidence: 0,
    reason: 'No match found on YouTube',
  };
}

/**
 * Batch resolve multiple songs
 * Includes intelligent delay between searches to avoid rate limiting
 * 
 * @param songs - Songs to resolve
 * @param onProgress - Optional progress callback
 * @returns Array of resolution results
 */
export async function resolveYouTubeSongs(
  songs: Song[],
  onProgress?: (current: number, total: number) => void
): Promise<SmartResolveResult[]> {
  log(`\n=== Batch resolving ${songs.length} songs ===`);
  
  const results: SmartResolveResult[] = [];
  let apiCallCount = 0;
  
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    log(`\n[${i + 1}/${songs.length}] Processing: ${song.artist} - ${song.title}`);
    
    const result = await resolveYouTubeSong(song);
    results.push(result);
    
    // Track API calls (Tier 2 and 3 use API)
    if (result.tier === 'soft' || result.tier === 'hard') {
      apiCallCount++;
    }
    
    if (onProgress) {
      onProgress(i + 1, songs.length);
    }
    
    // Delay between API calls to avoid rate limiting
    // Only delay if we made an API call and there are more songs
    if ((result.tier === 'soft' || result.tier === 'hard') && i < songs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
    }
  }
  
  const successCount = results.filter(r => r.youtubeId !== null).length;
  const failCount = results.filter(r => r.youtubeId === null).length;
  const tier1Count = results.filter(r => r.tier === 'direct').length;
  const tier2Count = results.filter(r => r.tier === 'soft').length;
  const tier3Count = results.filter(r => r.tier === 'hard').length;
  
  log(`\n=== Batch Resolution Complete ===`);
  log(`Total: ${songs.length} songs`);
  log(`Success: ${successCount} (${((successCount/songs.length)*100).toFixed(1)}%)`);
  log(`Failed: ${failCount}`);
  log(`Tier 1 (Direct): ${tier1Count} (0 API calls)`);
  log(`Tier 2 (Soft): ${tier2Count} (~${tier2Count * 100} quota units)`);
  log(`Tier 3 (Hard): ${tier3Count} (~${tier3Count * 100} quota units)`);
  log(`Total API Calls: ${apiCallCount}`);
  log(`Estimated Quota Used: ~${apiCallCount * 100} units`);
  
  return results;
}
