// src/hooks/useSessionState.ts
/**
 * Hook for tracking music curation session
 * - Stores session start time
 * - Calculates session duration
 * - Persists across page refreshes
 */

import { useState, useEffect, useCallback } from 'react';

const SESSION_STORAGE_KEY = 'fonea-session-start';

export function useSessionState() {
  // Initialize from localStorage or create new session
  const [sessionStart, setSessionStart] = useState<number>(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const timestamp = parseInt(stored, 10);
      if (!isNaN(timestamp)) {
        return timestamp;
      }
    }
    // New session - store current time
    const now = Date.now();
    localStorage.setItem(SESSION_STORAGE_KEY, now.toString());
    return now;
  });

  // Calculate session duration in minutes
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  // Update duration every minute
  useEffect(() => {
    const updateDuration = () => {
      const now = Date.now();
      const durationMs = now - sessionStart;
      const durationMin = Math.floor(durationMs / 60000);
      setSessionDuration(durationMin);
    };

    // Initial update
    updateDuration();

    // Update every 30 seconds
    const interval = setInterval(updateDuration, 30000);

    return () => clearInterval(interval);
  }, [sessionStart]);

  // Start new session
  const startNewSession = useCallback(() => {
    const now = Date.now();
    setSessionStart(now);
    localStorage.setItem(SESSION_STORAGE_KEY, now.toString());
    setSessionDuration(0);
  }, []);

  // Format duration as "15m" or "1h 23m"
  const formatDuration = useCallback((minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  return {
    sessionStart,
    sessionDuration,
    formattedDuration: formatDuration(sessionDuration),
    startNewSession,
  };
}
