// src/components/AudioPlayer.tsx
/**
 * Audio Player Component - IMPROVED VERSION
 * 
 * Displays a Spotify-style audio player for 30-second song previews.
 * Now with better UX, clearer visuals, and bug fixes.
 * 
 * Features:
 * - Larger, more visible play/pause icons
 * - Clear "Preview" badge
 * - Progress bar only animates on the playing song
 * - Better visual feedback for active state
 * - Improved spacing and sizing
 */

import React from 'react';
import { useAudio } from '@/contexts/AudioContext';

type AudioPlayerProps = {
  previewUrl?: string;
  title: string;
  artist: string;
  songId: string;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  previewUrl,
  title,
  artist,
  songId,
}) => {
  const { isPlaying, toggle, isLoading, error, duration, currentTime, seek } = useAudio();
  
  const playing = isPlaying(songId);
  
  // No preview available
  if (!previewUrl) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="w-10 h-10 flex items-center justify-center text-gray-500 bg-gray-700 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">No preview available</span>
        </div>
      </div>
    );
  }
  
  const handlePlayPause = () => {
    toggle(songId, previewUrl);
  };
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playing || !duration) return; // Only allow seeking if THIS song is playing
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    seek(newTime);
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 🔧 BUG FIX: Only calculate progress if THIS song is playing
  const progress = playing && duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-lg border transition-all
      ${playing 
        ? 'bg-gray-800 border-emerald-600 shadow-lg shadow-emerald-600/20' 
        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
      }
    `}>
      {/* Play/Pause Button - Larger and more visible */}
      <button
        onClick={handlePlayPause}
        disabled={isLoading}
        className={`
          w-10 h-10 flex items-center justify-center rounded-full 
          transition-all flex-shrink-0
          ${playing 
            ? 'bg-emerald-500 hover:bg-emerald-600 scale-105' 
            : 'bg-emerald-600 hover:bg-emerald-700'
          }
          disabled:bg-gray-600 disabled:cursor-not-allowed
        `}
        title={playing ? `Pause "${title}" by ${artist}` : `Play "${title}" by ${artist}`}
      >
        {isLoading ? (
          // Loading spinner
          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : playing ? (
          // Pause icon - Thicker bars for better visibility
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          // Play icon - Triangle with better definition
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4l14 8-14 8V4z" />
          </svg>
        )}
      </button>
      
      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {/* Preview Badge - More prominent */}
          <div className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${playing 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gray-700 text-gray-300'
            }
          `}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span>30s Preview</span>
          </div>
          
          {/* Time Display - Only show if THIS song is playing */}
          {playing && duration > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-300 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-500">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar - Only animate if THIS song is playing */}
        <div 
          className={`
            h-2 rounded-full overflow-hidden transition-all
            ${playing ? 'bg-gray-700 cursor-pointer' : 'bg-gray-700'}
          `}
          onClick={handleSeek}
        >
          <div 
            className={`
              h-full rounded-full transition-all
              ${playing ? 'bg-emerald-500' : 'bg-gray-600'}
            `}
            style={{ 
              width: `${progress}%`,
              transition: playing ? 'width 0.1s linear' : 'none'
            }}
          />
        </div>
        
        {/* Status text when not playing */}
        {!playing && (
          <p className="text-xs text-gray-500 mt-1.5">
            Click play to listen
          </p>
        )}
      </div>
      
      {/* Error State */}
      {error && playing && (
        <div className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">Error loading</span>
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for smaller spaces
 */
export const AudioPlayerCompact: React.FC<AudioPlayerProps> = ({
  previewUrl,
  title,
  artist,
  songId,
}) => {
  const { isPlaying, toggle, isLoading } = useAudio();
  
  const playing = isPlaying(songId);
  
  if (!previewUrl) {
    return (
      <button
        disabled
        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 cursor-not-allowed"
        title="No preview available"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </button>
    );
  }
  
  const handlePlayPause = () => {
    toggle(songId, previewUrl);
  };
  
  return (
    <button
      onClick={handlePlayPause}
      disabled={isLoading}
      className={`
        w-10 h-10 flex items-center justify-center rounded-full 
        transition-all
        ${playing 
          ? 'bg-emerald-500 hover:bg-emerald-600 scale-105' 
          : 'bg-emerald-600 hover:bg-emerald-700'
        }
        disabled:bg-gray-600 disabled:cursor-not-allowed
      `}
      title={playing ? `Pause "${title}" by ${artist}` : `Play "${title}" by ${artist}`}
    >
      {isLoading ? (
        <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : playing ? (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4l14 8-14 8V4z" />
        </svg>
      )}
    </button>
  );
};