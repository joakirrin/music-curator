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
  
  // Platform integration fields (platform-agnostic)
  platformPlaylists?: {
    spotify?: {
      id: string;               // Spotify playlist ID
      url: string;              // Spotify playlist URL
      synced: boolean;          // Is it synced?
    };
    youtube?: {
      id: string;               // YouTube playlist ID
      url: string;              // YouTube playlist URL
      synced: boolean;          // Is it synced?
    };
    apple?: {
      id: string;               // Apple Music playlist ID
      url: string;              // Apple Music playlist URL
      synced: boolean;          // Is it synced?
    };
    tidal?: {
      id: string;               // Tidal playlist ID
      url: string;              // Tidal playlist URL
      synced: boolean;          // Is it synced?
    };
  };
  
  // Legacy Spotify fields (kept for backwards compatibility)
  // TODO: Migrate existing data to platformPlaylists.spotify
  spotifyPlaylistId?: string;    // DEPRECATED: Use platformPlaylists.spotify.id
  spotifyUrl?: string;           // DEPRECATED: Use platformPlaylists.spotify.url
  synced: boolean;               // DEPRECATED: Use platformPlaylists.spotify.synced
  
  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp (updated on any change)
  isPublic: boolean;             // Playlist visibility setting
  coverImage?: string;           // Playlist cover image URL
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
