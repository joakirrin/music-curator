// src/hooks/useLocalState.ts
// LocalStorage-backed songs state with one-time migration (songs -> songs_v2)

import { useEffect, useState, useCallback } from "react";
import type { Song } from "../types/song";
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
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    // Phase 1: Try new storage
    const v2Raw = safeParse(localStorage.getItem(NEW_KEY));
    if (Array.isArray(v2Raw)) {
      const normalized = v2Raw.map(normalizeSong);
      setSongs(normalized);
      return;
    }

    // Phase 2: Migrate from old key if present
    const v1Raw = safeParse(localStorage.getItem(OLD_KEY));
    if (Array.isArray(v1Raw)) {
      const normalized = v1Raw.map(normalizeSong);
      setSongs(normalized);
      // Write through to new key
      localStorage.setItem(NEW_KEY, JSON.stringify(normalized));
      return;
    }

    // Phase 3: Use provided initial
    setSongs(initial.map(normalizeSong));
  }, [initial]);

  const saveSongs = useCallback((next: Song[]) => {
    const normalized = next.map(normalizeSong);
    setSongs(normalized);
    localStorage.setItem(NEW_KEY, JSON.stringify(normalized));
  }, []);

  return { songs, setSongs: saveSongs, storageKey: NEW_KEY };
}
