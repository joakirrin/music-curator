// FILE: src/types/song.ts
/**
 * Core Song type definition
 * Supports multiple sources (manual, ChatGPT, Spotify) and recommendation workflows
 */

export type Song = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // seconds
  
  // ChatGPT integration fields (optional, backward compatible)
  source?: 'chatgpt' | 'manual' | 'spotify';
  round?: number;
  feedback?: 'keep' | 'skip' | 'pending';
  playlistId?: string;
  spotifyUri?: string;
  previewUrl?: string;
  addedAt?: string; // ISO 8601 timestamp
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt?: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
};

export type RecommendationRound = {
  id: string; // e.g., "round-1"
  round: number; // 1, 2, 3, ...
  createdAt: string; // ISO 8601 timestamp
  notes?: string;
};

// FILE: src/types/index.ts
/**
 * Types barrel export
 * Central export point for all type definitions
 */

export type { Song, Playlist, RecommendationRound } from './song';

// FILE: src/utils/fileHandlers.ts
/**
 * File handling utilities
 * Loads, parses, and normalizes song data while preserving new optional fields
 * Maintains full backward compatibility with existing data structures
 */

import type { Song, Playlist } from '../types';

/**
 * Normalize a song object to ensure all expected fields are present
 * Preserves new optional fields if present, fills safe defaults only when necessary
 * @param data - Raw song data from file or API
 * @returns Normalized Song object with optional fields safely handled
 */
export function normalizeSong(data: Partial<Song>): Song {
  if (!data.id) {
    throw new Error('Song must have an id field');
  }

  if (!data.title) {
    throw new Error('Song must have a title field');
  }

  if (!data.artist) {
    throw new Error('Song must have an artist field');
  }

  const now = new Date().toISOString();

  return {
    id: data.id,
    title: data.title,
    artist: data.artist,
    album: data.album,
    duration: data.duration,
    
    // New optional fields - preserve if present, otherwise leave undefined
    source: data.source,
    round: data.round,
    feedback: data.feedback ?? 'pending', // Default to 'pending' only if not specified
    playlistId: data.playlistId,
    spotifyUri: data.spotifyUri,
    previewUrl: data.previewUrl,
    addedAt: data.addedAt ?? now, // Default to now only if not specified
  };
}

/**
 * Parse song array from JSON, handling both old and new data formats
 * @param jsonString - JSON string containing song array
 * @returns Array of normalized Song objects
 */
export function parseSongsFromJson(jsonString: string): Song[] {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON array of songs');
    }

    return parsed.map((item) => normalizeSong(item));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse playlist array from JSON
 * @param jsonString - JSON string containing playlist array
 * @returns Array of Playlist objects
 */
export function parsePlaylistsFromJson(jsonString: string): Playlist[] {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON array of playlists');
    }

    return parsed.map((item) => normalizePlaylist(item));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Normalize a playlist object
 * @param data - Raw playlist data
 * @returns Normalized Playlist object
 */
export function normalizePlaylist(data: Partial<Playlist>): Playlist {
  if (!data.id) {
    throw new Error('Playlist must have an id field');
  }

  if (!data.name) {
    throw new Error('Playlist must have a name field');
  }

  if (!Array.isArray(data.songIds)) {
    throw new Error('Playlist must have a songIds array');
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    songIds: data.songIds,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Serialize songs to JSON with proper formatting
 * @param songs - Array of songs to serialize
 * @returns Pretty-printed JSON string
 */
export function serializeSongsToJson(songs: Song[]): string {
  return JSON.stringify(songs, null, 2);
}

/**
 * Serialize playlists to JSON with proper formatting
 * @param playlists - Array of playlists to serialize
 * @returns Pretty-printed JSON string
 */
export function serializePlaylistsToJson(playlists: Playlist[]): string {
  return JSON.stringify(playlists, null, 2);
}

/**
 * Load songs from a File object (e.g., from file input)
 * @param file - File object to load
 * @returns Promise resolving to array of Song objects
 */
export async function loadSongsFromFile(file: File): Promise<Song[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          throw new Error('Failed to read file as text');
        }
        resolve(parseSongsFromJson(content));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Load playlists from a File object
 * @param file - File object to load
 * @returns Promise resolving to array of Playlist objects
 */
export async function loadPlaylistsFromFile(file: File): Promise<Playlist[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          throw new Error('Failed to read file as text');
        }
        resolve(parsePlaylistsFromJson(content));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Download songs as JSON file
 * @param songs - Array of songs to download
 * @param filename - Output filename (default: 'songs.json')
 */
export function downloadSongsAsJson(
  songs: Song[],
  filename: string = 'songs.json'
): void {
  const json = serializeSongsToJson(songs);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download playlists as JSON file
 * @param playlists - Array of playlists to download
 * @param filename - Output filename (default: 'playlists.json')
 */
export function downloadPlaylistsAsJson(
  playlists: Playlist[],
  filename: string = 'playlists.json'
): void {
  const json = serializePlaylistsToJson(playlists);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// FILE: src/utils/demoData.ts
/**
 * Demo data for development and testing
 * Mix of old data (without new fields) and new data (with ChatGPT integration fields)
 * to verify backward compatibility
 */

import type { Song, Playlist, RecommendationRound } from '../types';

/**
 * Sample songs - mix of old format (no new fields) and new format (with integration fields)
 * This ensures backward compatibility is tested
 */
export const demoSongs: Song[] = [
  // Old format (existing data - should still work)
  {
    id: 'song-1',
    title: 'Midnight Dreams',
    artist: 'Luna Echo',
    album: 'Whispers',
    duration: 243,
  },
  {
    id: 'song-2',
    title: 'Electric Soul',
    artist: 'Neon Pixels',
    album: 'Synthetic Horizon',
    duration: 287,
  },

  // New format with ChatGPT integration fields
  {
    id: 'song-3',
    title: 'Cosmic Journey',
    artist: 'Star Traveler',
    album: 'Beyond the Stars',
    duration: 312,
    source: 'chatgpt',
    round: 1,
    feedback: 'pending',
    playlistId: 'playlist-alpha',
    addedAt: '2025-01-15T10:30:00Z',
  },
  {
    id: 'song-4',
    title: 'Urban Pulse',
    artist: 'City Lights',
    album: 'Neon Nights',
    duration: 256,
    source: 'spotify',
    spotifyUri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqLv',
    previewUrl: 'https://p.scdn.co/preview-mp3-play/url...',
    round: 1,
    feedback: 'keep',
    playlistId: 'playlist-alpha',
    addedAt: '2025-01-15T11:00:00Z',
  },
  {
    id: 'song-5',
    title: 'Harvest Moon',
    artist: 'Golden Fields',
    album: 'Seasonal Tales',
    duration: 198,
    source: 'manual',
    round: 2,
    feedback: 'skip',
    addedAt: '2025-01-16T09:15:00Z',
  },

  // Another old format entry for mixing
  {
    id: 'song-6',
    title: 'Riverside Serenade',
    artist: 'Water Music',
    album: 'Natural Flow',
    duration: 234,
  },
];

/**
 * Sample playlists
 */
export const demoPlaylists: Playlist[] = [
  {
    id: 'playlist-alpha',
    name: 'AI Curated Vibes',
    description: 'Songs recommended by ChatGPT AI',
    songIds: ['song-3', 'song-4', 'song-5'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-16T14:30:00Z',
  },
  {
    id: 'playlist-beta',
    name: 'Manual Selection',
    description: 'Handpicked collection',
    songIds: ['song-1', 'song-2', 'song-6'],
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
];

/**
 * Sample recommendation rounds
 */
export const demoRecommendationRounds: RecommendationRound[] = [
  {
    id: 'round-1',
    round: 1,
    createdAt: '2025-01-15T10:00:00Z',
    notes: 'Initial ChatGPT recommendations based on user preferences',
  },
  {
    id: 'round-2',
    round: 2,
    createdAt: '2025-01-16T09:00:00Z',
    notes: 'Refined recommendations after user feedback',
  },
];

/**
 * Get all demo data as a complete package
 */
export function getDemoData() {
  return {
    songs: demoSongs,
    playlists: demoPlaylists,
    rounds: demoRecommendationRounds,
  };
}
