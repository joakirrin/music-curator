// src/hooks/useLocalState.ts
import { useEffect, useState } from "react";
import type { Song } from "@/types/song";

const STORAGE_KEY = "fonea.songs.v1";

/**
 * Local-storage backed songs state without render loops.
 * - Loads once via lazy initializer (no effect + setState on mount).
 * - Persists on changes.
 */
export function useSongsState(initial: Song[] = []) {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Song[];
        // very light validation
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* ignore parse errors and fall back to initial */
    }
    return initial;
  });

  // Persist only when songs actually change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    } catch {
      /* ignore quota errors */
    }
  }, [songs]);

  return { songs, setSongs };
}
