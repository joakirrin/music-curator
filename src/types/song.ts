/**
 * Core Song type definition
 * Supports multiple sources (manual, ChatGPT, Spotify) and recommendation workflows
 */

export type Platform = "Spotify" | "YouTube" | "Bandcamp" | "SoundCloud";

// ✅ UPDATED: Only decision-based filters (all/keep/skip/pending)
// Note: "chatgpt" is not a filter - it's the source. All songs come from ChatGPT JSON imports.
export type FilterType = "all" | "keep" | "skip" | "pending";

// ✅ NEW: Verification status filter type (Phase 2.1)
export type VerificationFilterType = "all" | "verified" | "unverified" | "failed";

export type Song = {
  id: string;
  title: string;
  artist: string;
  featuring?: string;
  album?: string;
  year?: string;
  producer?: string;
  comments?: string; // ChatGPT's reason for recommending (read-only from ChatGPT)
  duration?: number; // seconds
  
  // UI state - LEGACY (kept for backward compatibility)
  liked: boolean;
  toAdd: boolean;
  platforms: Platform[];
  
  // ChatGPT integration fields (optional, backward compatible)
  source?: 'chatgpt' | 'manual' | 'spotify';
  round?: number;
  feedback?: 'keep' | 'skip' | 'pending'; // ✅ User's decision (replaces liked/toAdd)
  userFeedback?: string; // User's text feedback to send back to ChatGPT
  playlistId?: string;
  spotifyUri?: string;
  previewUrl?: string;
  addedAt?: string; // ISO 8601 timestamp
  
  // ✅ NEW: Verification fields (Phase 1.5)
  verificationStatus?: 'verified' | 'unverified' | 'checking' | 'failed';
  verifiedAt?: string; // ISO 8601 timestamp
  verificationSource?: 'spotify' | 'youtube' | 'manual';
  verificationError?: string; // Error message if verification failed
  
  // ✅ NEW: Enhanced Spotify metadata (fetched during verification)
  spotifyId?: string; // Extracted from spotifyUri
  spotifyUrl?: string; // Full URL for verification
  albumArt?: string; // 300x300 image URL
  releaseDate?: string;
  explicit?: boolean;
  popularity?: number; // 0-100
  durationMs?: number; // milliseconds (more accurate than duration seconds)
  isPlayable?: boolean;
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
