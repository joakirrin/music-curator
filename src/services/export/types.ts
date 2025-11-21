// FILE: src/services/export/types.ts (NEW)

import type { Song } from '@/types/song';

/**
 * Defines the result of a single song's resolution attempt
 */
export type SmartResolveResult = {
  song: Song;
  spotifyUri: string | null;
  tier: 'direct' | 'soft' | 'hard' | 'failed';
  confidence: number;
  reason?: string;
};

/**
 * Structure for the final export report shown to the user
 * Based on TASK_LIST_v9.md
 */
export type ExportReport = {
  playlistName: string;
  platform: 'spotify' | 'apple' | 'tidal' | 'qobuz';
  timestamp: string;
  
  totalSongs: number;
  
  successful: {
    direct: number;      // Tier 1
    softSearch: number;  // Tier 2
    hardSearch: number;  // Tier 3
    total: number;
    songs: ExportedSong[];
  };
  
  failed: {
    count: number;
    songs: FailedSong[];
  };
  
  statistics: {
    successRate: number;
    averageConfidence: number;
    exportDuration: number;
  };

  // Fields from the old PushResult
  success: boolean;
  playlistId?: string;
  playlistUrl?: string;
  error?: string;
};

export type ExportedSong = {
  song: Song;
  tier: 'direct' | 'soft' | 'hard';
  confidence: number;
  platformUrl: string;
};

export type FailedSong = {
  song: Song;
  reason: string;
  attemptedTiers: string[];
};