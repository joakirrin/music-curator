// src/types/playlist.ts
/**
 * Playlist type definition for local and Spotify playlists
 * 
 * IMPORTANT: Playlists store FULL song data, not just IDs
 * This allows songs to persist in playlists even after deletion from library
 */

import type { Song } from './song';

export type Playlist = {
  id: string;                    // Unique ID (generated locally)
  name: string;                  // User-defined name
  description?: string;          // Optional description
  songs: Song[];                 // FULL song objects (not just IDs!)
  
  // Spotify integration fields
  spotifyPlaylistId?: string;    // ID once pushed to Spotify
  spotifyUrl?: string;           // Direct URL to playlist on Spotify
  synced: boolean;               // Is it synced with Spotify?
  
  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp (updated on any change)
  isPublic: boolean;             // Spotify visibility setting
  coverImage?: string;           // Playlist cover image URL (from Spotify)
};

/**
 * Helper type for creating a new playlist (omits computed fields)
 */
export type CreatePlaylistInput = {
  name: string;
  description?: string;
  songs?: Song[];                // Can start empty or with selected songs
  isPublic?: boolean;            // Default: false (private)
};

/**
 * Helper type for updating a playlist
 */
export type UpdatePlaylistInput = {
  name?: string;
  description?: string;
  isPublic?: boolean;
};
