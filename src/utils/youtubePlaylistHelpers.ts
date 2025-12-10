// src/utils/youtubePlaylistHelpers.ts
/**
 * Helper functions for YouTube playlist management
 * Used in export and sync operations
 */

import type { Song } from '@/types/song';
import type { Playlist } from '@/types/playlist';

/**
 * Detect songs that are in local playlist but not in YouTube playlist
 * Compares by YouTube video ID for accuracy
 * 
 * @param localSongs - Songs in Fonea playlist
 * @param youtubeSongs - Songs currently in YouTube playlist
 * @returns Songs that need to be added to YouTube
 */
export function detectNewSongs(localSongs: Song[], youtubeSongs: Song[]): Song[] {
  // Create a Set of YouTube IDs for fast lookup
  const youtubeIds = new Set(
    youtubeSongs
      .map(s => s.platformIds?.youtube?.id)
      .filter(Boolean)
  );

  // Find songs that aren't in YouTube yet
  return localSongs.filter(song => {
    const youtubeId = song.platformIds?.youtube?.id;
    
    // If song doesn't have YouTube ID yet, it needs to be resolved and added
    if (!youtubeId) return true;
    
    // If song has YouTube ID but it's not in the YouTube playlist, add it
    return !youtubeIds.has(youtubeId);
  });
}

/**
 * Check if playlist is close to YouTube's limit
 * YouTube allows ~5000 songs per playlist
 * 
 * @param songCount - Current number of songs
 * @returns Warning message if close to limit, null otherwise
 */
export function checkPlaylistLimit(songCount: number): string | null {
  const YOUTUBE_LIMIT = 5000;
  const WARNING_THRESHOLD = 4000;

  if (songCount >= YOUTUBE_LIMIT) {
    return `Cannot add songs: YouTube playlists have a limit of ${YOUTUBE_LIMIT} songs.`;
  }

  if (songCount >= WARNING_THRESHOLD) {
    const remaining = YOUTUBE_LIMIT - songCount;
    return `Warning: Approaching YouTube limit (${songCount}/${YOUTUBE_LIMIT}). Only ${remaining} songs remaining.`;
  }

  return null;
}

/**
 * Format playlist info for display
 * 
 * @param playlist - Fonea playlist
 * @returns Formatted info string
 */
export function formatPlaylistInfo(playlist: Playlist): {
  songCount: number;
  duration: string | null;
  isPublic: boolean;
} {
  const songCount = playlist.songs.length;
  
  // Calculate total duration
  const totalSeconds = playlist.songs.reduce((acc, song) => {
    if (song.durationMs) return acc + Math.floor(song.durationMs / 1000);
    if (song.duration) return acc + song.duration;
    return acc;
  }, 0);

  let duration: string | null = null;
  if (totalSeconds > 0) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      duration = `${hours}h ${minutes}m`;
    } else {
      duration = `${minutes}m`;
    }
  }

  return {
    songCount,
    duration,
    isPublic: playlist.isPublic,
  };
}
