// src/services/export/exportVerificationService.ts
/**
 * Export Verification Service (Phase 4.5.6)
 * 
 * Compares songs requested for export with songs actually added to streaming platforms.
 * Tracks sync status per song per platform and provides detailed failure reporting.
 */

import type { Song, SyncStatus, PlatformSyncInfo } from '@/types/song';
import type { Platform } from '@/types/song';

const DEV = import.meta.env?.DEV;

function log(...args: any[]) {
  if (DEV) console.log('[ExportVerification]', ...args);
}



/**
 * Result of a single export operation
 */
export interface ExportResult {
  platform: Platform;
  playlistId: string;
  playlistUrl?: string;
  requestedSongs: Song[];
  successfulSongIds: string[];        // Song IDs that were successfully added
  failedSongs: FailedSongDetail[];
}

/**
 * Details about a song that failed to export
 */
export interface FailedSongDetail {
  songId: string;
  artist: string;
  title: string;
  reason: string;
  tier?: string;                      // Which resolution tier was used
  confidence?: number;                // Confidence score (0-1)
}

/**
 * Summary of export verification
 */
export interface VerificationResult {
  totalRequested: number;
  totalSuccessful: number;
  totalFailed: number;
  successRate: number;
  failedSongs: FailedSongDetail[];
}

/**
 * Main Export Verification Service
 */
export class ExportVerificationService {
  
  /**
   * Compare requested songs with songs actually added to the platform playlist
   */
  static async verifyExport(exportResult: ExportResult): Promise<VerificationResult> {
    log('=== Verifying Export ===');
    log(`Platform: ${exportResult.platform}`);
    log(`Requested: ${exportResult.requestedSongs.length} songs`);
    log(`Successful: ${exportResult.successfulSongIds.length} songs`);
    
    const { requestedSongs, successfulSongIds } = exportResult;
    
    const failedSongs: FailedSongDetail[] = [];
    const successfulSongIdsSet = new Set(successfulSongIds);
    
    for (const song of requestedSongs) {
      if (!successfulSongIdsSet.has(song.id)) {
        const reason = this.determineFailureReason(song, exportResult);
        
        failedSongs.push({
          songId: song.id,
          artist: song.artist,
          title: song.title,
          reason,
          tier: song.verificationSource,
          confidence: undefined, // Could be added if stored
        });
        
        log(`❌ Failed: "${song.title}" by ${song.artist} - ${reason}`);
      }
    }
    
    const successRate = requestedSongs.length > 0 
      ? (successfulSongIds.length / requestedSongs.length) * 100 
      : 0;
    
    const result: VerificationResult = {
      totalRequested: requestedSongs.length,
      totalSuccessful: successfulSongIds.length,
      totalFailed: failedSongs.length,
      successRate,
      failedSongs,
    };
    
    log('=== Verification Complete ===');
    log(`Success Rate: ${successRate.toFixed(1)}%`);
    log(`Failed Songs: ${failedSongs.length}`);
    
    return result;
  }
  
  /**
   * Determine why a song failed to export
   */
  private static determineFailureReason(song: Song, exportResult: ExportResult): string {
    const platform = exportResult.platform.toLowerCase();
    
    // Check if song has no platform ID
    const hasPlatformId = this.hasPlatformId(song, platform);
    
    if (!hasPlatformId) {
      return `No ${exportResult.platform} ID found - song may not exist on ${exportResult.platform}`;
    }
    
    // Check if song is not playable (region restrictions)
    if (song.isPlayable === false) {
      return 'Song not available in your region';
    }
    
    // Check verification status
    if (song.verificationStatus === 'failed' || song.verificationStatus === 'unverified') {
      return 'Song was not verified - may not exist on platform';
    }
    
    // Generic failure
    return `Unable to add song to playlist - it may not be available on ${exportResult.platform}`;
  }
  
  /**
   * Check if song has a platform ID for the given platform
   */
  private static hasPlatformId(song: Song, platform: string): boolean {
    switch (platform) {
      case 'spotify':
        return !!(
          song.platformIds?.spotify?.id ||
          song.spotifyId ||
          song.serviceUri?.startsWith('spotify:') ||
          song.spotifyUri?.startsWith('spotify:')
        );
      
      case 'applemusic':
      case 'apple':
        return !!(song.platformIds?.apple?.id);
      
      case 'tidal':
        return !!(song.platformIds?.tidal?.id);
      
      case 'qobuz':
        return !!(song.platformIds?.qobuz?.id);
      
      default:
        return false;
    }
  }
  
  /**
   * Update a song's sync status after export attempt
   */
  static updateSongSyncStatus(
    song: Song,
    platform: Platform,
    status: SyncStatus,
    playlistId: string,
    error?: string
  ): Song {
    log(`Updating sync status for "${song.title}": ${status}`);
    
    const platformKey = this.getPlatformKey(platform);
    const now = new Date().toISOString();
    
    const platformSyncInfo: PlatformSyncInfo = {
      status,
      playlistId,
      lastAttempted: now,
      lastSynced: status === 'success' ? now : song.syncStatus?.[platformKey]?.lastSynced,
      error: status === 'failed' ? error : undefined,
    };
    
    const updatedSong: Song = {
      ...song,
      syncStatus: {
        ...song.syncStatus,
        [platformKey]: platformSyncInfo,
      },
    };
    
    // Calculate overall sync status
    updatedSong.overallSyncStatus = this.calculateOverallStatus(updatedSong.syncStatus);
    
    return updatedSong;
  }
  
  /**
   * Calculate overall sync status across all platforms
   */
  private static calculateOverallStatus(
    syncStatus?: Song['syncStatus']
  ): Song['overallSyncStatus'] {
    if (!syncStatus) return 'pending';
    
    const statuses = Object.values(syncStatus)
      .filter((info): info is PlatformSyncInfo => info !== undefined)
      .map(info => info.status);
    
    if (statuses.length === 0) return 'pending';
    
    // All succeeded or manually resolved
    if (statuses.every(s => s === 'success' || s === 'manually_resolved')) {
      return 'all_success';
    }
    
    // All failed
    if (statuses.every(s => s === 'failed')) {
      return 'all_failed';
    }
    
    // Mixed results (some success, some failed)
    if (statuses.some(s => s === 'success' || s === 'manually_resolved')) {
      return 'partial_success';
    }
    
    return 'pending';
  }
  
  /**
   * Mark a song as manually resolved by the user
   */
  static markAsManuallyResolved(
    song: Song,
    platform: Platform
  ): Song {
    log(`Marking "${song.title}" as manually resolved for ${platform}`);
    
    const platformKey = this.getPlatformKey(platform);
    const now = new Date().toISOString();
    
    const updatedSong: Song = {
      ...song,
      syncStatus: {
        ...song.syncStatus,
        [platformKey]: {
          ...song.syncStatus?.[platformKey],
          status: 'manually_resolved',
          manuallyResolvedAt: now,
          error: undefined,
        } as PlatformSyncInfo,
      },
    };
    
    updatedSong.overallSyncStatus = this.calculateOverallStatus(updatedSong.syncStatus);
    
    return updatedSong;
  }
  
  /**
   * Reset sync status for a song (e.g., before re-export)
   */
  static resetSyncStatus(song: Song, platform: Platform): Song {
    log(`Resetting sync status for "${song.title}" on ${platform}`);
    
    const platformKey = this.getPlatformKey(platform);
    
    const newSyncStatus = { ...song.syncStatus };
    delete newSyncStatus[platformKey];
    
    const updatedSong: Song = {
      ...song,
      syncStatus: Object.keys(newSyncStatus).length > 0 ? newSyncStatus : undefined,
    };
    
    updatedSong.overallSyncStatus = this.calculateOverallStatus(updatedSong.syncStatus);
    
    return updatedSong;
  }
  
  /**
   * Get the platform key for syncStatus object
   */
  private static getPlatformKey(platform: Platform): keyof NonNullable<Song['syncStatus']> {
    switch (platform) {
      case 'Spotify':
        return 'spotify';
      case 'YouTube':
        return 'appleMusic'; // Note: This might need adjustment
      case 'Bandcamp':
        return 'tidal'; // Note: This might need adjustment
      case 'SoundCloud':
        return 'qobuz'; // Note: This might need adjustment
      default:
        return 'spotify';
    }
  }
  
  /**
   * Batch update sync status for multiple songs
   */
  static batchUpdateSyncStatus(
    songs: Song[],
    successfulSongIds: Set<string>,
    platform: Platform,
    playlistId: string
  ): Song[] {
    log(`Batch updating ${songs.length} songs for ${platform}`);
    
    return songs.map(song => {
      const wasSuccessful = successfulSongIds.has(song.id);
      const status: SyncStatus = wasSuccessful ? 'success' : 'failed';
      const error = wasSuccessful ? undefined : 'Failed to add to playlist';
      
      return this.updateSongSyncStatus(song, platform, status, playlistId, error);
    });
  }
}
