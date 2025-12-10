import type { Song } from "@/types/song";
import type { YouTubeVideo, YouTubeSearchResult } from "@/services/youtube/YouTubeApiClient";

// Type from ImportChatGPTModal (also used there)
type ChatGPTRecommendation = {
  title: string;
  artist: string;
  album?: string;
  year?: string;
  serviceUri?: string;
  serviceUrl?: string;
  spotifyUri?: string;
  spotifyUrl?: string;
  previewUrl?: string;
  reason?: string;
  duration?: number;
};

/**
 * Maps a ChatGPT recommendation to a Song object
 * Extracted from ImportChatGPTModal for reusability
 */
export function mapChatGPTRecommendationToSong(
  rec: ChatGPTRecommendation,
  round: number,
  index: number,
  autoVerify: boolean = true
): Song {
  if (!rec.title || !rec.artist) {
    throw new Error(`Recommendation #${index + 1} is missing required fields (title or artist)`);
  }

  const serviceLink = normalizeServiceLink(
    rec.serviceUri || rec.serviceUrl || rec.spotifyUri || rec.spotifyUrl
  );

  return {
    id: `chatgpt-${Date.now()}-${index}`,
    title: rec.title,
    artist: rec.artist,
    album: rec.album,
    year: rec.year,
    source: "chatgpt",
    round: round,
    feedback: "pending",
    spotifyUri: serviceLink,
    addedAt: new Date().toISOString(),
    comments: rec.reason,
    duration: rec.duration,
    platforms: [],
    liked: false,
    toAdd: false,
    verificationStatus: autoVerify ? "checking" : undefined,
  };
}

/**
 * Normalizes service link to URI format (copied from ImportChatGPTModal)
 */
function normalizeServiceLink(input?: string): string | undefined {
  if (!input) return undefined;
  if (input.includes(':')) return input;
  
  const spotifyMatch = input.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) return `spotify:track:${spotifyMatch[1]}`;
  
  const youtubeMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) return `youtube:video:${youtubeMatch[1]}`;
  
  const appleMusicMatch = input.match(/music\.apple\.com\/.*\/album\/.*\/(\d+)\?i=(\d+)/);
  if (appleMusicMatch) return `applemusic:track:${appleMusicMatch[2]}`;
  
  if (input.match(/^[a-zA-Z0-9]{22}$/)) return `spotify:track:${input}`;
  
  return input;
}

/**
 * Maps a Song to feedback format for GPT
 */
export function mapSongToFeedbackItem(song: Song) {
  return {
    title: song.title,
    artist: song.artist,
    decision: song.feedback === "keep" ? "keep" : "skip",
    userFeedback: song.userFeedback || undefined,
  };
}

/**
 * Maps a failed Song to replacement format for GPT
 */
export function mapSongToReplacementItem(song: Song) {
  return {
    title: song.title,
    artist: song.artist,
    reason: song.verificationError || "not_found",
  };
}

// ============================================
// YOUTUBE VIDEO MAPPING
// ============================================

/**
 * Parse YouTube video title to extract artist and title
 * 
 * Handles common formats:
 * - "Artist - Title"
 * - "Artist | Title" 
 * - "Title by Artist"
 * - "Artist: Title"
 * 
 * Also removes common suffixes like:
 * - (Official Video)
 * - [Official Audio]
 * - (Lyric Video)
 * - etc.
 */
function parseYouTubeVideoTitle(videoTitle: string): { artist: string; title: string } {
  // Remove common suffixes first
  let cleaned = videoTitle
    .replace(/\s*\(.*?(official|video|audio|lyric|hd|4k|music video|mv).*?\)\s*/gi, '')
    .replace(/\s*\[.*?(official|video|audio|lyric|hd|4k|music video|mv).*?\]\s*/gi, '')
    .trim();
  
  // Try common separators (in order of reliability)
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
  
  // Try "Title by Artist" pattern
  if (cleaned.toLowerCase().includes(' by ')) {
    const parts = cleaned.split(/\s+by\s+/i);
    if (parts.length >= 2) {
      return {
        title: parts[0].trim(),
        artist: parts[1].trim(),
      };
    }
  }
  
  // Fallback: couldn't parse artist from title
  return {
    artist: '',
    title: cleaned,
  };
}

/**
 * Convert ISO 8601 duration to seconds
 * Examples: "PT4M33S" → 273, "PT1H2M10S" → 3730
 */
function parseDuration(isoDuration?: string): number | undefined {
  if (!isoDuration) return undefined;
  
  try {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return undefined;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  } catch {
    return undefined;
  }
}

/**
 * Maps a YouTube video (from videos.list API) to a Song object
 * This is used when importing playlists or creating songs from video IDs
 * 
 * @param video - YouTube video object with snippet and contentDetails
 * @param source - Source of the song (default: 'imported')
 * @returns Fonea Song object
 */
export function mapYouTubeVideoToSong(
  video: YouTubeVideo,
  source: 'imported' | 'manual' = 'imported'
): Song {
  const parsed = parseYouTubeVideoTitle(video.snippet.title);
  
  // Use parsed artist if available, otherwise use channel title
  const artist = parsed.artist || video.snippet.channelTitle;
  const title = parsed.title;
  
  // Parse duration from ISO 8601 format
  const durationSeconds = parseDuration(video.contentDetails?.duration);
  const durationMs = durationSeconds ? durationSeconds * 1000 : undefined;
  
  // Get best available thumbnail
  const thumbnails = video.snippet.thumbnails;
  const albumArtUrl = 
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url;
  
  // Extract publish year from publishedAt
  const year = video.snippet.publishedAt 
    ? new Date(video.snippet.publishedAt).getFullYear().toString()
    : undefined;
  
  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
  
  return {
    id: `youtube-${video.id}-${Date.now()}`,
    title: title,
    artist: artist,
    year: year,
    source: source,
    feedback: 'pending',
    addedAt: new Date().toISOString(),
    platforms: ['YouTube'],
    liked: false,
    toAdd: false,
    
    // Duration
    duration: durationSeconds,
    durationMs: durationMs,
    
    // Platform IDs
    platformIds: {
      youtube: {
        id: video.id,
        url: videoUrl,
      },
    },
    
    // Service fields (for compatibility)
    serviceUri: `youtube:video:${video.id}`,
    serviceUrl: videoUrl,
    
    // Media
    albumArtUrl: albumArtUrl,
    
    // Additional metadata
    releaseDate: video.snippet.publishedAt,
  };
}

/**
 * Maps a YouTube search result to a Song object
 * This is used when resolving songs during export
 * Note: Search results don't include duration, so we mark it as undefined
 * 
 * @param searchResult - YouTube search result
 * @param source - Source of the song (default: 'manual')
 * @returns Fonea Song object
 */
export function mapYouTubeSearchResultToSong(
  searchResult: YouTubeSearchResult,
  source: 'imported' | 'manual' = 'manual'
): Song {
  const videoId = searchResult.id.videoId;
  const parsed = parseYouTubeVideoTitle(searchResult.snippet.title);
  
  // Use parsed artist if available, otherwise use channel title
  const artist = parsed.artist || searchResult.snippet.channelTitle;
  const title = parsed.title;
  
  // Get best available thumbnail (search results have fewer options)
  const thumbnails = searchResult.snippet.thumbnails;
  const albumArtUrl = 
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url;
  
  // Extract publish year
  const year = searchResult.snippet.publishedAt 
    ? new Date(searchResult.snippet.publishedAt).getFullYear().toString()
    : undefined;
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  return {
    id: `youtube-${videoId}-${Date.now()}`,
    title: title,
    artist: artist,
    year: year,
    source: source,
    feedback: 'pending',
    addedAt: new Date().toISOString(),
    platforms: ['YouTube'],
    liked: false,
    toAdd: false,
    
    // Note: Search results don't include duration
    // Duration will be undefined until we fetch full video details
    
    // Platform IDs
    platformIds: {
      youtube: {
        id: videoId,
        url: videoUrl,
      },
    },
    
    // Service fields
    serviceUri: `youtube:video:${videoId}`,
    serviceUrl: videoUrl,
    
    // Media
    albumArtUrl: albumArtUrl,
    
    // Additional metadata
    releaseDate: searchResult.snippet.publishedAt,
  };
}

/**
 * Batch map multiple YouTube videos to Song objects
 * Useful for importing playlists
 * 
 * @param videos - Array of YouTube videos
 * @param source - Source for all songs (default: 'imported')
 * @returns Array of Song objects
 */
export function mapYouTubeVideosToSongs(
  videos: YouTubeVideo[],
  source: 'imported' | 'manual' = 'imported'
): Song[] {
  return videos.map(video => mapYouTubeVideoToSong(video, source));
}
