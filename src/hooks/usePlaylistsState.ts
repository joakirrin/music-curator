// src/hooks/usePlaylistsState.ts (MODIFIED - Phase 4.5.6)
/**
 * Playlist state management hook
 * Provides CRUD operations and state persistence
 * 
 * IMPORTANT: Playlists now store FULL song objects, not IDs
 */

import { useState, useEffect, useCallback } from 'react';
import type { Playlist, CreatePlaylistInput, UpdatePlaylistInput } from '@/types/playlist';
import type { Song } from '@/types/song';
import { loadPlaylists, savePlaylists } from '@/utils/playlistStorage';
// NEW: Import helper for updating playlist songs
import { updatePlaylistSongs as updatePlaylistSongsHelper } from '@/utils/playlistHelpers';

/**
 * Generate a unique playlist ID
 */
function generatePlaylistId(): string {
  return `playlist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook for managing playlists state
 */
export function usePlaylistsState() {
  // Initialize state from localStorage (lazy initialization)
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      return loadPlaylists();
    } catch (error) {
      console.error('[usePlaylistsState] Failed to load playlists:', error);
      return [];
    }
  });

  // Auto-save to localStorage whenever playlists change
  useEffect(() => {
    try {
      savePlaylists(playlists);
    } catch (error) {
      console.error('[usePlaylistsState] Failed to save playlists:', error);
    }
  }, [playlists]);

  /**
   * Create a new playlist
   */
  const createPlaylist = useCallback((input: CreatePlaylistInput): Playlist => {
    const now = new Date().toISOString();
    
    const newPlaylist: Playlist = {
      id: generatePlaylistId(),
      name: input.name.trim(),
      description: input.description?.trim(),
      songs: input.songs || [], // Full song objects
      synced: false,
      createdAt: now,
      updatedAt: now,
      isPublic: input.isPublic ?? false,
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    
    return newPlaylist;
  }, []);

  /**
   * Update playlist metadata (name, description, isPublic)
   */
  const updatePlaylist = useCallback((id: string, updates: UpdatePlaylistInput): void => {
    setPlaylists(prev =>
      prev.map(playlist =>
        playlist.id === id
          ? {
              ...playlist,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : playlist
      )
    );
  }, []);

  /**
   * Delete a playlist
   */
  const deletePlaylist = useCallback((id: string): void => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  /**
   * Add songs to a playlist (now takes full Song objects)
   */
  const addSongsToPlaylist = useCallback((playlistId: string, songs: Song[]): void => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id !== playlistId) return playlist;

        // Avoid duplicates by song.id
        const existingIds = new Set(playlist.songs.map(s => s.id));
        const newSongs = songs.filter(song => !existingIds.has(song.id));

        if (newSongs.length === 0) {
          console.warn('[usePlaylistsState] All songs already in playlist');
          return playlist;
        }

        return {
          ...playlist,
          songs: [...playlist.songs, ...newSongs],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  /**
   * Remove songs from a playlist (by song IDs)
   */
  const removeSongsFromPlaylist = useCallback((playlistId: string, songIds: string[]): void => {
    const idsToRemove = new Set(songIds);

    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id !== playlistId) return playlist;

        return {
          ...playlist,
          songs: playlist.songs.filter(song => !idsToRemove.has(song.id)),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  /**
   * NEW: Update songs in a playlist (for sync status updates after export)
   * This replaces existing songs with updated versions (e.g., with new syncStatus)
   */
  const updatePlaylistSongsStatus = useCallback((playlistId: string, updatedSongs: Song[]): void => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id !== playlistId) return playlist;
        
        return updatePlaylistSongsHelper(playlist, updatedSongs);
      })
    );
  }, []);

  /**
   * Get a specific playlist by ID
   */
  const getPlaylist = useCallback(
    (id: string): Playlist | undefined => {
      return playlists.find(p => p.id === id);
    },
    [playlists]
  );

  /**
   * Check if a playlist name already exists (case-insensitive)
   */
  const playlistNameExists = useCallback(
    (name: string, excludeId?: string): boolean => {
      const normalizedName = name.trim().toLowerCase();
      return playlists.some(
        p => p.id !== excludeId && p.name.toLowerCase() === normalizedName
      );
    },
    [playlists]
  );

  /**
   * Get playlists containing a specific song (by song ID)
   */
  const getPlaylistsForSong = useCallback(
    (songId: string): Playlist[] => {
      return playlists.filter(p => p.songs.some(s => s.id === songId));
    },
    [playlists]
  );

  /**
   * Check if a song exists in any playlist (by song ID)
   */
  const isSongInAnyPlaylist = useCallback(
    (songId: string): boolean => {
      return playlists.some(p => p.songs.some(s => s.id === songId));
    },
    [playlists]
  );

  /**
   * Get all unique songs across all playlists
   */
  const getAllPlaylistSongs = useCallback((): Song[] => {
    const songMap = new Map<string, Song>();
    
    playlists.forEach(playlist => {
      playlist.songs.forEach(song => {
        if (!songMap.has(song.id)) {
          songMap.set(song.id, song);
        }
      });
    });
    
    return Array.from(songMap.values());
  }, [playlists]);

  /**
   * Mark playlist as synced with Spotify
   */
  const markAsSynced = useCallback(
    (id: string, spotifyPlaylistId: string, spotifyUrl: string): void => {
      setPlaylists(prev =>
        prev.map(playlist =>
          playlist.id === id
            ? {
                ...playlist,
                spotifyPlaylistId,
                spotifyUrl,
                synced: true,
                updatedAt: new Date().toISOString(),
              }
            : playlist
        )
      );
    },
    []
  );

  /**
   * Clear all playlists (dangerous!)
   */
  const clearAllPlaylists = useCallback((): void => {
    if (
      window.confirm(
        '⚠️ Are you sure you want to delete ALL playlists?\n\nThis cannot be undone!\n\n(Playlists synced to Spotify will remain on Spotify)'
      )
    ) {
      setPlaylists([]);
    }
  }, []);

  return {
    // State
    playlists,
    
    // CRUD operations
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    
    // Song operations (now work with full Song objects)
    addSongsToPlaylist,
    removeSongsFromPlaylist,
    
    // NEW: Update songs with sync status (Phase 4.5.6)
    updatePlaylistSongsStatus,
    
    // Queries
    getPlaylist,
    playlistNameExists,
    getPlaylistsForSong,
    isSongInAnyPlaylist,
    getAllPlaylistSongs,
    
    // Sync operations
    markAsSynced,
    
    // Danger zone
    clearAllPlaylists,
  };
}
