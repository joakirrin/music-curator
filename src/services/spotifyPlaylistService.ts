// src/services/spotifyPlaylistService.ts
/**
 * Spotify Playlist Operations Service
 * Handles creating playlists and adding tracks to Spotify
 */

import { spotifyAuth } from './spotifyAuth';
import type { Playlist } from '@/types/playlist';
import type { Song } from '@/types/song';

const DEV = import.meta.env.DEV;

function log(...args: any[]) {
  if (DEV) console.log('[SpotifyPlaylist]', ...args);
}

function logError(...args: any[]) {
  if (DEV) console.error('[SpotifyPlaylist]', ...args);
}

/**
 * Result of pushing a playlist to Spotify
 */
export type PushResult = {
  success: boolean;
  playlistId?: string;
  playlistUrl?: string;
  tracksAdded?: number;
  tracksFailed?: number;
  missingTracks?: Song[];
  error?: string;
};

/**
 * Progress callback for tracking push operation
 */
export type ProgressCallback = (progress: {
  stage: 'creating' | 'adding_tracks' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}) => void;

/**
 * Extract Spotify track ID from various formats
 */
function extractSpotifyId(song: Song): string | null {
  // Try serviceUri (spotify:track:ID)
  if (song.serviceUri?.startsWith('spotify:track:')) {
    const id = song.serviceUri.split(':')[2];
    if (id && id.length === 22) return id;
  }
  
  // Try serviceId directly
  if (song.serviceId && song.serviceId.length === 22) {
    return song.serviceId;
  }
  
  // Try serviceUrl (https://open.spotify.com/track/ID)
  if (song.serviceUrl?.includes('spotify.com/track/')) {
    const match = song.serviceUrl.match(/track\/([a-zA-Z0-9]{22})/);
    if (match) return match[1];
  }
  
  // Legacy fields for backward compatibility
  if (song.spotifyUri?.startsWith('spotify:track:')) {
    const id = song.spotifyUri.split(':')[2];
    if (id && id.length === 22) return id;
  }
  
  if (song.spotifyId && song.spotifyId.length === 22) {
    return song.spotifyId;
  }
  
  if (song.spotifyUri?.includes('spotify.com/track/')) {
    const match = song.spotifyUri.match(/track\/([a-zA-Z0-9]{22})/);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Get current user's Spotify ID
 */
async function getCurrentUserId(token: string): Promise<string> {
  log('Fetching current user profile...');
  
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    logError('Failed to get user profile:', response.status, error);
    throw new Error(`Failed to get user profile: ${response.status}`);
  }
  
  const user = await response.json();
  log('Got user ID:', user.id);
  
  return user.id;
}

/**
 * Create a new playlist on Spotify
 */
async function createPlaylist(
  token: string,
  userId: string,
  name: string,
  description?: string,
  isPublic: boolean = false
): Promise<{ id: string; url: string }> {
  log(`Creating playlist "${name}" for user ${userId}...`);
  
  const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description: description || `Created with Fonea Sound Curator`,
      public: isPublic,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    logError('Failed to create playlist:', response.status, error);
    throw new Error(`Failed to create playlist: ${response.status}`);
  }
  
  const playlist = await response.json();
  
  log('✅ Playlist created:', playlist.id);
  
  return {
    id: playlist.id,
    url: playlist.external_urls.spotify,
  };
}

/**
 * Add tracks to a Spotify playlist (handles batching)
 */
async function addTracksToPlaylist(
  token: string,
  playlistId: string,
  trackUris: string[],
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  if (trackUris.length === 0) {
    log('No tracks to add');
    return 0;
  }
  
  log(`Adding ${trackUris.length} tracks to playlist ${playlistId}...`);
  
  // Spotify API allows max 100 tracks per request
  const BATCH_SIZE = 100;
  let totalAdded = 0;
  
  for (let i = 0; i < trackUris.length; i += BATCH_SIZE) {
    const batch = trackUris.slice(i, i + BATCH_SIZE);
    
    log(`Adding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(trackUris.length / BATCH_SIZE)} (${batch.length} tracks)...`);
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: batch,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      logError('Failed to add tracks batch:', response.status, error);
      throw new Error(`Failed to add tracks: ${response.status}`);
    }
    
    totalAdded += batch.length;
    
    if (onProgress) {
      onProgress(totalAdded, trackUris.length);
    }
    
    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < trackUris.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  log(`✅ Added ${totalAdded} tracks successfully`);
  
  return totalAdded;
}

/**
 * Main function: Push a local playlist to Spotify
 */
export async function pushPlaylistToSpotify(
  playlist: Playlist,
  onProgress?: ProgressCallback
): Promise<PushResult> {
  log('=== Starting Spotify push ===');
  log('Playlist:', playlist.name);
  log('Songs:', playlist.songs.length);
  
  try {
    // Step 1: Get access token
    if (onProgress) {
      onProgress({
        stage: 'creating',
        current: 0,
        total: 100,
        message: 'Authenticating with Spotify...',
      });
    }
    
    const token = await spotifyAuth.getAccessToken();
    
    if (!token) {
      throw new Error('Not logged in to Spotify. Please sign in first.');
    }
    
    // Step 2: Get user ID
    const userId = await getCurrentUserId(token);
    
    // Step 3: Separate songs with/without Spotify IDs
    const songsWithSpotify: Song[] = [];
    const missingTracks: Song[] = [];
    
    for (const song of playlist.songs) {
      const spotifyId = extractSpotifyId(song);
      if (spotifyId) {
        songsWithSpotify.push(song);
      } else {
        missingTracks.push(song);
        logError(`Missing Spotify ID for: ${song.artist} - ${song.title}`);
      }
    }
    
    log(`Found ${songsWithSpotify.length} songs with Spotify IDs`);
    log(`Missing ${missingTracks.length} songs`);
    
    if (songsWithSpotify.length === 0) {
      throw new Error('No songs with Spotify IDs found. Please verify your songs first.');
    }
    
    // Step 4: Create playlist
    if (onProgress) {
      onProgress({
        stage: 'creating',
        current: 20,
        total: 100,
        message: `Creating playlist "${playlist.name}"...`,
      });
    }
    
    const { id: spotifyPlaylistId, url: spotifyUrl } = await createPlaylist(
      token,
      userId,
      playlist.name,
      playlist.description,
      playlist.isPublic
    );
    
    // Step 5: Add tracks
    if (onProgress) {
      onProgress({
        stage: 'adding_tracks',
        current: 40,
        total: 100,
        message: 'Adding tracks to playlist...',
      });
    }
    
    const trackUris = songsWithSpotify
      .map(song => {
        const id = extractSpotifyId(song);
        return id ? `spotify:track:${id}` : null;
      })
      .filter((uri): uri is string => uri !== null);
    
    const tracksAdded = await addTracksToPlaylist(
      token,
      spotifyPlaylistId,
      trackUris,
      (current, total) => {
        if (onProgress) {
          const progress = 40 + Math.floor((current / total) * 50);
          onProgress({
            stage: 'adding_tracks',
            current: progress,
            total: 100,
            message: `Adding tracks (${current}/${total})...`,
          });
        }
      }
    );
    
    // Step 6: Complete
    if (onProgress) {
      onProgress({
        stage: 'complete',
        current: 100,
        total: 100,
        message: 'Playlist created successfully!',
      });
    }
    
    log('=== ✅ Push complete ===');
    
    return {
      success: true,
      playlistId: spotifyPlaylistId,
      playlistUrl: spotifyUrl,
      tracksAdded,
      tracksFailed: missingTracks.length,
      missingTracks: missingTracks.length > 0 ? missingTracks : undefined,
    };
    
  } catch (error: any) {
    logError('=== ❌ Push failed ===');
    logError(error);
    
    if (onProgress) {
      onProgress({
        stage: 'error',
        current: 0,
        total: 100,
        message: error.message || 'Failed to push playlist',
      });
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Search for a track on Spotify (for songs missing IDs)
 */
export async function searchSpotifyTrack(
  artist: string,
  title: string
): Promise<string | null> {
  try {
    const token = await spotifyAuth.getAccessToken();
    if (!token) return null;
    
    const query = encodeURIComponent(`artist:${artist} track:${title}`);
    const response = await fetch(
      `https://api.spotify.com/v1/search?type=track&limit=1&q=${query}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const track = data.tracks?.items?.[0];
    
    return track?.id || null;
  } catch (error) {
    logError('Search failed:', error);
    return null;
  }
}
