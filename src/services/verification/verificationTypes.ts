// src/services/verification/verificationTypes.ts
/**
 * Shared types for universal verification system
 * Supports multiple sources: MusicBrainz, iTunes, Spotify, Qobuz, etc.
 */

/**
 * Platform-specific identifiers
 */
export type PlatformIds = {
  spotify?: {
    id: string;           // Track ID (e.g., "3n3Ppam7vgaVa1iaRUc9Lp")
    uri: string;          // Spotify URI (e.g., "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp")
    url?: string;         // Optional web URL
  };
  apple?: {
    id: string;           // Apple Music track ID
    url?: string;         // Optional store URL
  };
  tidal?: {
    id: string;           // Tidal track ID
    url?: string;         // Optional web URL
  };
  qobuz?: {
    id: string;           // Qobuz track ID
    url?: string;         // Optional web URL
  };
  youtube?: {
    id: string;           // YouTube video ID
    url?: string;         // Optional watch URL
  };
};

/**
 * Verification source identifier
 */
export type VerificationSource = 
  | "musicbrainz" 
  | "itunes" 
  | "spotify" 
  | "qobuz"
  | "apple"
  | "multi";

/**
 * Unified verification result from any source
 */
export type VerificationResult = {
  // Verification status
  verified: boolean;
  source: VerificationSource;
  
  // Core metadata
  artist: string;
  title: string;
  album?: string;
  year?: string;
  releaseDate?: string;     // Full date if available (YYYY-MM-DD)
  
  // Universal identifiers
  musicBrainzId?: string;   // MusicBrainz Recording ID (MBID)
  releaseId?: string;       // 🆕 MusicBrainz Release ID (for album art)
  isrc?: string;            // International Standard Recording Code
  
  // Platform-specific IDs (populated from MusicBrainz URL relations)
  platformIds?: PlatformIds;
  
  // Media
  albumArtUrl?: string;     // 🆕 Album artwork URL (from Cover Art Archive)
  previewUrl?: string;      // 30-90s preview URL
  previewSource?: "itunes" | "qobuz" | "apple" | "spotify";
  previewDuration?: number; // Preview length in seconds
  
  // Match quality
  confidence?: number;      // 0-1 score for match confidence
  
  // Additional metadata
  duration?: number;        // Track duration in seconds
  durationMs?: number;      // Track duration in milliseconds
  explicit?: boolean;       // Explicit content flag
  
  // Error handling
  error?: string;           // Error message if verification failed
  timestamp?: string;       // ISO timestamp of verification
};

/**
 * MusicBrainz-specific API response types
 */
export type MusicBrainzRecording = {
  id: string;               // MBID
  title: string;
  length?: number;          // Duration in milliseconds
  "artist-credit"?: Array<{
    name: string;
    artist: {
      id: string;
      name: string;
    };
  }>;
  releases?: Array<{
    id: string;             // 🆕 Release ID (needed for album art!)
    title: string;
    date?: string;          // Release date (YYYY-MM-DD or YYYY)
    "cover-art-archive"?: {
      artwork: boolean;
      count: number;
      front: boolean;
      back: boolean;
    };
  }>;
  isrcs?: string[];
  score?: number;           // Search relevance score (0-100)
};

export type MusicBrainzSearchResponse = {
  created: string;
  count: number;
  offset: number;
  recordings: MusicBrainzRecording[];
};

export type MusicBrainzUrlRelation = {
  type: string;             // "streaming", "download", "purchase"
  "type-id": string;
  url: {
    resource: string;       // Full URL
    id: string;
  };
};

export type MusicBrainzRecordingDetail = MusicBrainzRecording & {
  relations?: MusicBrainzUrlRelation[];
};

/**
 * iTunes-specific API response types
 */
export type iTunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  releaseDate?: string;
  trackTimeMillis?: number;
  previewUrl?: string;
  artworkUrl30?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;   // Best quality available without auth
  trackExplicitness?: "explicit" | "cleaned" | "notExplicit";
  country?: string;
  currency?: string;
  primaryGenreName?: string;
};

export type iTunesSearchResponse = {
  resultCount: number;
  results: iTunesTrack[];
};

/**
 * Rate limiter configuration
 */
export type RateLimiterConfig = {
  requestsPerSecond: number;
  burstSize?: number;       // Allow brief bursts
};

/**
 * Retry configuration for network requests
 */
export type RetryConfig = {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
};
