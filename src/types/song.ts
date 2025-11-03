/**
 * Core Song type definition
 * Supports multiple sources (manual, ChatGPT, Spotify) and recommendation workflows
 */


export type Platform = "Spotify" | "YouTube" | "Bandcamp" | "SoundCloud";

export type FilterType = "all" | "liked" | "toAdd" | "pending";

export type Song = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // seconds
  
  // ChatGPT integration fields (optional, backward compatible)
  source?: 'chatgpt' | 'manual' | 'spotify';
  round?: number;
  feedback?: 'keep' | 'skip' | 'pending';
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
