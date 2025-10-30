import { useState, useEffect } from 'react';
import { Song } from '../types/song';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';
import { demoSongs } from '../utils/demoData';

const normalize = (items: any[]): Song[] =>
  (items || []).map((s) => ({
    id: s.id ?? crypto.randomUUID(),
    cancion: s.cancion ?? '',
    artista: s.artista ?? '',
    fts: s.fts ?? '',
    album: s.album ?? '',
    anio: s.anio ?? '',
    productor: s.productor ?? '',
    plataformas: Array.isArray(s.plataformas) ? s.plataformas : [],
    me_gusta: Boolean(s.me_gusta),
    agregar: (s.agregar ?? s.toAdd ?? false) as boolean,
    comentarios: s.comentarios ?? '',
  }));

export const useLocalState = () => {
  const [songs, setSongs] = useState<Song[]>(() => {
    const stored = loadFromLocalStorage();
    const base = stored.length > 0 ? stored : demoSongs;
    return normalize(base);
  });

  useEffect(() => {
    saveToLocalStorage(songs);
  }, [songs]);

  return [songs, setSongs] as const;
};
