// src/hooks/useUndoClear.ts
/**
 * Hook for undoing library clear operations
 * - Stores cleared songs in localStorage for 10 minutes
 * - Provides countdown timer
 * - Auto-cleanup after expiry
 */

import { useState, useEffect, useCallback } from 'react';
import type { Song } from '@/types/song';

const UNDO_STORAGE_KEY = 'fonea-undo-clear';
const UNDO_DURATION_MS = 10 * 60 * 1000; // 10 minutes

type UndoState = {
  songs: Song[];
  clearedAt: number; // timestamp
  expiresAt: number; // timestamp
};

export function useUndoClear() {
  const [undoState, setUndoState] = useState<UndoState | null>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(UNDO_STORAGE_KEY);
      if (!stored) return null;
      
      const state: UndoState = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() > state.expiresAt) {
        localStorage.removeItem(UNDO_STORAGE_KEY);
        return null;
      }
      
      return state;
    } catch (error) {
      console.error('[UndoClear] Failed to load undo state:', error);
      localStorage.removeItem(UNDO_STORAGE_KEY);
      return null;
    }
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Update countdown every second
  useEffect(() => {
    if (!undoState) {
      setSecondsRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, undoState.expiresAt - now);
      const seconds = Math.ceil(remaining / 1000);
      
      setSecondsRemaining(seconds);
      
      // Auto-cleanup when expired
      if (seconds === 0) {
        setUndoState(null);
        localStorage.removeItem(UNDO_STORAGE_KEY);
      }
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [undoState]);

  /**
   * Store cleared songs for undo
   */
  const storeClearedSongs = useCallback((songs: Song[]) => {
    if (songs.length === 0) return;

    const now = Date.now();
    const state: UndoState = {
      songs,
      clearedAt: now,
      expiresAt: now + UNDO_DURATION_MS,
    };

    try {
      localStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(state));
      setUndoState(state);
    } catch (error) {
      console.error('[UndoClear] Failed to store cleared songs:', error);
    }
  }, []);

  /**
   * Restore cleared songs
   * Reads directly from localStorage to avoid React state timing issues
   */
  const restoreSongs = useCallback((): Song[] | null => {
    try {
      // Read directly from localStorage (not from React state)
      const stored = localStorage.getItem(UNDO_STORAGE_KEY);
      if (!stored) return null;
      
      const state: UndoState = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() > state.expiresAt) {
        localStorage.removeItem(UNDO_STORAGE_KEY);
        setUndoState(null);
        return null;
      }
      
      const songs = state.songs;
      
      // Clear undo state
      setUndoState(null);
      localStorage.removeItem(UNDO_STORAGE_KEY);
      
      return songs;
    } catch (error) {
      console.error('[UndoClear] Failed to restore songs:', error);
      return null;
    }
  }, []); // ✅ No dependencies - always reads fresh from localStorage

  /**
   * Cancel undo (clear stored songs)
   */
  const cancelUndo = useCallback(() => {
    setUndoState(null);
    localStorage.removeItem(UNDO_STORAGE_KEY);
  }, []);

  /**
   * Format remaining time as "9:32" or "0:45"
   */
  const formatTimeRemaining = useCallback((): string => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [secondsRemaining]);

  return {
    canUndo: !!undoState && secondsRemaining > 0,
    songsCount: undoState?.songs.length || 0,
    secondsRemaining,
    formattedTimeRemaining: formatTimeRemaining(),
    storeClearedSongs,
    restoreSongs,
    cancelUndo,
  };
}
