// src/hooks/usePlaylistsState.ts
/**
 * Playlist state management hook
 * Provides CRUD operations and state persistence
 */

import { useState, useEffect, useCallback } from 'react';
import type { Playlist, CreatePlaylistInput, UpdatePlaylistInput } from '@/types/playlist';
import { loadPlaylists, savePlaylists } from '@/utils/playlistStorage';

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
      songIds: input.songIds || [],
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
   * Add songs to a playlist
   */
  const addSongsToPlaylist = useCallback((playlistId: string, songIds: string[]): void => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id !== playlistId) return playlist;

        // Avoid duplicates
        const existingIds = new Set(playlist.songIds);
        const newSongIds = songIds.filter(id => !existingIds.has(id));

        if (newSongIds.length === 0) {
          console.warn('[usePlaylistsState] All songs already in playlist');
          return playlist;
        }

        return {
          ...playlist,
          songIds: [...playlist.songIds, ...newSongIds],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  /**
   * Remove songs from a playlist
   */
  const removeSongsFromPlaylist = useCallback((playlistId: string, songIds: string[]): void => {
    const idsToRemove = new Set(songIds);

    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id !== playlistId) return playlist;

        return {
          ...playlist,
          songIds: playlist.songIds.filter(id => !idsToRemove.has(id)),
          updatedAt: new Date().toISOString(),
        };
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
   * Get playlists containing a specific song
   */
  const getPlaylistsForSong = useCallback(
    (songId: string): Playlist[] => {
      return playlists.filter(p => p.songIds.includes(songId));
    },
    [playlists]
  );

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
    
    // Song operations
    addSongsToPlaylist,
    removeSongsFromPlaylist,
    
    // Queries
    getPlaylist,
    playlistNameExists,
    getPlaylistsForSong,
    
    // Sync operations
    markAsSynced,
    
    // Danger zone
    clearAllPlaylists,
  };
}
