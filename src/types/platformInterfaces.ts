// src/types/platformInterfaces.ts
// Platform-agnostic interfaces for multi-platform music service integration
// Supports: Spotify, YouTube Music, Apple Music, Tidal, etc.

// ============================================
// AUTHENTICATION INTERFACE
// ============================================

export interface PlatformAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface PlatformAuth {
  platform: 'spotify' | 'youtube' | 'apple' | 'tidal';
  login(): Promise<void>;
  logout(): void;
  getAccessToken(): Promise<string | null>;
  isAuthenticated(): boolean;
  refreshToken?(): Promise<boolean>;
  getUser?(): { id: string; display_name?: string; images?: { url: string }[] } | null;
}

// ============================================
// MUSIC SERVICE INTERFACE (Search & Metadata)
// ============================================

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  durationMs?: number;
  isrc?: string;
  platform: string;
  platformUrl?: string;
  albumArtUrl?: string;
  previewUrl?: string;
  year?: string;
  releaseDate?: string;
}

export interface SearchResult {
  tracks: TrackMetadata[];
  hasMore: boolean;
}

export interface PlatformMusicService {
  platform: string;
  searchTrack(query: string, limit?: number): Promise<SearchResult>;
  getTrackById(id: string): Promise<TrackMetadata | null>;
  verifyTrack(title: string, artist: string): Promise<TrackMetadata | null>;
  verifyTracks?(tracks: Array<{ title: string; artist: string }>): Promise<(TrackMetadata | null)[]>;
}

// ============================================
// PLAYLIST SERVICE INTERFACE (CRUD Operations)
// ============================================

export interface PlaylistMetadata {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  platform: string;
  url?: string;
  isPublic?: boolean;
}

export interface PlatformPlaylistService {
  platform: string;
  getPlaylists(): Promise<PlaylistMetadata[]>;
  getPlaylistTracks(playlistId: string): Promise<TrackMetadata[]>;
  createPlaylist(name: string, description?: string, isPublic?: boolean): Promise<PlaylistMetadata>;
  addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void>;
  removeTracksFromPlaylist?(playlistId: string, trackIds: string[]): Promise<void>;
  updatePlaylist?(playlistId: string, updates: { name?: string; description?: string }): Promise<void>;
}

// ============================================
// VERIFICATION ORCHESTRATOR TYPES
// ============================================

export interface VerificationSource {
  platform: string;
  service: PlatformMusicService;
  priority: number; // Lower = higher priority
}

export interface VerificationResult {
  found: boolean;
  source: string; // 'spotify' | 'youtube' | 'musicbrainz' | 'apple'
  track?: TrackMetadata;
  confidence?: number; // 0-1 scale
}

// ============================================
// EXPORT/RESOLVER TYPES
// ============================================

export interface SmartResolveResult {
  song: any; // Original Song object
  spotifyUri?: string;
  youtubeId?: string;
  appleId?: string;
  tier: 'direct' | 'soft' | 'hard';
  confidence: number;
  reason?: string;
}
