/**
 * Demo data for development and testing
 * Mix of old data (without new fields) and new data (with ChatGPT integration fields)
 * to verify backward compatibility
 */

import type { Song, Playlist, RecommendationRound } from '../types';

/**
 * Sample songs - mix of old format (no new fields) and new format (with integration fields)
 * This ensures backward compatibility is tested
 */
export const demoSongs: Song[] = [
  // Old format (existing data - should still work)
  {
    id: 'song-1',
    title: 'Midnight Dreams',
    artist: 'Luna Echo',
    album: 'Whispers',
    duration: 243,
  },
  {
    id: 'song-2',
    title: 'Electric Soul',
    artist: 'Neon Pixels',
    album: 'Synthetic Horizon',
    duration: 287,
  },

  // New format with ChatGPT integration fields
  {
    id: 'song-3',
    title: 'Cosmic Journey',
    artist: 'Star Traveler',
    album: 'Beyond the Stars',
    duration: 312,
    source: 'chatgpt',
    round: 1,
    feedback: 'pending',
    playlistId: 'playlist-alpha',
    addedAt: '2025-01-15T10:30:00Z',
  },
  {
    id: 'song-4',
    title: 'Urban Pulse',
    artist: 'City Lights',
    album: 'Neon Nights',
    duration: 256,
    source: 'spotify',
    spotifyUri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqLv',
    previewUrl: 'https://p.scdn.co/preview-mp3-play/url...',
    round: 1,
    feedback: 'keep',
    playlistId: 'playlist-alpha',
    addedAt: '2025-01-15T11:00:00Z',
  },
  {
    id: 'song-5',
    title: 'Harvest Moon',
    artist: 'Golden Fields',
    album: 'Seasonal Tales',
    duration: 198,
    source: 'manual',
    round: 2,
    feedback: 'skip',
    addedAt: '2025-01-16T09:15:00Z',
  },

  // Another old format entry for mixing
  {
    id: 'song-6',
    title: 'Riverside Serenade',
    artist: 'Water Music',
    album: 'Natural Flow',
    duration: 234,
  },
];

/**
 * Sample playlists
 */
export const demoPlaylists: Playlist[] = [
  {
    id: 'playlist-alpha',
    name: 'AI Curated Vibes',
    description: 'Songs recommended by ChatGPT AI',
    songIds: ['song-3', 'song-4', 'song-5'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-16T14:30:00Z',
  },
  {
    id: 'playlist-beta',
    name: 'Manual Selection',
    description: 'Handpicked collection',
    songIds: ['song-1', 'song-2', 'song-6'],
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
];

/**
 * Sample recommendation rounds
 */
export const demoRecommendationRounds: RecommendationRound[] = [
  {
    id: 'round-1',
    round: 1,
    createdAt: '2025-01-15T10:00:00Z',
    notes: 'Initial ChatGPT recommendations based on user preferences',
  },
  {
    id: 'round-2',
    round: 2,
    createdAt: '2025-01-16T09:00:00Z',
    notes: 'Refined recommendations after user feedback',
  },
];

/**
 * Get all demo data as a complete package
 */
export function getDemoData() {
  return {
    songs: demoSongs,
    playlists: demoPlaylists,
    rounds: demoRecommendationRounds,
  };
}
