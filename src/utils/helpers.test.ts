import { describe, it, expect } from 'vitest';
import { getOrphanedKeptSongs, getLibraryStats } from './libraryHelpers';
import { formatPlaylistDescription } from './formatters';
import { detectNewSongs, checkPlaylistLimit, formatPlaylistInfo } from './youtubePlaylistHelpers';
import {
  updatePlaylistSongs,
  markPlaylistAsSynced,
  getFailedExportSongs,
  getSuccessfulExportSongs,
  hasFailedExports,
  calculateExportStats,
} from './playlistHelpers';
import { makeSong, makePlaylist } from '@/test/factories';

describe('libraryHelpers', () => {
  it('getLibraryStats cuenta canciones por estado', () => {
    const songs = [
      makeSong({ id: '1', feedback: 'keep' }),
      makeSong({ id: '2', feedback: 'keep' }),
      makeSong({ id: '3', feedback: 'skip' }),
      makeSong({ id: '4', feedback: 'pending' }),
    ];
    expect(getLibraryStats(songs)).toEqual({ total: 4, kept: 2, skipped: 1, pending: 1 });
  });

  it('getLibraryStats con biblioteca vacía devuelve ceros', () => {
    expect(getLibraryStats([])).toEqual({ total: 0, kept: 0, skipped: 0, pending: 0 });
  });

  it('getOrphanedKeptSongs devuelve solo las guardadas que no están en ninguna playlist', () => {
    const a = makeSong({ id: 'a', feedback: 'keep' });
    const b = makeSong({ id: 'b', feedback: 'keep' });
    const c = makeSong({ id: 'c', feedback: 'skip' });
    const playlists = [makePlaylist({ songs: [a] })];
    expect(getOrphanedKeptSongs([a, b, c], playlists).map((s) => s.id)).toEqual(['b']);
  });

  it('getOrphanedKeptSongs sin playlists devuelve todas las guardadas', () => {
    const a = makeSong({ id: 'a', feedback: 'keep' });
    expect(getOrphanedKeptSongs([a], [])).toHaveLength(1);
  });
});

describe('formatPlaylistDescription', () => {
  it('sin descripción devuelve solo la marca de Fonea', () => {
    expect(formatPlaylistDescription()).toContain('Made with Fonea Sound Curator');
    expect(formatPlaylistDescription('   ')).toBe(formatPlaylistDescription());
  });

  it('une la descripción del usuario con la marca en una sola línea', () => {
    const out = formatPlaylistDescription('Para conducir');
    expect(out.startsWith('Para conducir --- ')).toBe(true);
    expect(out).toContain('Made with Fonea Sound Curator');
  });

  it('convierte los saltos de línea en espacios (Spotify rechaza descripciones multilínea)', () => {
    const out = formatPlaylistDescription('Línea 1\nLínea 2\r\nLínea 3');
    expect(out).not.toMatch(/[\r\n]/);
    expect(out).toContain('Línea 1 Línea 2 Línea 3');
  });
});

describe('youtubePlaylistHelpers', () => {
  const yt = (id: string, extra = {}) =>
    makeSong({ id, platformIds: { youtube: { id: `yt-${id}` } }, ...extra });

  it('detectNewSongs incluye las canciones sin ID de YouTube y las que faltan en la lista remota', () => {
    const local = [yt('1'), yt('2'), makeSong({ id: '3' })];
    const remote = [yt('1')];
    expect(detectNewSongs(local, remote).map((s) => s.id)).toEqual(['2', '3']);
  });

  it('detectNewSongs devuelve vacío si todo ya está en YouTube', () => {
    expect(detectNewSongs([yt('1')], [yt('1')])).toEqual([]);
  });

  it('checkPlaylistLimit avisa en 4000, bloquea en 5000 y no dice nada por debajo', () => {
    expect(checkPlaylistLimit(100)).toBeNull();
    expect(checkPlaylistLimit(3999)).toBeNull();
    expect(checkPlaylistLimit(4000)).toMatch(/Approaching YouTube limit.*1000 songs remaining/);
    expect(checkPlaylistLimit(5000)).toMatch(/Cannot add songs/);
  });

  it('formatPlaylistInfo calcula la duración en minutos y en horas', () => {
    const short = makePlaylist({ songs: [makeSong({ duration: 180 }), makeSong({ durationMs: 120000 })] });
    expect(formatPlaylistInfo(short)).toMatchObject({ songCount: 2, duration: '5m' });

    const long = makePlaylist({ songs: [makeSong({ duration: 3600 + 25 * 60 })] });
    expect(formatPlaylistInfo(long).duration).toBe('1h 25m');
  });

  it('formatPlaylistInfo sin duraciones devuelve null', () => {
    expect(formatPlaylistInfo(makePlaylist({ songs: [makeSong()] })).duration).toBeNull();
  });

  it('formatPlaylistInfo refleja si es pública', () => {
    expect(formatPlaylistInfo(makePlaylist({ isPublic: true })).isPublic).toBe(true);
  });
});

describe('playlistHelpers', () => {
  const ok = makeSong({ id: 'ok', overallSyncStatus: 'all_success' });
  const partial = makeSong({ id: 'partial', overallSyncStatus: 'partial_success' });
  const failed = makeSong({ id: 'failed', overallSyncStatus: 'all_failed' });
  const spotifyFailed = makeSong({
    id: 'sf',
    syncStatus: { spotify: { status: 'failed' } } as never,
  });
  const pending = makeSong({ id: 'pending' });

  it('updatePlaylistSongs reemplaza solo las canciones con el mismo ID', () => {
    const pl = makePlaylist({ songs: [makeSong({ id: 'a', title: 'Vieja' }), makeSong({ id: 'b' })] });
    const out = updatePlaylistSongs(pl, [makeSong({ id: 'a', title: 'Nueva' })]);
    expect(out.songs[0].title).toBe('Nueva');
    expect(out.songs[1].id).toBe('b');
  });

  it('updatePlaylistSongs no modifica la playlist original', () => {
    const pl = makePlaylist({ songs: [makeSong({ id: 'a', title: 'Vieja' })] });
    updatePlaylistSongs(pl, [makeSong({ id: 'a', title: 'Nueva' })]);
    expect(pl.songs[0].title).toBe('Vieja');
  });

  it('markPlaylistAsSynced guarda el ID y la URL de la plataforma', () => {
    const out = markPlaylistAsSynced(makePlaylist(), 'pl123', 'https://open.spotify.com/playlist/pl123');
    expect(out).toMatchObject({
      spotifyPlaylistId: 'pl123',
      spotifyUrl: 'https://open.spotify.com/playlist/pl123',
      synced: true,
    });
  });

  it('getFailedExportSongs y getSuccessfulExportSongs filtran por estado de exportación', () => {
    const pl = makePlaylist({ songs: [ok, partial, failed, spotifyFailed, pending] });
    expect(getFailedExportSongs(pl).map((s) => s.id)).toEqual(['failed', 'sf']);
    expect(getSuccessfulExportSongs(pl).map((s) => s.id)).toEqual(['ok']);
  });

  it('hasFailedExports detecta fallos totales o parciales', () => {
    expect(hasFailedExports(makePlaylist({ songs: [ok] }))).toBe(false);
    expect(hasFailedExports(makePlaylist({ songs: [ok, partial] }))).toBe(true);
    expect(hasFailedExports(makePlaylist({ songs: [failed] }))).toBe(true);
  });

  it('calculateExportStats cuenta éxitos (incluye parciales), fallos y pendientes', () => {
    const stats = calculateExportStats(makePlaylist({ songs: [ok, partial, failed, pending] }));
    expect(stats).toEqual({ total: 4, successful: 2, failed: 1, pending: 1, successRate: 50 });
  });

  it('calculateExportStats con playlist vacía no divide por cero', () => {
    expect(calculateExportStats(makePlaylist()).successRate).toBe(0);
  });
});
