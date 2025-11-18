// src/components/AddToPlaylistModal.tsx
import { useEffect } from 'react';
import type { Playlist } from '@/types/playlist';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: string;
  playlists: Playlist[];
  onTogglePlaylist: (playlistId: string, add: boolean) => void;
  onCreateNewPlaylist: () => void;
};

export const AddToPlaylistModal = ({
  open,
  onOpenChange,
  songId,
  playlists,
  onTogglePlaylist,
  onCreateNewPlaylist,
}: Props) => {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  const playlistsContainingSong = playlists.filter(p => p.songs.some(s => s.id === songId));
  const songInPlaylistIds = new Set(playlistsContainingSong.map(p => p.id));

  const handleToggle = (playlistId: string) => {
    const isCurrentlyInPlaylist = songInPlaylistIds.has(playlistId);
    onTogglePlaylist(playlistId, !isCurrentlyInPlaylist);
  };

  const handleCreateNew = () => {
    onOpenChange(false);
    onCreateNewPlaylist();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
      >
        {/* Modal */}
        <div
          className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-md flex flex-col"
          style={{ maxHeight: '80vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">Add to Playlist</h2>
              {playlistsContainingSong.length > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white">
                  In {playlistsContainingSong.length}
                </span>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {playlists.length === 0 ? (
              // Empty state
              <div className="px-6 py-8 text-center">
                <div className="text-4xl mb-3">🎵</div>
                <p className="text-sm text-gray-400 mb-4">No playlists yet</p>
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Create Your First Playlist</span>
                </button>
              </div>
            ) : (
              <>
                {/* Just green + icon with native tooltip */}
                <div className="px-6 pt-4 pb-2">
                  <button
                    onClick={handleCreateNew}
                    className="p-0 bg-transparent hover:opacity-80 transition-opacity"
                    title="Create New Playlist"
                  >
                    {/* Just the green + icon */}
                    <svg 
                      className="w-6 h-6 text-emerald-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Playlist list */}
                <div className="px-6 pb-4 space-y-2">
                  {playlists.map((playlist) => {
                    const isInPlaylist = songInPlaylistIds.has(playlist.id);
                    const { songCount, syncBadge } = getPlaylistInfo(playlist);

                    return (
                      <button
                        key={playlist.id}
                        onClick={() => handleToggle(playlist.id)}
                        className="w-full px-4 py-3 flex items-center gap-3 rounded-lg hover:bg-gray-700 transition-colors text-left border border-gray-700"
                      >
                        {/* Checkmark */}
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                          {isInPlaylist ? (
                            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded border-2 border-gray-600" />
                          )}
                        </div>

                        {/* Playlist info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {playlist.name}
                            </p>
                            {syncBadge}
                          </div>
                          <p className="text-xs text-gray-400">
                            {songCount} song{songCount !== 1 ? 's' : ''}
                            {playlist.isPublic ? ' · Public' : ' · Private'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

function getPlaylistInfo(playlist: Playlist) {
  const songCount = playlist.songs.length;
  
  const syncBadge = playlist.synced ? (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-600 text-white">
      ✓
    </span>
  ) : null;

  return { songCount, syncBadge };
}
