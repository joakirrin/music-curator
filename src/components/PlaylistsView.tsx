// src/components/PlaylistsView.tsx
/**
 * Simple view to display all playlists
 * Shows playlist cards with name, song count, and sync status
 */

import type { Playlist } from "../types/playlist";

type Props = {
  playlists: Playlist[];
  onDeletePlaylist: (id: string) => void;
};

export function PlaylistsView({ playlists, onDeletePlaylist }: Props) {
  // Calculate total duration for a playlist (in minutes)
  const getTotalDuration = (playlist: Playlist): number => {
    const totalSeconds = playlist.songs.reduce((sum, song) => sum + (song.duration || 0), 0);
    return Math.round(totalSeconds / 60);
  };

  const handleDelete = (playlist: Playlist) => {
    const songCount = playlist.songs.length;
    const message = playlist.synced
      ? `⚠️ Delete "${playlist.name}"?\n\nThis has ${songCount} song${songCount !== 1 ? 's' : ''}.\n\nNote: This will only delete the local copy. The playlist will remain on Spotify.`
      : `⚠️ Delete "${playlist.name}"?\n\nThis has ${songCount} song${songCount !== 1 ? 's' : ''} and is not synced to Spotify.\n\nThis cannot be undone!`;
    
    if (window.confirm(message)) {
      onDeletePlaylist(playlist.id);
    }
  };

  if (playlists.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-4">📁</div>
        <div className="text-lg font-medium text-gray-300 mb-2">
          No playlists yet
        </div>
        <div className="text-sm text-gray-400">
          Click "Create Playlist" in the toolbar to get started!
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Your Playlists ({playlists.length})
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map(playlist => {
          const duration = getTotalDuration(playlist);

          return (
            <div
              key={playlist.id}
              className="bg-gray-700 border border-gray-600 rounded-xl p-4 hover:bg-gray-650 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </div>
                
                {playlist.synced ? (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs bg-emerald-600 text-white flex-shrink-0">
                    🟢 Synced
                  </span>
                ) : (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs bg-gray-600 text-gray-300 flex-shrink-0">
                    ⚠️ Local
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span>🎵</span>
                  <span>{playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}</span>
                </div>
                
                {duration > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>⏱️</span>
                    <span>{duration} min</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{playlist.isPublic ? "🌐 Public" : "🔒 Private"}</span>
                </div>
              </div>

              {playlist.spotifyUrl && (
                <a
                  href={playlist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-3 text-sm text-emerald-400 hover:text-emerald-300 underline"
                >
                  🔗 Open on Spotify
                </a>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(playlist)}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                
                <button
                  disabled
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-600 text-gray-400 text-sm cursor-not-allowed"
                  title="Coming soon!"
                >
                  Edit
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Created {new Date(playlist.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
