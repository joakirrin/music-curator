// src/hooks/useLocalState.ts
// LocalStorage-backed songs state with one-time migration (songs -> songs_v2)

import { useEffect, useState, useCallback } from "react";
import { Song } from "../types/song";
import { normalizeSong } from "../utils/fileHandlers";

const NEW_KEY = "songs_v2";
const OLD_KEY = "songs";

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function useSongsState(initial: Song[] = []) {
  const [songs, setSongs] = useState<Song[]>(initial);

  // Load + migrate once
  useEffect(() => {
    const v2Raw = safeParse(localStorage.getItem(NEW_KEY));
    if (Array.isArray(v2Raw)) {
      const v2 = v2Raw.map((r) => normalizeSong(r));
      setSongs(v2);
      return;
    }

    const oldRaw = safeParse(localStorage.getItem(OLD_KEY));
    if (Array.isArray(oldRaw)) {
      const migrated = oldRaw.map((r) => normalizeSong(r));
      localStorage.setItem(NEW_KEY, JSON.stringify(migrated));
      setSongs(migrated);
      return;
    }

    // Nothing stored
    setSongs(initial);
  }, [initial]);

  const saveSongs = useCallback((next: Song[]) => {
    setSongs(next);
    localStorage.setItem(NEW_KEY, JSON.stringify(next));
  }, []);

  return { songs, setSongs: saveSongs, storageKey: NEW_KEY };
}
