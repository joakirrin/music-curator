// src/services/youtubeMusicService.ts
// YouTube Music search and metadata service
// Uses YouTube Data API v3 for music searches
// NOTE: Used for EXPORT ONLY, not auto-verification (quota concerns)

import { youtubeAuth } from './youtubeAuth';
import type { TrackMetadata, SearchResult } from '@/types/platformInterfaces';

const DEV = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[YouTubeMusic]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[YouTubeMusic]', ...args);
}

type YouTubeVideo = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    publishedAt: string;
  };
};

/**
 * Normalize string for comparison
 */
function normalize(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Calculate similarity score between two strings
 */
function similarity(a: string, b: string): number {
  const A = new Set(normalize(a).split(' ').filter(Boolean));
  const B = new Set(normalize(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((t) => {
    if (B.has(t)) inter++;
  });
  return inter / Math.max(A.size, B.size);
}

/**
 * Search YouTube for music videos
 */
async function searchYouTube(
  query: string,
  token: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoCategoryId', '10'); // Music category
  url.searchParams.set('maxResults', maxResults.toString());
  url.searchParams.set('q', query);

  log(`Searching YouTube: "${query}"`);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    logError(`Search failed: ${response.status}`, errorText.substring(0, 200));
    throw new Error(`YouTube search failed: ${response.status}`);
  }

  const data = await response.json();
  const items = (data?.items ?? []) as YouTubeVideo[];

  log(`Found ${items.length} results`);

  return items;
}

/**
 * Parse artist and title from YouTube video title
 * Common formats:
 * - "Artist - Title"
 * - "Artist | Title"
 * - "Title by Artist"
 * - "Artist: Title"
 */
function parseYouTubeTit le(videoTitle: string): {
  artist: string;
  title: string;
} {
  // Try common separators
  const separators = [' - ', ' | ', ' : ', ': '];

  for (const sep of separators) {
    if (videoTitle.includes(sep)) {
      const parts = videoTitle.split(sep);
      if (parts.length >= 2) {
        // Remove common suffixes like (Official Video), [Official Audio], etc.
        const cleanTitle = parts[1]
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/\s*\[.*?\]\s*/g, '')
          .trim();
        return {
          artist: parts[0].trim(),
          title: cleanTitle,
        };
      }
    }
  }

  // Try "Title by Artist"
  if (videoTitle.toLowerCase().includes(' by ')) {
    const parts = videoTitle.split(/\s+by\s+/i);
    if (parts.length >= 2) {
      return {
        title: parts[0].trim(),
        artist: parts[1].trim(),
      };
    }
  }

  // Fallback: use channel as artist, title as-is
  return {
    artist: '',
    title: videoTitle,
  };
}

/**
 * Pick best match from YouTube results
 */
function pickBestMatch(
  artist: string,
  title: string,
  items: YouTubeVideo[]
): YouTubeVideo | null {
  let best: { video: YouTubeVideo; score: number } | null = null;

  for (const video of items) {
    const parsed = parseYouTubeTitle(video.snippet.title);
    const artistSim = similarity(artist, parsed.artist || video.snippet.channelTitle);
    const titleSim = similarity(title, parsed.title);
    const score = artistSim * 0.55 + titleSim * 0.45;

    if (DEV && score > 0.3) {
      log(
        `  Match candidate: "${parsed.title}" by ${parsed.artist || video.snippet.channelTitle} (score: ${score.toFixed(2)})`
      );
    }

    if (!best || score > best.score) {
      best = { video, score };
    }
  }

  if (best) {
    log(`Best match score: ${best.score.toFixed(2)} (threshold: 0.4)`);
  }

  return best && best.score >= 0.4 ? best.video : null;
}

/**
 * Convert YouTube video to TrackMetadata
 */
function videoToTrackMetadata(video: YouTubeVideo): TrackMetadata {
  const parsed = parseYouTubeTitle(video.snippet.title);

  return {
    id: video.id.videoId,
    title: parsed.title,
    artist: parsed.artist || video.snippet.channelTitle,
    platform: 'youtube',
    platformUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    albumArtUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url,
    releaseDate: video.snippet.publishedAt,
  };
}

// ============================================
// PUBLIC API
// ============================================

export const youtubeMusicService = {
  platform: 'youtube',

  /**
   * Search for tracks on YouTube Music
   */
  async searchTrack(query: string, limit: number = 10): Promise<SearchResult> {
    log('=== Searching YouTube Music ===');
    log(`Query: "${query}"`);

    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not logged in to YouTube. Please sign in first.');
    }

    try {
      const videos = await searchYouTube(query, token, limit);

      const tracks: TrackMetadata[] = videos.map(videoToTrackMetadata);

      return {
        tracks,
        hasMore: videos.length === limit,
      };
    } catch (err) {
      logError('Search failed:', err);
      throw err;
    }
  },

  /**
   * Get track by video ID
   */
  async getTrackById(videoId: string): Promise<TrackMetadata | null> {
    log('=== Getting YouTube track by ID ===');
    log(`Video ID: ${videoId}`);

    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not logged in to YouTube.');
    }

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('id', videoId);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        logError(`Failed to get video: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const items = data?.items ?? [];

      if (items.length === 0) {
        log('Video not found');
        return null;
      }

      const video = items[0];
      const parsed = parseYouTubeTitle(video.snippet.title);

      return {
        id: video.id,
        title: parsed.title,
        artist: parsed.artist || video.snippet.channelTitle,
        platform: 'youtube',
        platformUrl: `https://www.youtube.com/watch?v=${video.id}`,
        albumArtUrl: video.snippet.thumbnails?.high?.url,
        releaseDate: video.snippet.publishedAt,
      };
    } catch (err) {
      logError('Failed to get track:', err);
      return null;
    }
  },

  /**
   * Verify a track exists on YouTube Music
   * Used for playlist export resolution
   */
  async verifyTrack(title: string, artist: string): Promise<TrackMetadata | null> {
    log('=== Verifying track on YouTube Music ===');
    log(`Title: "${title}"`);
    log(`Artist: "${artist}"`);

    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      logError('No access token available');
      return null;
    }

    // Build search queries from most specific to least specific
    const queries: string[] = [
      `${artist} ${title} official audio`,
      `${artist} ${title} official video`,
      `${artist} ${title}`,
      `${normalize(artist)} ${normalize(title)}`,
    ];

    log(`Will try ${queries.length} search queries`);

    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      log(`\nQuery ${i + 1}/${queries.length}: "${q}"`);

      try {
        const videos = await searchYouTube(q, token, 5);

        if (!videos.length) {
          log('No results for this query, trying next...');
          continue;
        }

        const best = pickBestMatch(artist, title, videos);

        if (!best) {
          log('No confident match in these results, trying next query...');
          continue;
        }

        log('=== ✅ Match found! ===');
        log(`YouTube Video: "${best.snippet.title}"`);
        log(`Video ID: ${best.id.videoId}`);

        return videoToTrackMetadata(best);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        logError(`Query ${i + 1} failed:`, message);
        // Continue to next query
      }
    }

    log('=== ❌ No match found after all queries ===');
    return null;
  },

  /**
   * Batch verify multiple tracks (for playlist export)
   */
  async verifyTracks(
    tracks: Array<{ title: string; artist: string }>
  ): Promise<(TrackMetadata | null)[]> {
    log(`=== Batch verifying ${tracks.length} tracks ===`);

    const results: (TrackMetadata | null)[] = [];

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      log(`\n[${i + 1}/${tracks.length}] Verifying: ${track.artist} - ${track.title}`);

      try {
        const result = await this.verifyTrack(track.title, track.artist);
        results.push(result);

        // Small delay to avoid rate limiting (YouTube has 100 units/second limit)
        if (i < tracks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (err) {
        logError(`Failed to verify track ${i + 1}:`, err);
        results.push(null);
      }
    }

    const successCount = results.filter((r) => r !== null).length;
    log(`=== Batch verification complete: ${successCount}/${tracks.length} verified ===`);

    return results;
  },
};
