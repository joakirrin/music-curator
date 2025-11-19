/**
 * Core Song type definition
 * Supports multiple sources (manual, ChatGPT, Spotify, YouTube, Apple Music) and recommendation workflows
 * 
 * ✅ PHASE 4 UPDATE: Added MusicBrainz fields for universal verification
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
  album?: string;
  year?: string;
  producer?: string;
  comments?: string;        // ChatGPT's reason (read-only from ChatGPT)
  duration?: number;        // seconds (coarse)
  durationMs?: number;      // milliseconds (accurate)

  // Source + workflow
  source?: "chatgpt" | "manual" | "spotify" | "youtube" | "applemusic";
  round?: number;
  feedback?: "keep" | "skip" | "pending";  // replaces legacy liked/toAdd
  userFeedback?: string;                   // user's text feedback to send back to ChatGPT
  playlistId?: string;

  // Service-agnostic metadata (works for Spotify, YouTube, Apple Music, etc.)
  serviceUri?: string;      // Service-specific URI (e.g., "spotify:track:..." or "youtube:video:...")
  serviceId?: string;       // Service-specific ID extracted from URI/URL
  serviceUrl?: string;      // Direct URL to track on service (e.g., https://open.spotify.com/track/...)
  previewUrl?: string;      // 30s preview URL
  albumArtUrl?: string;     // Album artwork image URL (e.g., 300x300)
  releaseDate?: string;     // Release date (YYYY-MM-DD)
  explicit?: boolean;       // Explicit content flag
  popularity?: number;      // Popularity score (0-100, platform-specific)
  isPlayable?: boolean;     // Whether track is playable in user's region

  addedAt?: string;         // ISO 8601

  // ✅ NEW: MusicBrainz fields for universal verification (Phase 4)
  musicBrainzId?: string;   // MusicBrainz Recording ID (MBID) - universal identifier
  isrc?: string;            // International Standard Recording Code - for cross-platform matching
  
  // ✅ NEW: Multi-platform IDs (extracted from MusicBrainz)
  platformIds?: {
    spotify?: {
      id: string;           // Track ID (e.g., "3n3Ppam7vgaVa1iaRUc9Lp")
      uri: string;          // Spotify URI (e.g., "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp")
      url?: string;         // Web URL
    };
    apple?: {
      id: string;           // Apple Music track ID
      url?: string;         // Store URL
    };
    tidal?: {
      id: string;           // Tidal track ID
      url?: string;         // Web URL
    };
    qobuz?: {
      id: string;           // Qobuz track ID
      url?: string;         // Web URL
    };
    youtube?: {
      id: string;           // YouTube video ID
      url?: string;         // Watch URL
    };
  };

  // Verification (Phase 1.5+) - UPDATED for multi-source
  verificationStatus?: "verified" | "unverified" | "checking" | "failed";
  verifiedAt?: string;      // ISO 8601
  verificationSource?: "spotify" | "youtube" | "applemusic" | "manual" | "musicbrainz" | "itunes" | "multi";
  verificationError?: string;

  // ---- Deprecated (kept optional for backward compatibility) ----
  featuring?: string;       // DEPRECATED - kept for backward compatibility only
  liked?: boolean;          // DEPRECATED legacy UI flag
  toAdd?: boolean;          // DEPRECATED legacy UI flag
  platforms?: Platform[];   // DEPRECATED legacy multi-platform shape
  spotifyUri?: string;      // DEPRECATED - use serviceUri
  spotifyId?: string;       // DEPRECATED - use serviceId
  spotifyUrl?: string;      // DEPRECATED - use serviceUrl
  albumArt?: string;        // DEPRECATED - use albumArtUrl
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
