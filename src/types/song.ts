// src/types/song.ts

export type Song = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
  source: "chatgpt" | "manual" | "imported";
  round?: number;
  feedback: "pending" | "keep" | "skip";
  addedAt: string;
  comments?: string;
  platforms: string[];
  liked: boolean;
  toAdd: boolean;

  // Spotify/Platform specific
  spotifyUri?: string;
  platformIds?: {
    spotify?: {
      id: string;
      url?: string;
    };
    apple?: {
      id: string;
      url?: string;
    };
    tidal?: {
      id: string;
      url?: string;
    };
    qobuz?: {
      id: string;
      url?: string;
    };
    youtube?: {
      id: string;
      url?: string;
    };
  };

  // MusicBrainz verification
  verificationStatus?: "verified" | "unverified" | "checking" | "failed";
  verificationSource?: "musicbrainz" | "spotify" | "itunes" | "apple" | "multi" | "manual" | "none";
  verificationError?: string;  // Error message if verification failed
  musicBrainzId?: string;
  musicBrainzUrl?: string;
  isrc?: string;
  
  // 🆕 Album Art (Phase 4.7)
  albumArtUrl?: string;  // URL to album artwork (from Cover Art Archive or iTunes)
  releaseId?: string;    // MusicBrainz Release ID (for Cover Art Archive)
  
  // Additional metadata
  duration?: number;     // Track duration in seconds
  durationMs?: number;   // Track duration in milliseconds
  explicit?: boolean;
  
  // User feedback
  userFeedback?: string;
  
  // Legacy/additional fields
  relationships?: {
    url?: Array<{
      type: string;
      url: string;
      targetType: string;
    }>;
  };
};

// Filter types for UI
export type FilterType = "all" | "keep" | "skip" | "pending";
export type VerificationFilterType = "all" | "verified" | "unverified" | "failed";
