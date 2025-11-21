// FILE: src/services/export/smartPlatformResolver.ts (FINAL REVISION FOR ROBUSTNESS)

import type { Song } from '@/types/song';
import type { SmartResolveResult } from './types';

const DEV = import.meta.env.DEV;

function log(...args: any[]) {
  if (DEV) console.log('[SmartResolver]', ...args);
}

// --- Helper Functions (Scoring updated to be title-focused) ---

/**
 * Normalize string for comparison
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
  
  const union = tokensA.size + tokensB.size - intersection;
  return intersection / union;
}

/**
 * Find best match from Spotify results (for Tier 3)
 * Weights title 70% and artist 30% for higher confidence
 */
function findBestMatch(results: any[], song: Song): { track: any; score: number } {
  const matches = results.map(track => {
    const artistMatch = calculateSimilarity(track.artists[0].name, song.artist);
    const titleMatch = calculateSimilarity(track.name, song.title);
    
    // Title is more important for matching tracks than artist details.
    const score = (artistMatch * 0.3) + (titleMatch * 0.7); 
    
    return { track, score };
  });

  return matches.sort((a, b) => b.score - a.score)[0];
}


// --- Tier 1: Direct ID Extraction (unchanged) ---
function extractSpotifyId(song: Song): string | null {
  if (song.platformIds?.spotify?.id && song.platformIds.spotify.id.length === 22) {
    return song.platformIds.spotify.id;
  }
  
  if (song.serviceUri?.startsWith('spotify:track:')) { 
    const id = song.serviceUri.split(':')[2];
    if (id && id.length === 22) return id;
  }
  if (song.serviceId && song.serviceId.length === 22) { 
    return song.serviceId;
  }
  if (song.serviceUrl?.includes('spotify.com/track/')) { 
    const match = song.serviceUrl.match(/track\/([a-zA-Z0-9]{22})/);
    if (match) return match[1];
  }
  if (song.spotifyUri?.startsWith('spotify:track:')) { 
    const id = song.spotifyUri.split(':')[2];
    if (id && id.length === 22) return id;
  }
  if (song.spotifyId && song.spotifyId.length === 22) { 
    return song.spotifyId;
  }
  
  return null;
}

// --- Tier 2 & 3: API Search Functions ---

/**
 * TIER 2: Soft Search (Simple query, returns 1)
 */
async function searchSoft(
  artist: string,
  title: string,
  token: string
): Promise<any | null> {
  const query = encodeURIComponent(`${title} ${artist}`);
  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=1&q=${query}&type=track&limit=1`, 
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.tracks?.items?.[0] || null;
}

/**
 * TIER 3: Hard Search (Last resort, returns 5 matches for scoring)
 * NEW: Query is now the simplest possible to maximize Spotify's internal ranking power.
 */
async function searchHard(
  artist: string,
  title: string,
  token: string
): Promise<any | null> {
  // NEW: Most flexible query: relies entirely on Spotify's ranking algorithm
  const query = encodeURIComponent(`${title} ${artist}`);
  
  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=1&q=${query}&type=track&limit=5`, 
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.tracks?.items || null;
}


// --- Main Resolver Function ---

/**
 * Implements the 3-Tier Search Flow
 */
export async function resolveSpotifySong(
  song: Song,
  token: string
): Promise<SmartResolveResult> {
  
  // TIER 1: Direct Link (Best - 100% confidence)
  const directId = extractSpotifyId(song);
  if (directId) {
    log(`TIER 1 (Direct): Found ${song.title} - ${directId}`);
    return {
      song,
      spotifyUri: `spotify:track:${directId}`,
      tier: 'direct',
      confidence: 1.0
    };
  }

  // TIER 2: Soft Search (MusicBrainz confirmed - simple match)
  if (song.verificationSource === "musicbrainz" || song.musicBrainzId) {
    log(`TIER 2 (Soft): Searching for "${song.title}" by ${song.artist}`);
    const softResult = await searchSoft(song.artist, song.title, token);
    
    if (softResult) {
      // Calculate confidence using the title-weighted score
      const confidence = (
        calculateSimilarity(softResult.artists[0].name, song.artist) * 0.3 +
        calculateSimilarity(softResult.name, song.title) * 0.7
      );
      
      // Low threshold (50%) since MusicBrainz already validated the song
      if (confidence > 0.5) { 
        log(`TIER 2 (Soft): Matched "${softResult.name}" with ${confidence.toFixed(2)} confidence`);
        return {
          song,
          spotifyUri: softResult.uri,
          tier: 'soft',
          confidence: 0.85 
        };
      }
    }
  }

  // TIER 3: Hard Search (Last Resort - rely on Spotify ranking + very low floor)
  log(`TIER 3 (Hard): Searching with most flexible query for ${song.title} ${song.artist}`);
  const hardResults = await searchHard(song.artist, song.title, token);
  
  if (hardResults && hardResults.length > 0) {
    const bestMatch = findBestMatch(hardResults, song);
    
    // FINAL THRESHOLD: 50%. Any result in the top 5 that scores above 50% is taken.
    if (bestMatch && bestMatch.score >= 0.50) { 
      log(`TIER 3 (Hard): Matched "${bestMatch.track.name}" with ${bestMatch.score.toFixed(2)} confidence`);
      return {
        song,
        spotifyUri: bestMatch.track.uri,
        tier: 'hard',
        confidence: bestMatch.score
      };
    }
  }

  // TIER 4: Not Available
  log(`TIER 4 (Failed): No match found for "${song.title}"`);
  return {
    song,
    spotifyUri: null,
    tier: 'failed',
    confidence: 0,
    reason: 'No match found on platform'
  };
}