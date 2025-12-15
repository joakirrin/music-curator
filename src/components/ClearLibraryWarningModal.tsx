// src/components/ClearLibraryWarningModal.tsx
/**
 * Smart modal that warns about orphaned kept songs before clearing library
 * Offers quick-save option to prevent data loss
 */

import { useState } from 'react';
import type { Song } from '@/types/song';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orphanedSongs: Song[];
  onContinue: () => void;
  onQuickSave: (playlistName: string) => void;
};

export function ClearLibraryWarningModal({
  open,
  onOpenChange,
  orphanedSongs,
  onContinue,
  onQuickSave,
}: Props) {
  const [playlistName, setPlaylistName] = useState('');
  const [showQuickSave, setShowQuickSave] = useState(false);

  if (!open) return null;

  const handleQuickSave = () => {
    const name = playlistName.trim();
    if (!name) {
      alert('Please enter a playlist name');
      return;
    }
    onQuickSave(name);
    onOpenChange(false);
  };

  const handleContinue = () => {
    onContinue();
    onOpenChange(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(false);
        }}
      >
        {/* Modal */}
        <div
          className="bg-gray-800 border border-amber-600 rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
          style={{ maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-amber-900/20 border-b border-amber-700/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h2 className="text-xl font-bold text-white">Save Your Work?</h2>
                <p className="text-sm text-amber-200 mt-1">
                  {orphanedSongs.length} kept song{orphanedSongs.length !== 1 ? 's' : ''} not in any playlist
                </p>
              </div>
            </div>
            
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <p className="text-sm text-gray-300 mb-4">
              These songs will be permanently deleted when you clear the library:
            </p>

            {/* Orphaned songs list */}
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {orphanedSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg"
                >
                  {song.albumArtUrl ? (
                    <img
                      src={song.albumArtUrl}
                      alt=""
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🎵</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {song.title}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {song.artist}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Save Section */}
            {!showQuickSave ? (
              <button
                onClick={() => setShowQuickSave(true)}
                className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2 mb-3"
              >
                <span>📚</span>
                <span>Quick Save to Playlist</span>
              </button>
            ) : (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Playlist name:
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="e.g., Backup - Dec 15"
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickSave();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleQuickSave}
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Save & Continue
                  </button>
                  <button
                    onClick={() => {
                      setShowQuickSave(false);
                      setPlaylistName('');
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 font-medium hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
              <p className="text-xs text-gray-400">
                💡 <strong className="text-gray-300">Tip:</strong> You'll have 10 minutes to undo this action and restore all songs.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              Clear Anyway
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
