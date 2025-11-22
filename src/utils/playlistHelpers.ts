// src/utils/playlistHelpers.ts
/**
 * Playlist Helper Functions (Phase 4.5.6)
 * 
 * Utilities for updating playlist data after export operations
 */

import type { Playlist } from '@/types/playlist';
import type { Song } from '@/types/song';

/**
 * Update songs in a playlist with new sync status
 * This creates a new playlist object with updated songs while preserving all other fields
 */
export function updatePlaylistSongs(
  playlist: Playlist,
  updatedSongs: Song[]
): Playlist {
  // Create a map of updated songs by ID for efficient lookup
  const updatedSongsMap = new Map(updatedSongs.map(song => [song.id, song]));
  
  // Update existing songs with their new sync status
  const newSongs = playlist.songs.map(song => {
    const updated = updatedSongsMap.get(song.id);
    return updated || song;
  });
  
  return {
    ...playlist,
    songs: newSongs,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Mark playlist as synced after successful export
 */
export function markPlaylistAsSynced(
  playlist: Playlist,
  platformPlaylistId: string,
  platformUrl: string
): Playlist {
  return {
    ...playlist,
    spotifyPlaylistId: platformPlaylistId,
    spotifyUrl: platformUrl,
    synced: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get songs that failed to export from a playlist
 */
export function getFailedExportSongs(playlist: Playlist): Song[] {
  return playlist.songs.filter(
    song => 
      song.overallSyncStatus === 'all_failed' ||
      song.syncStatus?.spotify?.status === 'failed'
  );
}

/**
 * Get songs that were successfully exported from a playlist
 */
export function getSuccessfulExportSongs(playlist: Playlist): Song[] {
  return playlist.songs.filter(
    song =>
      song.overallSyncStatus === 'all_success' ||
      song.syncStatus?.spotify?.status === 'success'
  );
}

/**
 * Check if a playlist has any failed exports
 */
export function hasFailedExports(playlist: Playlist): boolean {
  return playlist.songs.some(
    song =>
      song.overallSyncStatus === 'all_failed' ||
      song.overallSyncStatus === 'partial_success'
  );
}

/**
 * Calculate export statistics for a playlist
 */
export function calculateExportStats(playlist: Playlist): {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
} {
  const total = playlist.songs.length;
  let successful = 0;
  let failed = 0;
  let pending = 0;
  
  playlist.songs.forEach(song => {
    switch (song.overallSyncStatus) {
      case 'all_success':
        successful++;
        break;
      case 'all_failed':
        failed++;
        break;
      case 'partial_success':
        // Count as successful if at least one platform succeeded
        successful++;
        break;
      default:
        pending++;
    }
  });
  
  const successRate = total > 0 ? (successful / total) * 100 : 0;
  
  return {
    total,
    successful,
    failed,
    pending,
    successRate,
  };
}
