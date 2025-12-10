// src/components/ImportYouTubePlaylistModal.tsx
/**
 * Import YouTube Playlist Modal
 * 
 * Allows users to:
 * 1. View their YouTube playlists
 * 2. Select a playlist to import
 * 3. See import progress
 * 4. View import results (success rate, failed songs)
 * 5. Save the imported playlist to Fonea
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { youtubeAuth } from '@/services/youtubeAuth';
import { 
  getUserYouTubePlaylists, 
  importYouTubePlaylistToFonea 
} from '@/services/youtubePlaylistService';
import type { ImportProgress } from '@/services/export/types';
import type { Playlist } from '@/types/playlist';

interface YouTubePlaylistInfo {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  thumbnailUrl?: string;
  isPublic: boolean;
  url: string;
  createdAt: string;
}

interface ImportYouTubePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistImported: (playlist: Playlist) => void;
}

type ViewState = 'list' | 'importing' | 'results';

export function ImportYouTubePlaylistModal({
  isOpen,
  onClose,
  onPlaylistImported,
}: ImportYouTubePlaylistModalProps) {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [playlists, setPlaylists] = useState<YouTubePlaylistInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Import state
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importedPlaylist, setImportedPlaylist] = useState<Playlist | null>(null);
  const [importStats, setImportStats] = useState<{
    successRate: number;
    successful: number;
    failed: number;
    duration: number;
  } | null>(null);

  // Load playlists when modal opens
  useEffect(() => {
    if (isOpen && viewState === 'list') {
      loadPlaylists();
    }
  }, [isOpen, viewState]);

  const loadPlaylists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if authenticated
      const isAuthenticated = await youtubeAuth.isAuthenticated();
      
      if (!isAuthenticated) {
        setError('Please log in to YouTube first');
        setLoading(false);
        return;
      }

      // Fetch playlists
      const fetchedPlaylists = await getUserYouTubePlaylists();
      setPlaylists(fetchedPlaylists);
      
      if (fetchedPlaylists.length === 0) {
        setError('No playlists found in your YouTube account');
      }
    } catch (err) {
      console.error('Failed to load YouTube playlists:', err);
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
      toast.error('Failed to load YouTube playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleImportPlaylist = async (playlistId: string) => {
    setViewState('importing');
    setImportProgress({ stage: 'fetching_playlist', current: 0, total: 1, message: 'Starting import...' });

    try {
      const { playlist, metadata, statistics } = await importYouTubePlaylistToFonea(
        playlistId,
        (progress: ImportProgress) => {
          setImportProgress(progress);
        }
      );

      // Success!
      setImportedPlaylist(playlist);
      setImportStats({
        successRate: (statistics.successful / metadata.itemCount) * 100,
        successful: statistics.successful,
        failed: statistics.failed,
        duration: statistics.duration,
      });
      setViewState('results');

      toast.success(`Imported "${playlist.name}"`, {
        description: `${statistics.successful} songs imported successfully`,
      });
    } catch (err) {
      console.error('Import failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      toast.error('Import failed', { description: errorMessage });
      setViewState('list');
    }
  };

  const handleSavePlaylist = () => {
    if (importedPlaylist) {
      onPlaylistImported(importedPlaylist);
      toast.success('Playlist added to Fonea');
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset state
    setViewState('list');
    setImportProgress(null);
    setImportedPlaylist(null);
    setImportStats(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4"
        onClick={viewState === 'list' ? handleClose : undefined}
      >
        {/* Modal */}
        <div
          className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-red-600">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Import from YouTube</span>
            </h2>
            <button
              onClick={handleClose}
              disabled={viewState === 'importing'}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* LIST VIEW */}
            {viewState === 'list' && (
              <div className="p-6">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                    <p className="text-gray-400">Loading your YouTube playlists...</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {!loading && !error && playlists.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400 mb-4">
                      Select a playlist to import ({playlists.length} playlists found)
                    </p>
                    
                    {playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => handleImportPlaylist(playlist.id)}
                        className="w-full p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors text-left group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            {playlist.thumbnailUrl ? (
                              <img 
                                src={playlist.thumbnailUrl} 
                                alt={playlist.name}
                                className="w-16 h-16 rounded object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-gray-600">
                                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                                {playlist.name}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Song count */}
                                <span className="px-2 py-1 bg-gray-800 rounded text-xs font-medium text-gray-300">
                                  {playlist.itemCount} {playlist.itemCount === 1 ? 'song' : 'songs'}
                                </span>
                                {/* Public/Private badge */}
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  playlist.isPublic 
                                    ? 'bg-emerald-900/30 text-emerald-400' 
                                    : 'bg-gray-800 text-gray-400'
                                }`}>
                                  {playlist.isPublic ? '🌐 Public' : '🔒 Private'}
                                </span>
                              </div>
                            </div>
                            
                            {playlist.description && (
                              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                {playlist.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!loading && !error && playlists.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">No playlists found</p>
                    <button
                      onClick={loadPlaylists}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* IMPORTING VIEW */}
            {viewState === 'importing' && importProgress && (
              <div className="p-6">
                <div className="flex flex-col items-center justify-center py-12">
                  {/* Animated icon */}
                  <div className="relative mb-6">
                    <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-red-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 fill-red-600">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Stage indicator */}
                  <div className="w-full max-w-md mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span className="capitalize">{importProgress.stage.replace(/_/g, ' ')}</span>
                      <span>{importProgress.current} / {importProgress.total}</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-red-600 h-full transition-all duration-300 ease-out"
                        style={{ 
                          width: `${Math.min((importProgress.current / importProgress.total) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-white font-medium text-center">{importProgress.message}</p>
                  <p className="text-gray-400 text-sm mt-2">This may take a few moments...</p>
                </div>
              </div>
            )}

            {/* RESULTS VIEW */}
            {viewState === 'results' && importedPlaylist && importStats && (
              <div className="p-6">
                {/* Success header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="p-4 bg-emerald-900/20 rounded-full">
                      <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Import Complete!
                  </h3>
                  <p className="text-gray-400">
                    "{importedPlaylist.name}"
                  </p>
                </div>

                {/* Stats */}
                <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-white mb-1">
                      {importStats.successRate.toFixed(0)}%
                    </div>
                    <p className="text-sm text-gray-300">Success Rate</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400">
                        ✓ {importStats.successful}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Imported</p>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400">
                        ✗ {importStats.failed}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Failed</p>
                    </div>

                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        🕐 {(importStats.duration / 1000).toFixed(1)}s
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Duration</p>
                    </div>
                  </div>
                </div>

                {/* Platform info */}
                <div className="mb-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">YouTube Playlist</h4>
                  <a
                    href={importedPlaylist.platformPlaylists?.youtube?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 text-sm break-all"
                  >
                    {importedPlaylist.platformPlaylists?.youtube?.url}
                  </a>
                </div>

                {/* Info boxes */}
                <div className="space-y-3 mb-6">
                  {importStats.failed > 0 && (
                    <div className="p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                      <p className="text-orange-300 text-sm">
                        ⚠️ {importStats.failed} song{importStats.failed !== 1 ? 's' : ''} could not be imported 
                        (likely deleted or private videos)
                      </p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      💡 The playlist is now in your Fonea library. You can edit, export to Spotify, or get AI recommendations!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-900 border-t border-gray-700 flex-shrink-0">
            {viewState === 'list' && (
              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={loadPlaylists}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {viewState === 'importing' && (
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Please wait while we import your playlist...
                </p>
              </div>
            )}

            {viewState === 'results' && (
              <div className="flex gap-3">
                <button
                  onClick={handleSavePlaylist}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium"
                >
                  ✓ Add to Fonea
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
