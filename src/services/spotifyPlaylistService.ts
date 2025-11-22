// FILE: src/services/spotifyPlaylistService.ts (MODIFIED)

import { spotifyAuth } from './spotifyAuth';
import type { Playlist } from '@/types/playlist';
// import type { Song } from '@/types/song';
// NEW IMPORTS
import { resolveSpotifySong } from './export/smartPlatformResolver';
import { formatPlaylistDescription } from '@/utils/formatters';
import { FEATURES } from '@/config/features';
import type { SmartResolveResult } from './export/types';
import { verifySpotifyExport, type ExtendedPushResult } from './export/spotifyExportVerification';

const DEV = import.meta.env.DEV;

function log(...args: any[]) {
  if (DEV) console.log('[SpotifyPlaylist]', ...args);
}
function logError(...args: any[]) {
  if (DEV) console.error('[SpotifyPlaylist]', ...args);
}

/**
 * Result of pushing a playlist to Spotify
 * UPDATED to use the ExtendedPushResult structure
 */
export type PushResult = ExtendedPushResult;

/**
 * Progress callback for tracking push operation
 */
export type ProgressCallback = (progress: {
  stage: 'resolving' | 'creating' | 'adding_tracks' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}) => void;

/**
 * REMOVED: extractSpotifyId(song: Song)
 * This logic is now inside smartPlatformResolver.ts
 */

/**
 * Get current user's Spotify ID
 */
async function getCurrentUserId(token: string): Promise<string> {
  // ... (this function is unchanged)
  log('Fetching current user profile...');
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${token}` },
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
 * UPDATED to use the new branding formatter
 */
async function createPlaylist(
  token: string,
  userId: string,
  name: string,
  description: string, // Now accepts the formatted description
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
      description: description, // Use the passed-in formatted description
      public: isPublic,
    }),
  });
  
  if (!response.ok) {
    // ... (error handling is unchanged)
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
  // ... (this function is unchanged)
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
    if (i + BATCH_SIZE < trackUris.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  log(`✅ Added ${totalAdded} tracks successfully`);
  return totalAdded;
}

/**
 * Main function: Push a local playlist to Spotify
 * Uses Smart Resolver + Branding + Export Verification
 */
export async function pushPlaylistToSpotify(
  playlist: Playlist,
  onProgress?: ProgressCallback
): Promise<ExtendedPushResult> {
  log('=== Starting Spotify push (with Smart Resolver) ===');
  const startTime = Date.now();
  
  // Build the initial (empty) report-like structure
  const baseReport = {
    playlistName: playlist.name,
    platform: 'spotify',
    timestamp: new Date().toISOString(),
    totalSongs: playlist.songs.length,
    successful: { direct: 0, softSearch: 0, hardSearch: 0, total: 0, songs: [] as any[] },
    failed: { count: 0, songs: [] as any[] },
    statistics: { successRate: 0, averageConfidence: 0, exportDuration: 0 },
    success: false,
  };

  // Iremos mutando este objeto y luego lo convertimos en ExtendedPushResult al final
  const report: any = { ...baseReport };

  try {
    // Step 1: Get access token
    if (onProgress) {
      onProgress({
        stage: 'resolving',
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
    
    // Step 3: NEW - Resolve songs using the Smart Resolver
    log(`Resolving ${playlist.songs.length} songs...`);
    const resolvedSongs: SmartResolveResult[] = [];
    for (let i = 0; i < playlist.songs.length; i++) {
      const song = playlist.songs[i];
      if (onProgress) {
        onProgress({
          stage: 'resolving',
          current: Math.floor((i / playlist.songs.length) * 40), // Resolving = 0-40%
          total: 100,
          message: `Finding songs... (${i}/${playlist.songs.length})`,
        });
      }
      const result = await resolveSpotifySong(song, token);
      resolvedSongs.push(result);
    }

    // Step 4: NEW - Process results into the report
    const trackUris: string[] = [];
    let totalConfidence = 0;

    for (const res of resolvedSongs) {
      if (res.spotifyUri) {
        trackUris.push(res.spotifyUri);
        report.successful.total++;
        totalConfidence += res.confidence;
        
        const platformUrl = `https://open.spotify.com/track/${res.spotifyUri.split(':')[2]}`;
        report.successful.songs.push({
          song: res.song,
          tier: res.tier as 'direct' | 'soft' | 'hard',
          confidence: res.confidence,
          platformUrl: platformUrl,
        });

        if (res.tier === 'direct') report.successful.direct++;
        if (res.tier === 'soft') report.successful.softSearch++;
        if (res.tier === 'hard') report.successful.hardSearch++;

      } else {
        report.failed.count++;
        report.failed.songs.push({
          song: res.song,
          reason: res.reason || 'No match found',
          attemptedTiers: ['direct', 'soft', 'hard'],
        });
      }
    }

    log(`Resolver: ${report.successful.total} found, ${report.failed.count} failed`);
    if (report.successful.total === 0) {
      throw new Error('No songs could be found on Spotify.');
    }

    // Step 5: NEW - Apply branding from Task 4.5.2
    let descriptionToPush = formatPlaylistDescription(playlist.description);
    
    // This logic is from your task list
    if (!FEATURES.BRANDING_ON_EXPORT.enabled || 
        (FEATURES.BRANDING_ON_EXPORT.enabled && FEATURES.BRANDING_ON_EXPORT.removable)) {
      // Logic for premium users to remove branding (not implemented yet)
      // For now, branding is always on
    }
    
    // Step 6: Create playlist
    if (onProgress) {
      onProgress({
        stage: 'creating',
        current: 40,
        total: 100,
        message: `Creating playlist "${playlist.name}"...`,
      });
    }
    
    const { id: spotifyPlaylistId, url: spotifyUrl } = await createPlaylist(
      token,
      userId,
      playlist.name,
      descriptionToPush, // Pass the formatted description
      playlist.isPublic
    );
    report.playlistId = spotifyPlaylistId;
    report.playlistUrl = spotifyUrl;

    // Step 7: Add tracks
    if (onProgress) {
      onProgress({
        stage: 'adding_tracks',
        current: 50,
        total: 100,
        message: 'Adding tracks to playlist...',
      });
    }
    
    await addTracksToPlaylist(
      token,
      spotifyPlaylistId,
      trackUris,
      (current, total) => {
        if (onProgress) {
          const progress = 50 + Math.floor((current / total) * 40); // Adding = 50-90%
          onProgress({
            stage: 'adding_tracks',
            current: progress,
            total: 100,
            message: `Adding tracks (${current}/${total})...`,
          });
        }
      }
    );

    // NEW: After tracks are added, verify the export
    if (onProgress) {
      onProgress({
        stage: 'complete',
        current: 90,
        total: 100,
        message: 'Verifying export...',
      });
    }
    
    const { verification, updatedSongs } = await verifySpotifyExport(
      playlist,
      report.playlistId,
      report.playlistUrl,
      token
    );

    // Step 8: Finalize report
    report.success = true;
    report.statistics.successRate = (report.successful.total / report.totalSongs) * 100;
    report.statistics.averageConfidence = (totalConfidence / report.successful.total) * 100;
    report.statistics.exportDuration = Date.now() - startTime;

    // Añadimos la info extra de verificación al resultado extendido
    const extendedResult: ExtendedPushResult = {
      ...report,
      verification,
      updatedSongs,
    };

    if (onProgress) {
      onProgress({
        stage: 'complete',
        current: 100,
        total: 100,
        message: 'Export complete!',
      });
    }
    
    log('=== ✅ Push complete ===');
    return extendedResult;
    
  } catch (error: any) {
    logError('=== ❌ Push failed ===');
    logError(error);
    
    if (onProgress) {
      onProgress({
        stage: 'error',
        current: 0,
        total: 100,
        message: error?.message || 'Failed to push playlist',
      });
    }
    
    report.success = false;
    report.error = error?.message || 'Unknown error occurred';
    report.statistics.exportDuration = Date.now() - startTime;

    // Aseguramos que devolvemos algo que matchee ExtendedPushResult,
    // aunque verificación no se haya podido hacer.
    const extendedResult: ExtendedPushResult = {
      ...report,
      verification: (report as any).verification,
      updatedSongs: (report as any).updatedSongs,
    };

    return extendedResult;
  }
}

/**
 * REMOVED: searchSpotifyTrack(artist: string, title: string)
 * This logic is now inside smartPlatformResolver.ts
 */

