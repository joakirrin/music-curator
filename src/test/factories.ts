// Funciones auxiliares para construir datos de prueba.
import type { Song } from '@/types/song';
import type { Playlist } from '@/types/playlist';

export function makeSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    title: 'Nightcall',
    artist: 'Kavinsky',
    source: 'chatgpt',
    feedback: 'pending',
    addedAt: '2025-01-01T00:00:00.000Z',
    platforms: [],
    liked: false,
    toAdd: false,
    ...overrides,
  };
}

export function makePlaylist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: 'pl-1',
    name: 'Noche',
    songs: [],
    synced: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    isPublic: false,
    ...overrides,
  };
}
