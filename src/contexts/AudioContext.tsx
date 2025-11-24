// src/contexts/AudioContext.tsx
/**
 * Audio Context
 * 
 * Manages global audio state to ensure only one preview plays at a time.
 * When a new preview starts, any currently playing preview is automatically stopped.
 * 
 * Usage:
 * ```tsx
 * const { currentPlaying, play, pause, isPlaying } = useAudio();
 * 
 * // Play a preview
 * play('song-id-123', 'https://preview-url.mp3');
 * 
 * // Check if this song is playing
 * if (isPlaying('song-id-123')) { ... }
 * 
 * // Pause current preview
 * pause();
 * ```
 */

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

type AudioContextValue = {
  currentPlaying: string | null;
  currentUrl: string | null;
  isPlaying: (songId: string) => boolean;
  play: (songId: string, url: string) => void;
  pause: () => void;
  toggle: (songId: string, url: string) => void;
  
  // Audio element state
  isLoading: boolean;
  error: string | null;
  duration: number;
  currentTime: number;
  
  // Seek control
  seek: (time: number) => void;
};

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'metadata';
    
    // Event listeners
    const audio = audioRef.current;
    
    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };
    
    const handleCanPlay = () => {
      setIsLoading(false);
    };
    
    const handleError = (e: Event) => {
      setIsLoading(false);
      setError('Failed to load preview');
      console.error('[Audio] Load error:', e);
    };
    
    const handleEnded = () => {
      setCurrentPlaying(null);
      setCurrentUrl(null);
      setCurrentTime(0);
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // Cleanup
    return () => {
      audio.pause();
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);
  
  // Play a preview
  const play = useCallback((songId: string, url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Stop time update interval if running
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    
    // If playing a different song, load new URL
    if (currentUrl !== url) {
      audio.src = url;
      audio.load();
    }
    
    // Play
    audio.play()
      .then(() => {
        setCurrentPlaying(songId);
        setCurrentUrl(url);
        setError(null);
        
        // Start time update interval
        timeUpdateIntervalRef.current = window.setInterval(() => {
          setCurrentTime(audio.currentTime);
        }, 100); // Update 10 times per second
      })
      .catch((err) => {
        console.error('[Audio] Play error:', err);
        setError('Failed to play preview');
      });
  }, [currentUrl]);
  
  // Pause current preview
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.pause();
    setCurrentPlaying(null);
    
    // Stop time update interval
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);
  
  // Toggle play/pause
  const toggle = useCallback((songId: string, url: string) => {
    if (currentPlaying === songId) {
      pause();
    } else {
      play(songId, url);
    }
  }, [currentPlaying, play, pause]);
  
  // Check if a song is currently playing
  const isPlaying = useCallback((songId: string) => {
    return currentPlaying === songId;
  }, [currentPlaying]);
  
  // Seek to a specific time
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);
  
  const value: AudioContextValue = {
    currentPlaying,
    currentUrl,
    isPlaying,
    play,
    pause,
    toggle,
    isLoading,
    error,
    duration,
    currentTime,
    seek,
  };
  
  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
