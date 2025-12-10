// src/components/PlaylistBadges.tsx
/**
 * Platform Export Badges
 * Shows export status for Spotify, YouTube, etc.
 * Used in PlaylistDetailModal and PlaylistsDrawer
 */

import type { Playlist } from '@/types/playlist';

interface PlaylistBadgesProps {
  playlist: Playlist;
  variant?: 'full' | 'compact'; // full = con labels, compact = solo dots
  onSpotifyClick?: () => void;
  onYouTubeClick?: () => void;
  showLabel?: boolean;
}

export function PlaylistBadges({
  playlist,
  variant = 'full',
  onSpotifyClick,
  onYouTubeClick,
  showLabel = true,
}: PlaylistBadgesProps) {
  const hasSpotify = !!playlist.spotifyUrl;
  const hasYouTube = !!playlist.platformPlaylists?.youtube?.id;

  if (variant === 'compact') {
    // Dots pequeños para lista (PlaylistsDrawer)
    return (
      <div className="flex gap-1.5" title="Exported to platforms">
        {hasSpotify && (
          <div 
            className="w-2 h-2 rounded-full bg-emerald-500" 
            title="On Spotify"
          />
        )}
        {hasYouTube && (
          <div 
            className="w-2 h-2 rounded-full bg-red-500" 
            title="On YouTube"
          />
        )}
        {!hasSpotify && !hasYouTube && (
          <div className="w-2 h-2 rounded-full bg-gray-600" title="Not exported" />
        )}
      </div>
    );
  }

  // Full badges para modal de detalles
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showLabel && (
        <span className="text-sm text-gray-400 font-medium">Export to:</span>
      )}
      
      {/* Spotify badge */}
      <button
        onClick={onSpotifyClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          hasSpotify
            ? 'bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700'
            : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-emerald-600 hover:text-emerald-400'
        }`}
        title={hasSpotify ? 'Synced to Spotify' : 'Export to Spotify'}
      >
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 inline mr-1.5 fill-current ${hasSpotify ? '' : 'text-emerald-500'}`}>
          <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
        </svg>
        <span>{hasSpotify ? 'Spotify' : 'Spotify'}</span>
      </button>
      
      {/* YouTube badge */}
      <button
        onClick={onYouTubeClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          hasYouTube
            ? 'bg-gray-800 text-gray-100 border-2 border-red-600/50 hover:border-red-600/70'
            : 'bg-gray-800 text-gray-400 border border-gray-600 hover:border-gray-500 hover:text-gray-200'
        }`}
        title={hasYouTube ? 'Synced to YouTube' : 'Export to YouTube'}
      >
        {/* Logo de YouTube con fondo rojo y play blanco (negativo) */}
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 mr-1.5 bg-red-600 rounded-sm">
          <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white">
            <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </span>
        <span>{hasYouTube ? 'YouTube' : 'YouTube'}</span>
      </button>
    </div>
  );
}
