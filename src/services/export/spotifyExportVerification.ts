// src/services/export/spotifyExportVerification.ts
/**
 * Spotify Export Verification Integration (Phase 4.5.6)
 * 
 * Integrates export verification with Spotify playlist service.
 * Fetches created playlist tracks and compares with requested songs.
 */

import type { Song } from '@/types/song';
import type { Playlist } from '@/types/playlist';
import { ExportVerificationService, type ExportResult, type VerificationResult } from './exportVerificationService';

const DEV = import.meta.env?.DEV;

function log(...args: any[]) {
  if (DEV) console.log('[SpotifyVerification]', ...args);
}

function logError(...args: any[]) {
  if (DEV) console.error('[SpotifyVerification]', ...args);
}

/**
 * Fetch tracks from a Spotify playlist to verify what was actually added
 */
async function fetchPlaylistTracks(
  playlistId: string,
  token: string
): Promise<string[]> {
  log(`Fetching tracks from Spotify playlist ${playlistId}...`);
  
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(uri))`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      logError('Failed to fetch playlist tracks:', response.status, error);
      throw new Error(`Failed to fetch playlist tracks: ${response.status}`);
    }
    
    const data = await response.json();
    const trackUris = data.items
      .map((item: any) => item.track?.uri)
      .filter((uri: string | undefined): uri is string => !!uri);
    
    log(`Found ${trackUris.length} tracks in Spotify playlist`);
    return trackUris;
    
  } catch (error) {
    logError('Error fetching playlist tracks:', error);
    throw error;
  }
}

/**
 * Match Spotify URIs back to original song IDs
 */
function matchTracksToSongs(
  spotifyTrackUris: string[],
  requestedSongs: Song[]
): string[] {
  log('Matching Spotify URIs to song IDs...');
  
  const spotifyUriSet = new Set(spotifyTrackUris);
  const successfulSongIds: string[] = [];
  
  for (const song of requestedSongs) {
    // Check if the song's URI is in the Spotify playlist
    const songUri = song.spotifyUri || song.serviceUri;
    
    if (songUri && spotifyUriSet.has(songUri)) {
      successfulSongIds.push(song.id);
    }
  }
  
  log(`Matched ${successfulSongIds.length}/${requestedSongs.length} songs`);
  return successfulSongIds;
}

/**
 * Verify Spotify export by fetching the created playlist and comparing
 */
export async function verifySpotifyExport(
  playlist: Playlist,
  spotifyPlaylistId: string,
  spotifyUrl: string,
  token: string
): Promise<{
  verification: VerificationResult;
  updatedSongs: Song[];
}> {
  log('=== Starting Spotify Export Verification ===');
  log(`Playlist: "${playlist.name}"`);
  log(`Spotify Playlist ID: ${spotifyPlaylistId}`);
  
  try {
    // Step 1: Fetch tracks from the created Spotify playlist
    const spotifyTrackUris = await fetchPlaylistTracks(spotifyPlaylistId, token);
    
    // Step 2: Match Spotify URIs back to original song IDs
    const successfulSongIds = matchTracksToSongs(spotifyTrackUris, playlist.songs);
    
    // Step 3: Create export result for verification
    const exportResult: ExportResult = {
      platform: 'Spotify',
      playlistId: spotifyPlaylistId,
      playlistUrl: spotifyUrl,
      requestedSongs: playlist.songs,
      successfulSongIds,
      failedSongs: [], // Will be populated by verification service
    };
    
    // Step 4: Verify export
    const verification = await ExportVerificationService.verifyExport(exportResult);
    
    // Step 5: Update song sync status
    const successfulSongIdsSet = new Set(successfulSongIds);
    const updatedSongs = ExportVerificationService.batchUpdateSyncStatus(
      playlist.songs,
      successfulSongIdsSet,
      'Spotify',
      spotifyPlaylistId
    );
    
    log('=== Verification Complete ===');
    log(`Success Rate: ${verification.successRate.toFixed(1)}%`);
    log(`Failed Songs: ${verification.failedSongs.length}`);
    
    return {
      verification,
      updatedSongs,
    };
    
  } catch (error) {
    logError('=== Verification Failed ===');
    logError(error);
    
    // Return a failed verification result
    return {
      verification: {
        totalRequested: playlist.songs.length,
        totalSuccessful: 0,
        totalFailed: playlist.songs.length,
        successRate: 0,
        failedSongs: playlist.songs.map(song => ({
          songId: song.id,
          artist: song.artist,
          title: song.title,
          reason: 'Could not verify export - playlist may have been created successfully',
        })),
      },
      updatedSongs: playlist.songs,
    };
  }
}

/**
 * Extended PushResult that includes verification
 */
export interface ExtendedPushResult {
  success: boolean;
  playlistId?: string;
  playlistUrl?: string;
  error?: string;
  verification?: VerificationResult;
  updatedSongs?: Song[];
}
