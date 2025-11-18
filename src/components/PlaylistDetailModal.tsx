// src/components/PlaylistDetailModal.tsx
/**
 * Modal for viewing and managing songs in a playlist
 * Shows all songs with ability to remove them
 * 
 * SIMPLIFIED: Songs are now stored directly in playlists (no lookup needed!)
 */

import { useEffect } from 'react';
import type { Playlist } from '@/types/playlist';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist | null;
  onRemoveSong: (playlistId: string, songId: string) => void;
};

export const PlaylistDetailModal = ({
  open,
  onOpenChange,
  playlist,
  onRemoveSong,
}: Props) => {
  // Close on Escape key - with stopPropagation to prevent drawer from closing
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // CRITICAL: Stop drawer from seeing this!
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Calculate total duration
  const getTotalDuration = () => {
    if (!playlist) return null;

    const totalSeconds = playlist.songs.reduce((acc, song) => {
      if (song.durationMs) return acc + Math.floor(song.durationMs / 1000);
      if (song.duration) return acc + song.duration;
      return acc;
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else if (totalSeconds > 0) {
      return `<1m`;
    }
    return null;
  };

  const handleRemove = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation(); // CRITICAL: Prevent click from bubbling up
    
    if (!playlist) return;
    
    const song = playlist.songs.find(s => s.id === songId);
    const songName = song ? `"${song.title}" by ${song.artist}` : 'this song';
    
    if (window.confirm(
      `Remove ${songName} from "${playlist.name}"?\n\n` +
      `The song will stay in your library.`
    )) {
      onRemoveSong(playlist.id, songId);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!open || !playlist) return null;

  const totalDuration = getTotalDuration();
  const songCount = playlist.songs.length;
  const hasAnySongs = songCount > 0;

  return (
    <>
      {/* Backdrop - higher z-index than drawer */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(false);
        }}
      >
        {/* Modal */}
        <div
          className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col"
          style={{ maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gray-900 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white truncate">
                  {playlist.name}
                </h2>
                {playlist.synced && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white flex-shrink-0">
                    <span>✓</span>
                    <span>Synced</span>
                  </span>
                )}
              </div>
              
              {playlist.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {playlist.description}
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                <span>
                  {songCount} song{songCount !== 1 ? 's' : ''}
                </span>
                {totalDuration && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span>{totalDuration}</span>
                  </>
                )}
                <span className="text-gray-600">·</span>
                <span>{playlist.isPublic ? '🌐 Public' : '🔒 Private'}</span>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {!hasAnySongs ? (
              // Empty state
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-lg font-bold text-white mb-2">This playlist is empty</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Add songs from your library using the "Add to Playlist" button on any Keep song.
                </p>
              </div>
            ) : (
              <div className="px-6 py-4 space-y-3">
                {/* Songs */}
                {playlist.songs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-gray-700 hover:bg-gray-650 transition-colors border border-gray-600"
                  >
                    {/* Album art */}
                    {song.albumArtUrl ? (
                      <img
                        src={song.albumArtUrl}
                        alt={`${song.title} album cover`}
                        className="w-16 h-16 rounded-lg object-cover shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🎵</span>
                      </div>
                    )}

                    {/* Song info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-white truncate">
                        {song.title}
                      </h4>
                      <p className="text-sm text-gray-300 truncate">
                        {song.artist}
                        {song.album && (
                          <>
                            <span className="text-gray-500 mx-1">·</span>
                            <span className="text-gray-400">{song.album}</span>
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {song.verificationStatus === 'verified' && (
                          <span className="text-xs text-emerald-400">✓ Verified</span>
                        )}
                        {song.duration && (
                          <>
                            {song.verificationStatus === 'verified' && (
                              <span className="text-gray-600 text-xs">·</span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatDuration(song.duration)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemove(e, song.id)}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
                      title="Remove from playlist"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Spotify link if available */}
          {playlist.spotifyUrl && (
            <div className="px-6 py-4 bg-gray-900 border-t border-gray-700 flex-shrink-0">
              <a
                href={playlist.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block w-full px-4 py-3 rounded-lg bg-[#1DB954] text-white text-sm font-medium hover:bg-[#1ed760] transition-colors text-center inline-flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
                </svg>
                <span>Open in Spotify</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
