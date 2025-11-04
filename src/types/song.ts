/**
 * Core Song type definition
 * Supports multiple sources (manual, ChatGPT, Spotify) and recommendation workflows
 */

export type Platform = "Spotify" | "YouTube" | "Bandcamp" | "SoundCloud";

// ✅ UPDATED: Filters now match feedback buttons (keep/skip/pending instead of liked/toAdd/pending)
export type FilterType = "all" | "keep" | "skip" | "pending";

export type Song = {
  id: string;
  title: string;
  artist: string;
  featuring?: string;
  album?: string;
  year?: string;
  producer?: string;
  comments?: string;
  duration?: number; // seconds
  
  // UI state
  liked: boolean;
  toAdd: boolean;
  platforms: Platform[];
  
  // ChatGPT integration fields (optional, backward compatible)
  source?: 'chatgpt' | 'manual' | 'spotify';
  round?: number;
  feedback?: 'keep' | 'skip' | 'pending'; // User's decision
  userFeedback?: string; // User's text feedback to send back to ChatGPT
  playlistId?: string;
  spotifyUri?: string;
  previewUrl?: string;
  addedAt?: string; // ISO 8601 timestamp
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
