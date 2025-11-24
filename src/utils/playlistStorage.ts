// src/utils/playlistStorage.ts
/**
 * Playlist storage utilities
 * Handles localStorage persistence with versioning and migration
 */

import type { Playlist } from '@/types/playlist';
import type { Song } from '@/types/song';

const STORAGE_KEY = 'fonea.playlists.v1';
const SONGS_STORAGE_KEY = 'fonea.songs.v1';
const STORAGE_VERSION = 2; // Bumped to v2 for songs migration

type StorageData = {
  version: number;
  playlists: Playlist[];
  lastUpdated: string;
};

// Legacy format (v1)
type LegacyPlaylist = {
  id: string;
  name: string;
  description?: string;
  songIds: string[]; // Old format
  spotifyPlaylistId?: string;
  spotifyUrl?: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  coverImage?: string;
};

/**
 * Load songs from localStorage (for migration)
 */
function loadSongsFromStorage(): Song[] {
  try {
    const raw = localStorage.getItem(SONGS_STORAGE_KEY);
    if (!raw) return [];
    
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[PlaylistStorage] Failed to load songs for migration:', error);
    return [];
  }
}

/**
 * Migrate legacy playlist (v1) to new format (v2)
 */
function migrateLegacyPlaylist(legacy: LegacyPlaylist): Playlist {
  const songs = loadSongsFromStorage();
  const songMap = new Map(songs.map(s => [s.id, s]));
  
  // Convert songIds to full song objects
  const playlistSongs: Song[] = [];
  
  for (const songId of legacy.songIds || []) {
    const song = songMap.get(songId);
    if (song) {
      playlistSongs.push(song);
    } else {
      console.warn(`[Migration] Song ${songId} not found in library, skipping`);
    }
  }
  
  return {
    id: legacy.id,
    name: legacy.name,
    description: legacy.description,
    songs: playlistSongs, // New format!
    spotifyPlaylistId: legacy.spotifyPlaylistId,
    spotifyUrl: legacy.spotifyUrl,
    synced: legacy.synced,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    isPublic: legacy.isPublic,
    coverImage: legacy.coverImage,
  };
}

/**
 * Load playlists from localStorage
 */
export function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const data: StorageData = JSON.parse(raw);

    // Version check and migration
    if (data.version === 1) {
      console.log('[PlaylistStorage] Migrating from v1 to v2...');
      
      // Migrate each playlist
      const migratedPlaylists = (data.playlists as Array<Playlist | LegacyPlaylist>).map(legacy => {
        // Check if it has songIds (old format)
        if ('songIds' in legacy && Array.isArray(legacy.songIds)) {
          return migrateLegacyPlaylist(legacy as LegacyPlaylist);
        }
        // Already in new format
        return legacy as Playlist;
      });
      
      // Save migrated data
      savePlaylists(migratedPlaylists);
      
      console.log('[PlaylistStorage] Migration complete!');
      return migratedPlaylists;
    }

    if (data.version !== STORAGE_VERSION) {
      console.warn('[PlaylistStorage] Unknown version, using data as-is');
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
      if (!playlist.id || !playlist.name || !Array.isArray(playlist.songs)) {
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
    totalSongs: playlists.reduce((sum, p) => sum + p.songs.length, 0),
    storageSize: raw ? new Blob([raw]).size : 0,
  };
}
