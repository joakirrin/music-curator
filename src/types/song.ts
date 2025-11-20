// src/types/song.ts

// Platform used across the UI
export type Platform = 'Spotify' | 'YouTube' | 'Bandcamp' | 'SoundCloud';

// Song source and feedback types
export type SongSource = 'chatgpt' | 'manual' | 'imported' | 'spotify';
export type FeedbackStatus = 'pending' | 'keep' | 'skip';

// Verification types
export type VerificationStatus = 'verified' | 'unverified' | 'checking' | 'failed';
export type VerificationSource =
  | 'musicbrainz'
  | 'spotify'
  | 'itunes'
  | 'apple'
  | 'multi'
  | 'manual'
  | 'none';

export type Song = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;

  // Core curation metadata
  source: SongSource;
  round?: number;
  feedback: FeedbackStatus;
  addedAt: string;
  comments?: string;

  // Platforms where the song is available
  platforms: Platform[];
  liked: boolean;
  toAdd: boolean;

  // Core playback / duration info
  duration?: number;    // seconds
  durationMs?: number;  // milliseconds

  // Platform-specific identifiers
  spotifyUri?: string;
  spotifyId?: string;
  serviceId?: string;
  serviceUri?: string;
  serviceUrl?: string;

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

  // Verification state
  verificationStatus?: VerificationStatus;
  verificationSource?: VerificationSource;
  verificationError?: string | null;
  verifiedAt?: string;

  // External metadata / IDs
  musicBrainzId?: string;
  musicBrainzUrl?: string;
  isrc?: string;

  // Release info
  releaseId?: string;
  releaseDate?: string;

  // Media & preview
  albumArtUrl?: string;
  previewUrl?: string;
  isPlayable?: boolean;
  popularity?: number;

  // Additional musical metadata
  genre?: string;
  mood?: string;
  energy?: number;
  tempo?: number;
  key?: string;
  tags?: string[];
  notes?: string;
  userFeedback?: string;

  // Credits / people (used by fileHandlers)
  featuring?: string;
  producer?: string;

  // Playlist linkage (used by demo data / services)
  playlistId?: string;

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
export type FilterType = 'all' | 'keep' | 'skip' | 'pending';
export type VerificationFilterType = 'all' | 'verified' | 'unverified' | 'failed';
