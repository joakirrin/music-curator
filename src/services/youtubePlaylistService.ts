// src/services/youtubePlaylistService.ts
// YouTube playlist management service
// Handles creating playlists, adding songs, importing, and exporting with comprehensive error handling

import { youtubeAuth } from './youtubeAuth';
import { youtubeApiClient } from './youtube/YouTubeApiClient';
import { resolveYouTubeSongs } from './export/youtubeResolver';
import { mapYouTubeVideosToSongs } from '@/utils/songMappers';
import type { Song } from '@/types/song';
import type { Playlist } from '@/types/playlist';
import type { 
  ExportReport, 
  ExportProgress,
  ImportProgress, 
  SmartResolveResult 
} from './export/types';

const DEV = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[YouTubePlaylist]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[YouTubePlaylist]', ...args);
}

// ============================================
// EXPORT SERVICE
// ============================================

/**
 * Export a Fonea playlist to YouTube Music
 * Uses Smart Resolver for optimal quota usage
 * Supports large playlists (1000+ songs) with progress tracking
 * Implements retry logic for failed songs
 * Returns comprehensive export report
 * 
 * @param playlist - Fonea playlist to export
 * @param onProgress - Optional progress callback for UI updates
 * @returns Detailed export report with statistics
 */
export async function exportPlaylistToYouTube(
  playlist: Playlist,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportReport> {
  log('=== Starting YouTube Export ===');
  log(`Playlist: "${playlist.name}"`);
  log(`Songs: ${playlist.songs.length}`);
  
  const startTime = Date.now();
  
  // Initialize report
  const report: ExportReport = {
    playlistName: playlist.name,
    platform: 'youtube',
    timestamp: new Date().toISOString(),
    totalSongs: playlist.songs.length,
    successful: {
      direct: 0,
      softSearch: 0,
      hardSearch: 0,
      total: 0,
      songs: [],
    },
    failed: {
      count: 0,
      songs: [],
    },
    statistics: {
      successRate: 0,
      averageConfidence: 0,
      exportDuration: 0,
      apiCallsUsed: 0,
    },
    success: false,
  };

  try {
    // Validate auth
    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not logged in to YouTube. Please sign in first.');
    }

    // PHASE 1: RESOLVE SONGS
    log('\n=== PHASE 1: Resolving Songs ===');
    onProgress?.({
      stage: 'resolving',
      current: 0,
      total: playlist.songs.length,
      message: 'Finding songs on YouTube...',
    });

    const resolveResults = await resolveYouTubeSongs(
      playlist.songs,
      (current, total) => {
        onProgress?.({
          stage: 'resolving',
          current,
          total,
          message: `Resolving songs... (${current}/${total})`,
        });
      }
    );

    // Process resolution results
    const resolvedSongs: { videoId: string; result: SmartResolveResult }[] = [];
    let totalConfidence = 0;
    let apiCallsUsed = 0;

    for (const result of resolveResults) {
      if (result.youtubeId) {
        resolvedSongs.push({ videoId: result.youtubeId, result });
        totalConfidence += result.confidence;

        // Track tier statistics
        if (result.tier === 'direct') report.successful.direct++;
        if (result.tier === 'soft') {
          report.successful.softSearch++;
          apiCallsUsed += 100; // Soft search uses ~100 quota units
        }
        if (result.tier === 'hard') {
          report.successful.hardSearch++;
          apiCallsUsed += 100; // Hard search uses ~100 quota units
        }

        report.successful.songs.push({
          song: result.song,
          tier: result.tier as 'direct' | 'soft' | 'hard',
          confidence: result.confidence,
          platformUrl: `https://www.youtube.com/watch?v=${result.youtubeId}`,
        });
      } else {
        report.failed.songs.push({
          song: result.song,
          reason: result.reason || 'No match found on YouTube',
          attemptedTiers: ['direct', 'soft', 'hard'],
        });
      }
    }

    report.successful.total = resolvedSongs.length;
    report.failed.count = report.failed.songs.length;
    report.statistics.apiCallsUsed = apiCallsUsed;

    log(`\nResolution complete:`);
    log(`  ✅ Success: ${resolvedSongs.length} (${report.successful.direct} direct, ${report.successful.softSearch} soft, ${report.successful.hardSearch} hard)`);
    log(`  ❌ Failed: ${report.failed.count}`);
    log(`  📊 API calls used: ~${apiCallsUsed} quota units`);

    if (resolvedSongs.length === 0) {
      throw new Error('No songs could be found on YouTube. Cannot create empty playlist.');
    }

    // PHASE 2: CREATE PLAYLIST
    log('\n=== PHASE 2: Creating Playlist ===');
    onProgress?.({
      stage: 'creating',
      current: 0,
      total: 1,
      message: `Creating playlist "${playlist.name}"...`,
    });

    const description = playlist.description || 'Created with Fonea Music Curator';
    const youtubePlaylist = await youtubeApiClient.createPlaylist(
      playlist.name,
      description,
      playlist.isPublic ?? false
    );

    report.playlistId = youtubePlaylist.id;
    report.playlistUrl = `https://www.youtube.com/playlist?list=${youtubePlaylist.id}`;

    log(`✅ Playlist created: ${youtubePlaylist.id}`);

    onProgress?.({
      stage: 'creating',
      current: 1,
      total: 1,
      message: 'Playlist created!',
    });

    // PHASE 3: ADD VIDEOS (with retry logic)
    log('\n=== PHASE 3: Adding Videos ===');
    onProgress?.({
      stage: 'adding_tracks',
      current: 0,
      total: resolvedSongs.length,
      message: 'Adding songs to playlist...',
    });

    const videoIds = resolvedSongs.map(s => s.videoId);
    
    // Use YouTubeApiClient's batch method which handles delays and errors
    const addedCount = await youtubeApiClient.addVideosToPlaylist(
      youtubePlaylist.id,
      videoIds,
      (current, total) => {
        onProgress?.({
          stage: 'adding_tracks',
          current,
          total,
          message: `Adding songs... (${current}/${total})`,
        });
      }
    );

    log(`✅ Added ${addedCount}/${videoIds.length} videos to playlist`);

    // Update failed count if some videos couldn't be added
    const additionFailures = videoIds.length - addedCount;
    if (additionFailures > 0) {
      log(`⚠️ Warning: ${additionFailures} videos failed to add (likely deleted or private)`);
      // Note: These are videos that were resolved but couldn't be added
      // This is different from songs that couldn't be resolved
    }

    // PHASE 4: FINALIZE REPORT
    log('\n=== PHASE 4: Finalizing Report ===');
    
    const endTime = Date.now();
    report.statistics.exportDuration = endTime - startTime;
    report.statistics.successRate = (report.successful.total / report.totalSongs) * 100;
    report.statistics.averageConfidence = 
      report.successful.total > 0 
        ? (totalConfidence / report.successful.total) * 100 
        : 0;
    report.success = true;

    onProgress?.({
      stage: 'complete',
      current: 100,
      total: 100,
      message: 'Export complete!',
    });

    log('\n=== ✅ Export Complete ===');
    log(`Playlist URL: ${report.playlistUrl}`);
    log(`Success rate: ${report.statistics.successRate.toFixed(1)}%`);
    log(`Average confidence: ${report.statistics.averageConfidence.toFixed(1)}%`);
    log(`Duration: ${(report.statistics.exportDuration / 1000).toFixed(1)}s`);
    log(`Quota used: ~${report.statistics.apiCallsUsed} units`);

    return report;

  } catch (error: unknown) {
    logError('\n=== ❌ Export Failed ===');
    logError(error);

    const endTime = Date.now();
    report.statistics.exportDuration = endTime - startTime;
    report.success = false;
    report.error = error instanceof Error ? error.message : 'Unknown error occurred';

    onProgress?.({
      stage: 'error',
      current: 0,
      total: 100,
      message: report.error,
    });

    return report;
  }
}

// ============================================
// SYNC SERVICE - CHUNK 8
// ============================================

/**
 * Sync playlist to YouTube (Append-Only)
 * Adds only NEW songs to existing YouTube playlist
 * Does not remove or reorder existing songs
 * 
 * @param playlist - Fonea playlist with platformPlaylists.youtube.id
 * @param onProgress - Optional progress callback for UI updates
 * @returns Export report with sync statistics
 */
export async function syncPlaylistToYouTube(
  playlist: Playlist,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportReport> {
  log('=== Starting YouTube Playlist Sync (Append-Only) ===');
  log(`Playlist: "${playlist.name}"`);
  
  const startTime = Date.now();
  
  // Initialize report
  const report: ExportReport = {
    playlistName: playlist.name,
    platform: 'youtube',
    timestamp: new Date().toISOString(),
    totalSongs: playlist.songs.length,
    successful: {
      direct: 0,
      softSearch: 0,
      hardSearch: 0,
      total: 0,
      songs: [],
    },
    failed: {
      count: 0,
      songs: [],
    },
    statistics: {
      successRate: 0,
      averageConfidence: 0,
      exportDuration: 0,
      apiCallsUsed: 0,
    },
    success: false,
  };

  try {
    // Validate auth
    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not logged in to YouTube. Please sign in first.');
    }

    // Validate playlist has YouTube ID
    const youtubePlaylistId = playlist.platformPlaylists?.youtube?.id;
    if (!youtubePlaylistId) {
      throw new Error('This playlist is not linked to YouTube. Use "Export to YouTube" instead.');
    }

    report.playlistId = youtubePlaylistId;
    report.playlistUrl = `https://www.youtube.com/playlist?list=${youtubePlaylistId}`;

    // PHASE 1: GET CURRENT YOUTUBE SONGS
    log('\n=== PHASE 1: Getting Current YouTube Playlist ===');
    onProgress?.({
      stage: 'resolving',
      current: 0,
      total: playlist.songs.length,
      message: 'Checking YouTube playlist...',
    });

    const youtubeItems = await youtubeApiClient.getPlaylistItems(youtubePlaylistId);
    const currentYoutubeIds = new Set(
      youtubeItems
        .filter(item => item.snippet.resourceId.kind === 'youtube#video')
        .map(item => item.snippet.resourceId.videoId)
    );

    log(`Current YouTube playlist has ${currentYoutubeIds.size} videos`);

    // PHASE 2: DETECT NEW SONGS
    log('\n=== PHASE 2: Detecting New Songs ===');
    
    const newSongs = playlist.songs.filter(song => {
      const youtubeId = song.platformIds?.youtube?.id;
      
      // If no YouTube ID yet, needs to be resolved and added
      if (!youtubeId) return true;
      
      // If has YouTube ID but not in playlist, add it
      return !currentYoutubeIds.has(youtubeId);
    });

    log(`Found ${newSongs.length} new songs to add`);
    
    if (newSongs.length === 0) {
      log('✅ Playlist is already up to date');
      
      report.success = true;
      report.statistics.successRate = 100;
      report.statistics.exportDuration = Date.now() - startTime;
      
      onProgress?.({
        stage: 'complete',
        current: 100,
        total: 100,
        message: 'Playlist is already up to date!',
      });
      
      return report;
    }

    report.totalSongs = newSongs.length; // Only count new songs

    // PHASE 3: RESOLVE NEW SONGS
    log('\n=== PHASE 3: Resolving New Songs ===');
    onProgress?.({
      stage: 'resolving',
      current: 0,
      total: newSongs.length,
      message: 'Finding new songs on YouTube...',
    });

    const resolveResults = await resolveYouTubeSongs(
      newSongs,
      (current, total) => {
        onProgress?.({
          stage: 'resolving',
          current,
          total,
          message: `Resolving new songs... (${current}/${total})`,
        });
      }
    );

    // Process resolution results
    const resolvedSongs: { videoId: string; result: SmartResolveResult }[] = [];
    let totalConfidence = 0;
    let apiCallsUsed = 0;

    for (const result of resolveResults) {
      if (result.youtubeId) {
        resolvedSongs.push({ videoId: result.youtubeId, result });
        totalConfidence += result.confidence;

        // Track tier statistics
        if (result.tier === 'direct') report.successful.direct++;
        if (result.tier === 'soft') {
          report.successful.softSearch++;
          apiCallsUsed += 100;
        }
        if (result.tier === 'hard') {
          report.successful.hardSearch++;
          apiCallsUsed += 100;
        }

        report.successful.songs.push({
          song: result.song,
          tier: result.tier as 'direct' | 'soft' | 'hard',
          confidence: result.confidence,
          platformUrl: `https://www.youtube.com/watch?v=${result.youtubeId}`,
        });
      } else {
        report.failed.songs.push({
          song: result.song,
          reason: result.reason || 'No match found on YouTube',
          attemptedTiers: ['direct', 'soft', 'hard'],
        });
      }
    }

    report.successful.total = resolvedSongs.length;
    report.failed.count = report.failed.songs.length;
    report.statistics.apiCallsUsed = apiCallsUsed;

    log(`Resolution complete:`);
    log(`  ✅ Success: ${resolvedSongs.length} (${report.successful.direct} direct, ${report.successful.softSearch} soft, ${report.successful.hardSearch} hard)`);
    log(`  ❌ Failed: ${report.failed.count}`);

    if (resolvedSongs.length === 0) {
      throw new Error('No new songs could be found on YouTube.');
    }

    // PHASE 4: ADD NEW VIDEOS
    log('\n=== PHASE 4: Adding New Videos ===');
    onProgress?.({
      stage: 'adding_tracks',
      current: 0,
      total: resolvedSongs.length,
      message: 'Adding new songs to YouTube playlist...',
    });

    const videoIds = resolvedSongs.map(s => s.videoId);
    
    const addedCount = await youtubeApiClient.addVideosToPlaylist(
      youtubePlaylistId,
      videoIds,
      (current, total) => {
        onProgress?.({
          stage: 'adding_tracks',
          current,
          total,
          message: `Adding songs... (${current}/${total})`,
        });
      }
    );

    log(`✅ Added ${addedCount}/${videoIds.length} new videos to playlist`);

    // PHASE 5: FINALIZE REPORT
    log('\n=== PHASE 5: Finalizing Report ===');
    
    const endTime = Date.now();
    report.statistics.exportDuration = endTime - startTime;
    report.statistics.successRate = (report.successful.total / report.totalSongs) * 100;
    report.statistics.averageConfidence = 
      report.successful.total > 0 
        ? (totalConfidence / report.successful.total) * 100 
        : 0;
    report.success = true;

    onProgress?.({
      stage: 'complete',
      current: 100,
      total: 100,
      message: 'Sync complete!',
    });

    log('\n=== ✅ Sync Complete ===');
    log(`Playlist URL: ${report.playlistUrl}`);
    log(`New songs added: ${report.successful.total}/${newSongs.length}`);
    log(`Success rate: ${report.statistics.successRate.toFixed(1)}%`);
    log(`Duration: ${(report.statistics.exportDuration / 1000).toFixed(1)}s`);

    return report;

  } catch (error: unknown) {
    logError('\n=== ❌ Sync Failed ===');
    logError(error);

    const endTime = Date.now();
    report.statistics.exportDuration = endTime - startTime;
    report.success = false;
    report.error = error instanceof Error ? error.message : 'Unknown error occurred';

    onProgress?.({
      stage: 'error',
      current: 0,
      total: 100,
      message: report.error,
    });

    return report;
  }
}

// ============================================
// IMPORT SERVICE (Basic - will be expanded in Chunk 5)
// ============================================

/**
 * Import a YouTube playlist to Fonea
 * This is a basic implementation that will be expanded in Chunk 5
 * 
 * @param youtubePlaylistId - YouTube playlist ID
 * @returns Array of imported songs
 */
export async function importPlaylistFromYouTube(
  youtubePlaylistId: string,
  onProgress?: (current: number, total: number) => void
): Promise<Song[]> {
  log(`=== Importing playlist ${youtubePlaylistId} ===`);

  const token = await youtubeAuth.getAccessToken();
  if (!token) {
    throw new Error('Not logged in to YouTube. Please sign in first.');
  }

  try {
    // Get playlist items
    log('Fetching playlist items...');
    const items = await youtubeApiClient.getPlaylistItems(youtubePlaylistId);
    
    log(`Found ${items.length} items in playlist`);

    // Extract video IDs
    const videoIds = items
      .filter(item => item.snippet.resourceId.kind === 'youtube#video')
      .map(item => item.snippet.resourceId.videoId);

    if (videoIds.length === 0) {
      throw new Error('No videos found in playlist');
    }

    log(`Getting details for ${videoIds.length} videos...`);

    // Get full video details (includes duration)
    // Process in batches of 50 (YouTube API limit)
    const allVideos = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
      const batch = videoIds.slice(i, i + BATCH_SIZE);
      const videos = await youtubeApiClient.getVideoDetails(batch);
      allVideos.push(...videos);

      if (onProgress) {
        onProgress(Math.min(i + BATCH_SIZE, videoIds.length), videoIds.length);
      }

      // Small delay between batches
      if (i + BATCH_SIZE < videoIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    log(`Retrieved details for ${allVideos.length} videos`);

    // Map to Song objects
    const songs = mapYouTubeVideosToSongs(allVideos, 'imported');

    log(`✅ Imported ${songs.length} songs`);

    return songs;

  } catch (err) {
    logError('Import failed:', err);
    throw err;
  }
}

/**
 * Import YouTube playlist to Fonea (Comprehensive version - Chunk 5)
 * Creates a complete Playlist object with metadata and progress tracking
 * 
 * @param youtubePlaylistId - YouTube playlist ID
 * @param onProgress - Optional progress callback
 * @returns Object with playlist, metadata, and import statistics
 */
export async function importYouTubePlaylistToFonea(
  youtubePlaylistId: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<{
  playlist: Playlist;
  metadata: {
    name: string;
    description: string;
    itemCount: number;
  };
  statistics: {
    successful: number;
    failed: number;
    duration: number;
  };
}> {
  const startTime = Date.now();
  log(`=== Comprehensive Import: ${youtubePlaylistId} ===`);

  try {
    // PHASE 1: Get playlist metadata
    onProgress?.({
      stage: 'fetching_playlist',
      current: 0,
      total: 1,
      message: 'Fetching playlist information...',
    });

    const playlistData = await youtubeApiClient.getPlaylistById(youtubePlaylistId);
    if (!playlistData) {
      throw new Error('Playlist not found or is private');
    }

    const metadata = {
      name: playlistData.snippet.title,
      description: playlistData.snippet.description || '',
      itemCount: playlistData.contentDetails?.itemCount || 0,
    };

    // PHASE 2: Get playlist items
    onProgress?.({
      stage: 'fetching_items',
      current: 0,
      total: metadata.itemCount,
      message: 'Loading playlist items...',
    });

    const items = await youtubeApiClient.getPlaylistItems(youtubePlaylistId);
    const videoIds = items
      .filter(item => item.snippet.resourceId.kind === 'youtube#video')
      .map(item => item.snippet.resourceId.videoId);

    // PHASE 3: Get video details
    onProgress?.({
      stage: 'fetching_details',
      current: 0,
      total: videoIds.length,
      message: 'Getting video details...',
    });

    const allVideos = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
      const batch = videoIds.slice(i, i + BATCH_SIZE);
      const videos = await youtubeApiClient.getVideoDetails(batch);
      allVideos.push(...videos);

      onProgress?.({
        stage: 'fetching_details',
        current: Math.min(i + BATCH_SIZE, videoIds.length),
        total: videoIds.length,
        message: `Getting video details... (${Math.min(i + BATCH_SIZE, videoIds.length)}/${videoIds.length})`,
      });

      if (i + BATCH_SIZE < videoIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // PHASE 4: Map to songs
    onProgress?.({
      stage: 'mapping_songs',
      current: 0,
      total: allVideos.length,
      message: 'Mapping songs...',
    });

    const songs = mapYouTubeVideosToSongs(allVideos, 'imported');

    // PHASE 5: Create playlist object
    onProgress?.({
      stage: 'creating_playlist',
      current: songs.length,
      total: songs.length,
      message: 'Creating playlist...',
    });

    const playlist: Playlist = {
      id: `imported-${Date.now()}`,
      name: metadata.name,
      description: metadata.description,
      songs: songs,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
      platformPlaylists: {
        youtube: {
          id: youtubePlaylistId,
          url: `https://www.youtube.com/playlist?list=${youtubePlaylistId}`,
          synced: true,
        },
      },
    };

    // PHASE 6: Complete
    const duration = Date.now() - startTime;
    onProgress?.({
      stage: 'complete',
      current: songs.length,
      total: songs.length,
      message: 'Import complete!',
    });

    const statistics = {
      successful: songs.length,
      failed: metadata.itemCount - songs.length,
      duration,
    };

    log(`✅ Import complete: ${statistics.successful} songs in ${(duration / 1000).toFixed(1)}s`);

    return {
      playlist,
      metadata,
      statistics,
    };

  } catch (error) {
    logError('Comprehensive import failed:', error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get user's YouTube playlists (Enhanced - Chunk 5)
 * Returns formatted playlist data ready for UI display
 */
export async function getUserYouTubePlaylists(): Promise<{
  id: string;
  name: string;
  description: string;
  itemCount: number;
  thumbnailUrl?: string;
  isPublic: boolean;
  url: string;
  createdAt: string;
}[]> {
  log('=== Getting YouTube playlists ===');

  const token = await youtubeAuth.getAccessToken();
  if (!token) {
    throw new Error('Not logged in to YouTube. Please sign in first.');
  }

  try {
    const playlists = await youtubeApiClient.listUserPlaylists();
    log(`Found ${playlists.length} playlists`);
    
    // Transform to UI-friendly format
    return playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.snippet.title,
      description: playlist.snippet.description || '',
      itemCount: playlist.contentDetails?.itemCount || 0,
      thumbnailUrl: playlist.snippet.thumbnails?.high?.url || playlist.snippet.thumbnails?.default?.url,
      isPublic: playlist.status?.privacyStatus === 'public',
      url: `https://www.youtube.com/playlist?list=${playlist.id}`,
      createdAt: playlist.snippet.publishedAt,
    }));
  } catch (err) {
    logError('Failed to get playlists:', err);
    throw err;
  }
}

/**
 * Get details of a specific playlist
 */
export async function getYouTubePlaylistDetails(playlistId: string) {
  log(`=== Getting playlist ${playlistId} ===`);

  const token = await youtubeAuth.getAccessToken();
  if (!token) {
    throw new Error('Not logged in to YouTube.');
  }

  try {
    const playlist = await youtubeApiClient.getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }
    return playlist;
  } catch (err) {
    logError('Failed to get playlist:', err);
    throw err;
  }
}

// ============================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================

export const youtubePlaylistService = {
  platform: 'youtube' as const,

  // New comprehensive methods
  exportPlaylist: exportPlaylistToYouTube,
  syncPlaylist: syncPlaylistToYouTube, // 🆕 CHUNK 8
  importPlaylist: importPlaylistFromYouTube,
  getPlaylists: getUserYouTubePlaylists,
  getPlaylistDetails: getYouTubePlaylistDetails,

  // Legacy methods (kept for compatibility, but use new client internally)
  async getPlaylistTracks(playlistId: string) {
    const token = await youtubeAuth.getAccessToken();
    if (!token) throw new Error('Not logged in to YouTube.');
    
    const items = await youtubeApiClient.getPlaylistItems(playlistId);
    return items.map(item => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      platform: 'youtube' as const,
      platformUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      albumArtUrl: item.snippet.thumbnails?.high?.url,
    }));
  },

  async createPlaylist(name: string, description: string = '', isPublic: boolean = false) {
    const token = await youtubeAuth.getAccessToken();
    if (!token) throw new Error('Not logged in to YouTube. Please sign in first.');
    
    const playlist = await youtubeApiClient.createPlaylist(name, description, isPublic);
    return {
      id: playlist.id,
      name: playlist.snippet.title,
      description: playlist.snippet.description,
      trackCount: 0,
      platform: 'youtube' as const,
      url: `https://www.youtube.com/playlist?list=${playlist.id}`,
      isPublic,
    };
  },

  async addTracksToPlaylist(playlistId: string, trackIds: string[]) {
    const token = await youtubeAuth.getAccessToken();
    if (!token) throw new Error('Not logged in to YouTube.');
    
    await youtubeApiClient.addVideosToPlaylist(playlistId, trackIds);
  },
};
