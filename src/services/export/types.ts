// src/services/export/types.ts
// Type definitions for smart export system
// Supports multiple platforms: Spotify, YouTube, Apple Music, etc.

import type { Song } from '@/types/song';

// ============================================
// SMART RESOLVER TYPES
// ============================================

/**
 * Resolution tier indicates how a song was matched to a platform
 * - direct: Found via existing platform ID (no search needed)
 * - soft: Simple search (for verified songs)
 * - hard: Complex search with scoring
 * - failed: Could not be found
 */
export type ResolutionTier = 'direct' | 'soft' | 'hard' | 'failed';

/**
 * Result of resolving a song to a platform-specific ID
 * Used by both Spotify and YouTube resolvers
 */
export interface SmartResolveResult {
  song: Song;
  
  // Platform-specific IDs (only one will be populated)
  spotifyUri?: string | null;      // Format: "spotify:track:XXXX"
  youtubeId?: string | null;        // Format: "dQw4w9WgXcQ" (11 chars)
  appleId?: string | null;          // Apple Music track ID
  
  // Resolution metadata
  tier: ResolutionTier;
  confidence: number;               // 0-1 scale (0 = no match, 1 = perfect)
  reason?: string;                  // Error message if failed
}

// ============================================
// EXPORT REPORT TYPES
// ============================================

/**
 * Successfully exported song with metadata
 */
export interface ExportedSong {
  song: Song;
  tier: 'direct' | 'soft' | 'hard';
  confidence: number;
  platformUrl: string;              // Direct link to track on platform
}

/**
 * Failed song with reason
 */
export interface FailedSong {
  song: Song;
  reason: string;                   // Why it failed (e.g., "No match found")
  attemptedTiers: ResolutionTier[]; // Which tiers were attempted
}

/**
 * Success breakdown by tier
 */
export interface SuccessBreakdown {
  direct: number;                   // Tier 1 (existing IDs)
  softSearch: number;               // Tier 2 (simple search)
  hardSearch: number;               // Tier 3 (complex search)
  total: number;                    // Sum of all successful
  songs: ExportedSong[];            // Detailed list
}

/**
 * Statistics about the export operation
 */
export interface ExportStatistics {
  successRate: number;              // Percentage (0-100)
  averageConfidence: number;        // Average confidence score (0-100)
  exportDuration: number;           // Milliseconds
  apiCallsUsed?: number;            // API quota units used (YouTube)
}

/**
 * Comprehensive export report
 */
export interface ExportReport {
  // Basic info
  playlistName: string;
  platform: 'spotify' | 'youtube' | 'apple' | 'tidal';
  timestamp: string;                // ISO 8601
  
  // Results
  totalSongs: number;
  successful: SuccessBreakdown;
  failed: {
    count: number;
    songs: FailedSong[];
  };
  
  // Platform IDs (populated after export)
  playlistId?: string;              // Platform-specific playlist ID
  playlistUrl?: string;             // Direct link to playlist
  
  // Metadata
  statistics: ExportStatistics;
  success: boolean;                 // Overall success flag
  error?: string;                   // Error message if export failed
}

// ============================================
// PROGRESS TRACKING TYPES
// ============================================

/**
 * Export stage for progress tracking
 */
export type ExportStage = 
  | 'resolving'      // Resolving songs to platform IDs
  | 'creating'       // Creating playlist on platform
  | 'adding_tracks'  // Adding tracks to playlist
  | 'verifying'      // Verifying export (optional)
  | 'complete'       // Done!
  | 'error';         // Failed

/**
 * Progress update callback
 */
export interface ExportProgress {
  stage: ExportStage;
  current: number;   // Current item/step
  total: number;     // Total items/steps
  message: string;   // Human-readable message
}

// ============================================
// PLATFORM-SPECIFIC TYPES
// ============================================

/**
 * YouTube-specific export options
 */
export interface YouTubeExportOptions {
  playlistName: string;
  description?: string;
  isPublic?: boolean;
  onProgress?: (progress: ExportProgress) => void;
}

/**
 * Spotify-specific export options
 */
export interface SpotifyExportOptions {
  playlistName: string;
  description?: string;
  isPublic?: boolean;
  onProgress?: (progress: ExportProgress) => void;
}

// ============================================
// HELPER TYPE GUARDS
// ============================================

/**
 * Check if resolve result has a valid platform ID
 */
export function hasValidPlatformId(result: SmartResolveResult): boolean {
  return !!(result.spotifyUri || result.youtubeId || result.appleId);
}

/**
 * Get platform from resolve result
 */
export function getPlatformFromResult(result: SmartResolveResult): string | null {
  if (result.spotifyUri) return 'spotify';
  if (result.youtubeId) return 'youtube';
  if (result.appleId) return 'apple';
  return null;
}

// ============================================
// IMPORT REPORT TYPES
// ============================================

/**
 * Import stage for progress tracking
 */
export type ImportStage = 
  | 'fetching_playlist'   // Getting playlist metadata
  | 'fetching_items'      // Fetching playlist items (with pagination)
  | 'fetching_details'    // Getting video details (duration, etc)
  | 'mapping_songs'       // Converting videos to Song objects
  | 'creating_playlist'   // Creating local Playlist object
  | 'complete'            // Done!
  | 'error';              // Failed

/**
 * Progress update for import operations
 */
export interface ImportProgress {
  stage: ImportStage;
  current: number;   // Current item/step
  total: number;     // Total items/steps
  message: string;   // Human-readable message
}

/**
 * Failed import item with reason
 */
export interface FailedImportItem {
  videoId: string;
  title: string;
  reason: string;  // Why it failed (e.g., "Video is private", "Video deleted")
}

/**
 * Statistics about the import operation
 */
export interface ImportStatistics {
  successRate: number;           // Percentage (0-100)
  importDuration: number;         // Milliseconds
  totalVideos: number;            // Total videos in YouTube playlist
  successfulImports: number;      // Videos successfully converted to Songs
  failedImports: number;          // Videos that couldn't be imported
  skippedItems: number;           // Non-video items (live streams, private, etc)
}

/**
 * Comprehensive import report
 */
export interface ImportReport {
  // Source info
  playlistName: string;
  playlistId: string;              // YouTube playlist ID
  platform: 'spotify' | 'youtube' | 'apple' | 'tidal';
  timestamp: string;               // ISO 8601
  
  // Results
  statistics: ImportStatistics;
  
  // Imported songs
  songs: Song[];                   // Successfully imported songs
  
  // Failed items
  failed: FailedImportItem[];
  
  // Metadata
  success: boolean;                // Overall success flag
  error?: string;                  // Error message if import failed completely
  
  // Created playlist (if applicable)
  localPlaylistId?: string;        // ID of created Fonea playlist
}
