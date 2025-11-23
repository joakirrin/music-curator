// src/components/PlaylistsDrawer.tsx
import { useEffect, useRef, useState } from 'react';
import type { Playlist } from '@/types/playlist';
import type { Song } from '@/types/song';
import { formatDistanceToNow } from 'date-fns';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { PushPlaylistModal } from './PushPlaylistModal';
import { spotifyAuth } from '@/services/spotifyAuth';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlists: Playlist[];
  onDeletePlaylist: (id: string) => void;
  onOpenCreatePlaylist: () => void;
  onRemoveSongFromPlaylist: (playlistId: string, songId: string) => void;
  onMarkAsSynced: (playlistId: string, spotifyPlaylistId: string, spotifyUrl: string) => void;
  onUpdatePlaylistSongs: (playlistId: string, updatedSongs: Song[]) => void;  // ← AGREGAR
};

export const PlaylistsDrawer = ({
  open,
  onOpenChange,
  playlists,
  onDeletePlaylist,
  onOpenCreatePlaylist,
  onRemoveSongFromPlaylist,
  onMarkAsSynced,
  onUpdatePlaylistSongs,  // ← AGREGAR
}: Props) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  
  // State for playlist detail modal
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // State for push to Spotify modal
  const [playlistToPush, setPlaylistToPush] = useState<string | null>(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  // CRITICAL FIX: Reset modal state when drawer closes
  useEffect(() => {
    if (!open) {
      setIsDetailModalOpen(false);
      setSelectedPlaylistId(null);
      setIsPushModalOpen(false);
      setPlaylistToPush(null);
    }
  }, [open]);

  // Close on Escape key - but only if modals are not open
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDetailModalOpen && !isPushModalOpen) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, isDetailModalOpen, isPushModalOpen, onOpenChange]);

  // Click outside to close - but NOT if modals are open
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      // CRITICAL: Don't close drawer if modals are open!
      if (isDetailModalOpen || isPushModalOpen) return;
      
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, isDetailModalOpen, isPushModalOpen, onOpenChange]);

  const getPlaylistStats = (playlist: Playlist) => {
    const songCount = playlist.songs.length;
    
    const totalSeconds = playlist.songs.reduce((acc, song) => {
      if (song.durationMs) return acc + Math.floor(song.durationMs / 1000);
      if (song.duration) return acc + song.duration;
      return acc;
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    let durationText = '';
    if (hours > 0) {
      durationText = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      durationText = `${minutes}m`;
    } else if (totalSeconds > 0) {
      durationText = `<1m`;
    }

    return { songCount, durationText };
  };

  const formatTimestamp = (isoString: string) => {
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const handleDelete = (e: React.MouseEvent, playlist: Playlist) => {
    e.stopPropagation(); // Prevent opening modal
    
    if (window.confirm(
      `⚠️ Delete playlist "${playlist.name}"?\n\n` +
      `This will NOT delete songs from your library.\n` +
      (playlist.synced ? `The playlist will remain on Spotify.` : '')
    )) {
      onDeletePlaylist(playlist.id);
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setIsDetailModalOpen(true);
  };

const handlePushToSpotify = async (e: React.MouseEvent, playlistId: string) => {
  e.stopPropagation(); // Prevent opening detail modal
  
  // Check if user is logged in to Spotify
  const token = await spotifyAuth.getAccessToken();
  
  if (!token) {
    // Not logged in → redirect to Spotify login
    const confirmLogin = window.confirm(
      '🔐 Login to Spotify required\n\n' +
      'You need to connect your Spotify account to export playlists.\n\n' +
      'Click OK to login now.'
    );
    
    if (confirmLogin) {
      await spotifyAuth.login();
    }
    return;
  }
  
  // User is logged in → proceed with export
  setPlaylistToPush(playlistId);
  setIsPushModalOpen(true);
};

  const handlePushSuccess = (playlistId: string, spotifyPlaylistId: string, spotifyUrl: string) => {
    onMarkAsSynced(playlistId, spotifyPlaylistId, spotifyUrl);
    setIsPushModalOpen(false);
    setPlaylistToPush(null);
  };

  const selectedPlaylist = selectedPlaylistId 
    ? playlists.find(p => p.id === selectedPlaylistId) || null 
    : null;
    
  const playlistToPushObj = playlistToPush
    ? playlists.find(p => p.id === playlistToPush) || null
    : null;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0 }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px] bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <h2 className="text-xl font-bold text-white">Your Playlists</h2>
              <p className="text-sm text-gray-400">
                {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Warning */}
        <div className="px-6 py-3 bg-amber-900/20 border-b border-amber-700/30">
          <p className="text-xs text-amber-400 flex items-start gap-2">
            <span>⚠️</span>
            <span>
              Songs in playlists are saved permanently. Even if deleted from library, they stay in playlists!
            </span>
          </p>
        </div>

        {/* Create Playlist button at top */}
        <div className="px-6 py-4 border-b border-gray-700">
          <button
            onClick={onOpenCreatePlaylist}
            className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-3 shadow-lg"
          >
            <span className="text-2xl">➕</span>
            <span>Create New Playlist</span>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {playlists.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-bold text-white mb-2">No playlists yet</h3>
              <p className="text-gray-400 mb-6 max-w-sm">
                Start organizing your music by creating your first playlist!
              </p>
              <button
                onClick={onOpenCreatePlaylist}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
              >
                <span>➕</span>
                <span>Create Your First Playlist</span>
              </button>
            </div>
          ) : (
            // Playlist cards grid
            <div className="grid grid-cols-1 gap-4">
              {playlists.map((playlist) => {
                const { songCount, durationText } = getPlaylistStats(playlist);
                
                return (
                  <div
                    key={playlist.id}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => handlePlaylistClick(playlist.id)}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">
                          {playlist.name}
                        </h3>
                        {playlist.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                            {playlist.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Sync status badge */}
                      <div className="ml-3 flex-shrink-0">
                        {playlist.synced ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white">
                            <span>✓</span>
                            <span>Synced</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                            <span>📱</span>
                            <span>Local</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <span>🎵</span>
                        <span>{songCount} song{songCount !== 1 ? 's' : ''}</span>
                      </span>
                      
                      {durationText && (
                        <>
                          <span className="text-gray-600">·</span>
                          <span className="flex items-center gap-1">
                            <span>⏱️</span>
                            <span>{durationText}</span>
                          </span>
                        </>
                      )}
                      
                      <span className="text-gray-600">·</span>
                      
                      <span className="flex items-center gap-1">
                        {playlist.isPublic ? (
                          <>
                            <span>🌐</span>
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <span>🔒</span>
                            <span>Private</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Created timestamp */}
                    <p className="text-xs text-gray-500 mb-4">
                      Created {formatTimestamp(playlist.createdAt)}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {playlist.synced && playlist.spotifyUrl ? (
                        // Already synced - show link to Spotify
                        <a
                          href={playlist.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-4 py-2 rounded-lg bg-[#1DB954] text-white text-sm font-medium hover:bg-[#1ed760] transition-colors text-center inline-flex items-center justify-center gap-2"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                            <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
                          </svg>
                          <span>Open in Spotify</span>
                        </a>
                      ) : (
                        // Not synced yet - show push button
                        <button
                          onClick={(e) => handlePushToSpotify(e, playlist.id)}
                          disabled={songCount === 0}
                          className="flex-1 px-4 py-2 rounded-lg bg-[#1DB954] text-white text-sm font-medium hover:bg-[#1ed760] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                            <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
                          </svg>
                          <span>Push to Spotify</span>
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => handleDelete(e, playlist)}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                        title="Delete playlist"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Playlist Detail Modal */}
      <PlaylistDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        playlist={selectedPlaylist}
        onRemoveSong={onRemoveSongFromPlaylist}
      />
      
      {/* Push to Spotify Modal */}
        <PushPlaylistModal
        open={isPushModalOpen}
        onOpenChange={setIsPushModalOpen}
        playlist={playlistToPushObj}
        onSuccess={handlePushSuccess}
        onUpdatePlaylistSongs={onUpdatePlaylistSongs} 
/>
    </>
  );
};
