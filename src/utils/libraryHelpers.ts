// src/utils/libraryHelpers.ts
/**
 * Library helper functions for session management
 */

import type { Song } from '@/types/song';
import type { Playlist } from '@/types/playlist';

/**
 * Get kept songs that are not in any playlist
 */
export function getOrphanedKeptSongs(songs: Song[], playlists: Playlist[]): Song[] {
  // Get all kept songs
  const keptSongs = songs.filter(s => s.feedback === 'keep');
  
  // Get all song IDs that are in at least one playlist
  const songsInPlaylists = new Set<string>();
  playlists.forEach(playlist => {
    playlist.songs.forEach(song => {
      songsInPlaylists.add(song.id);
    });
  });
  
  // Return kept songs NOT in any playlist
  return keptSongs.filter(s => !songsInPlaylists.has(s.id));
}

/**
 * Calculate library statistics
 */
export function getLibraryStats(songs: Song[]) {
  const total = songs.length;
  const kept = songs.filter(s => s.feedback === 'keep').length;
  const skipped = songs.filter(s => s.feedback === 'skip').length;
  const pending = songs.filter(s => s.feedback === 'pending').length;
  
  return { total, kept, skipped, pending };
}
