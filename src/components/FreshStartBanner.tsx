// src/components/FreshStartBanner.tsx
/**
 * Banner that appears in chat when GPT suggests starting fresh
 * Provides quick action to clear library
 */

import type { Song } from '@/types/song';
import type { Playlist } from '@/types/playlist';
import { getLibraryStats } from '@/utils/libraryHelpers';

type Props = {
  songs: Song[];
  playlists: Playlist[];
  onClearLibrary: () => void;
};

export function FreshStartBanner({ songs, playlists, onClearLibrary }: Props) {
  const stats = getLibraryStats(songs);
  
  // Calculate orphaned songs
  const songsInPlaylists = new Set<string>();
  playlists.forEach(playlist => {
    playlist.songs.forEach(song => {
      songsInPlaylists.add(song.id);
    });
  });
  const orphanedKept = songs.filter(
    s => s.feedback === 'keep' && !songsInPlaylists.has(s.id)
  ).length;

  return (
    <div className="p-4 bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-600/50 rounded-lg">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white mb-1">
            Ready for a Fresh Start?
          </h3>
          <p className="text-sm text-gray-300 mb-2">
            GPT suggested starting fresh. Here's your current library status:
          </p>
        </div>
      </div>

      {/* Library Stats */}
      <div className="bg-gray-900/50 rounded-lg p-3 mb-3 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Total songs:</span>
          <span className="text-white font-medium">{stats.total}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Kept songs:</span>
          <span className="text-emerald-400 font-medium">{stats.kept}</span>
        </div>
        {orphanedKept > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-amber-400">Not in playlists:</span>
            <span className="text-amber-400 font-medium">{orphanedKept}</span>
          </div>
        )}
      </div>

      {/* Action */}
      <button
        onClick={onClearLibrary}
        className="w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2"
      >
        <span>🗑️</span>
        <span>Clear Library & Start Fresh</span>
      </button>

      <p className="text-xs text-gray-500 text-center mt-2">
        Songs in playlists will be kept • 10-minute undo available
      </p>
    </div>
  );
}
