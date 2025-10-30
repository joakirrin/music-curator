import { useState, useEffect } from 'react';
import { Song } from '../types/song';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';
import { demoSongs } from '../utils/demoData';

export const useLocalState = () => {
  const [songs, setSongs] = useState<Song[]>(() => {
    const stored = loadFromLocalStorage();
    return stored.length > 0 ? stored : demoSongs;
  });

  useEffect(() => {
    saveToLocalStorage(songs);
  }, [songs]);

  return [songs, setSongs] as const;
};
