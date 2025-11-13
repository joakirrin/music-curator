// src/utils/playlistStorage.ts
/**
 * Playlist storage utilities
 * Handles localStorage persistence with versioning
 */

import type { Playlist } from '@/types/playlist';

const STORAGE_KEY = 'fonea.playlists.v1';
const STORAGE_VERSION = 1;

type StorageData = {
  version: number;
  playlists: Playlist[];
  lastUpdated: string;
};

/**
 * Load playlists from localStorage
 */
export function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const data: StorageData = JSON.parse(raw);

    // Version check (for future migrations)
    if (data.version !== STORAGE_VERSION) {
      console.warn('[PlaylistStorage] Version mismatch, migrating...');
      // For now, just use the data as-is
      // In the future, add migration logic here
    }

    // Validate structure
    if (!Array.isArray(data.playlists)) {
      console.error('[PlaylistStorage] Invalid playlists data');
      return [];
    }

    return data.playlists;
  } catch (error) {
    console.error('[PlaylistStorage] Failed to load playlists:', error);
    return [];
  }
}

/**
 * Save playlists to localStorage
 */
export function savePlaylists(playlists: Playlist[]): void {
  try {
    const data: StorageData = {
      version: STORAGE_VERSION,
      playlists,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[PlaylistStorage] Failed to save playlists:', error);
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('⚠️ Storage limit reached. Try deleting old playlists or clearing cache.');
    }
  }
}

/**
 * Clear all playlists from localStorage
 * Use with caution!
 */
export function clearPlaylists(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[PlaylistStorage] Cleared all playlists');
  } catch (error) {
    console.error('[PlaylistStorage] Failed to clear playlists:', error);
  }
}

/**
 * Export playlists as JSON string (for backup)
 */
export function exportPlaylistsJSON(): string {
  const playlists = loadPlaylists();
  return JSON.stringify(playlists, null, 2);
}

/**
 * Import playlists from JSON string (for restore)
 */
export function importPlaylistsJSON(json: string): Playlist[] {
  try {
    const playlists = JSON.parse(json);
    
    if (!Array.isArray(playlists)) {
      throw new Error('Invalid format: expected array of playlists');
    }

    // Basic validation
    for (const playlist of playlists) {
      if (!playlist.id || !playlist.name || !Array.isArray(playlist.songIds)) {
        throw new Error(`Invalid playlist structure: ${playlist.id || 'unknown'}`);
      }
    }

    return playlists;
  } catch (error) {
    console.error('[PlaylistStorage] Failed to import playlists:', error);
    throw error;
  }
}

/**
 * Get storage stats (for debugging/UI)
 */
export function getStorageStats(): {
  count: number;
  totalSongs: number;
  storageSize: number;
} {
  const playlists = loadPlaylists();
  const raw = localStorage.getItem(STORAGE_KEY);
  
  return {
    count: playlists.length,
    totalSongs: playlists.reduce((sum, p) => sum + p.songIds.length, 0),
    storageSize: raw ? new Blob([raw]).size : 0,
  };
}
