/**
 * Core Song type definition
 * Supports multiple sources (manual, ChatGPT, Spotify) and recommendation workflows
 */

export type Platform = "Spotify" | "YouTube" | "Bandcamp" | "SoundCloud";

// Decision filters used in the UI
export type FilterType = "all" | "keep" | "skip" | "pending";

// Verification status filter (Phase 2.1+)
export type VerificationFilterType = "all" | "verified" | "unverified" | "failed";

export type Song = {
  id: string;
  title: string;
  artist: string;
  featuring?: string;
  album?: string;
  year?: string;
  producer?: string;
  comments?: string;        // ChatGPT's reason (read-only from ChatGPT)
  duration?: number;        // seconds (coarse)
  durationMs?: number;      // milliseconds (accurate)

  // Source + workflow
  source?: "chatgpt" | "manual" | "spotify";
  round?: number;
  feedback?: "keep" | "skip" | "pending";  // replaces legacy liked/toAdd
  userFeedback?: string;                   // user's text feedback to send back to ChatGPT
  playlistId?: string;

  // Spotify linkage
  spotifyUri?: string;      // "spotify:track:..."
  spotifyId?: string;       // extracted from spotifyUri or API ("3n3Ppam7vgaVa1iaRUc9Lp")
  spotifyUrl?: string;      // https://open.spotify.com/track/...
  previewUrl?: string;      // 30s preview URL
  albumArt?: string;        // image URL (e.g., 300x300)
  releaseDate?: string;
  explicit?: boolean;
  popularity?: number;      // 0–100
  isPlayable?: boolean;

  addedAt?: string;         // ISO 8601

  // Verification (Phase 1.5+)
  verificationStatus?: "verified" | "unverified" | "checking" | "failed";
  verifiedAt?: string;      // ISO 8601
  verificationSource?: "spotify" | "youtube" | "manual";
  verificationError?: string;

  // ---- Deprecated (kept optional for backward compatibility) ----
  liked?: boolean;          // DEPRECATED legacy UI flag
  toAdd?: boolean;          // DEPRECATED legacy UI flag
  platforms?: Platform[];   // DEPRECATED legacy multi-platform shape
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt?: string; // ISO 8601
  updatedAt?: string; // ISO 8601
};

export type RecommendationRound = {
  id: string;       // e.g., "round-1"
  round: number;    // 1, 2, 3, ...
  createdAt: string; // ISO 8601
  notes?: string;
};
