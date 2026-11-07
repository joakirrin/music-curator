// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPlaylists,
  savePlaylists,
  clearPlaylists,
  exportPlaylistsJSON,
  importPlaylistsJSON,
  getStorageStats,
} from './playlistStorage';
import { makeSong, makePlaylist } from '@/test/factories';

const KEY = 'fonea.playlists.v1';

beforeEach(() => {
  localStorage.clear();
});

describe('guardar y cargar playlists', () => {
  it('sin datos devuelve una lista vacía', () => {
    expect(loadPlaylists()).toEqual([]);
  });

  it('lo que se guarda se recupera igual', () => {
    const pl = makePlaylist({ songs: [makeSong({ id: 'a' }), makeSong({ id: 'b' })] });
    savePlaylists([pl]);
    expect(loadPlaylists()).toEqual([pl]);
  });

  it('guarda con versión 2', () => {
    savePlaylists([makePlaylist()]);
    expect(JSON.parse(localStorage.getItem(KEY)!).version).toBe(2);
  });

  it('datos corruptos devuelven una lista vacía sin romper la app', () => {
    localStorage.setItem(KEY, '{esto no es json');
    expect(loadPlaylists()).toEqual([]);
  });

  it('un formato sin lista de playlists devuelve vacío', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, playlists: 'no' }));
    expect(loadPlaylists()).toEqual([]);
  });

  it('clearPlaylists borra solo las playlists', () => {
    localStorage.setItem('otra-clave', 'valor');
    savePlaylists([makePlaylist()]);
    clearPlaylists();
    expect(loadPlaylists()).toEqual([]);
    expect(localStorage.getItem('otra-clave')).toBe('valor');
  });
});

describe('migración de la versión 1 a la 2', () => {
  it('convierte la lista de IDs en canciones completas usando la biblioteca guardada', () => {
    const songA = makeSong({ id: 'a', title: 'Tema A' });
    localStorage.setItem('fonea.songs.v1', JSON.stringify([songA]));
    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        playlists: [
          {
            id: 'pl-old',
            name: 'Antigua',
            songIds: ['a', 'no-existe'],
            synced: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            isPublic: false,
          },
        ],
      })
    );

    const loaded = loadPlaylists();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].songs.map((s) => s.id)).toEqual(['a']); // la que no existe se omite
    // y queda guardada ya en el formato nuevo
    expect(JSON.parse(localStorage.getItem(KEY)!).version).toBe(2);
  });
});

describe('exportar e importar JSON de playlists', () => {
  it('exportPlaylistsJSON devuelve las playlists guardadas', () => {
    savePlaylists([makePlaylist({ id: 'x', name: 'Exportada' })]);
    expect(JSON.parse(exportPlaylistsJSON())[0].name).toBe('Exportada');
  });

  it('importPlaylistsJSON acepta una lista válida', () => {
    const json = JSON.stringify([makePlaylist({ id: 'ok' })]);
    expect(importPlaylistsJSON(json)[0].id).toBe('ok');
  });

  it('importPlaylistsJSON rechaza JSON inválido', () => {
    expect(() => importPlaylistsJSON('no json')).toThrow();
  });

  it('importPlaylistsJSON rechaza algo que no es una lista', () => {
    expect(() => importPlaylistsJSON('{"id":"a"}')).toThrow(/expected array/);
  });

  it('importPlaylistsJSON rechaza playlists sin nombre, ID o canciones', () => {
    expect(() => importPlaylistsJSON('[{"id":"a","songs":[]}]')).toThrow(/Invalid playlist structure/);
    expect(() => importPlaylistsJSON('[{"name":"n","songs":[]}]')).toThrow(/Invalid playlist structure/);
    expect(() => importPlaylistsJSON('[{"id":"a","name":"n"}]')).toThrow(/Invalid playlist structure/);
  });
});

describe('getStorageStats', () => {
  it('cuenta playlists, canciones y tamaño', () => {
    savePlaylists([
      makePlaylist({ id: '1', songs: [makeSong({ id: 'a' })] }),
      makePlaylist({ id: '2', songs: [makeSong({ id: 'b' }), makeSong({ id: 'c' })] }),
    ]);
    const stats = getStorageStats();
    expect(stats.count).toBe(2);
    expect(stats.totalSongs).toBe(3);
    expect(stats.storageSize).toBeGreaterThan(0);
  });

  it('sin datos devuelve ceros', () => {
    expect(getStorageStats()).toEqual({ count: 0, totalSongs: 0, storageSize: 0 });
  });
});
