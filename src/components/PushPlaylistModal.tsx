// FILE: src/components/PushPlaylistModal.tsx (MODIFIED)

import { useState, useEffect } from 'react';
import type { Playlist } from '@/types/playlist';
// NEW: Import the formatter, features, and new PushResult type
import { pushPlaylistToSpotify, type PushResult } from '@/services/spotifyPlaylistService';
import { formatPlaylistDescription } from '@/utils/formatters';
import { FEATURES } from '@/config/features';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist | null;
  onSuccess: (playlistId: string, spotifyPlaylistId: string, spotifyUrl: string) => void;
};

// NEW: Updated stage for resolving
type Stage = 'confirm' | 'pushing' | 'success' | 'error';

export const PushPlaylistModal = ({
  open,
  onOpenChange,
  playlist,
  onSuccess,
}: Props) => {
  const [stage, setStage] = useState<Stage>('confirm');
  const [_progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<PushResult | null>(null);
  
  // NEW: State for the playlist description
  const [description, setDescription] = useState(playlist?.description || '');

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStage('confirm');
      setProgress(0);
      setProgressMessage('');
      setResult(null);
      // NEW: Reset description to match the playlist
      setDescription(playlist?.description || '');
    }
  }, [open, playlist]);

  const handlePush = async () => {
    if (!playlist) return;

    setStage('pushing');
    setProgress(0);

    // NEW: Create an updated playlist object with the new description
    const playlistToPush: Playlist = {
      ...playlist,
      description: description,
    };

    const result = await pushPlaylistToSpotify(playlistToPush, (progressUpdate) => {
      setProgress(progressUpdate.current);
      setProgressMessage(progressUpdate.message);
      // NEW: Update stage based on progress
      if (progressUpdate.stage === 'resolving') {
        setProgressMessage(progressUpdate.message);
      }
    });

    setResult(result);

    if (result.success && result.playlistId && result.playlistUrl) {
      setStage('success');
      onSuccess(playlist.id, result.playlistId, result.playlistUrl);
    } else {
      setStage('error');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // MODIFIED: This logic is now simpler, as the resolver handles it.
  // We just show a summary.
  const songsWithDirectLink = playlist?.songs.filter(song => {
      // This logic checks for any existing ID (Tier 1)
      const hasPlatformId = !!song.platformIds?.spotify?.id;
      const hasLegacyId = 
        song.serviceUri?.startsWith('spotify:') || //
        song.spotifyUri?.startsWith('spotify:') || //
        !!song.serviceId || //
        !!song.spotifyId; //
      return hasPlatformId || hasLegacyId;
  }) || [];

  const songsToBeSearched = (playlist?.songs.length || 0) - songsWithDirectLink.length;

  if (!open || !playlist) return null;

  // NEW: Get the formatted description for the preview
  const previewDescription = formatPlaylistDescription(description);

  return (
    <>
      {/* Backdrop (unchanged) */}
      <div 
        className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
        onClick={stage === 'confirm' || stage === 'success' || stage === 'error' ? handleClose : undefined}
      >
        {/* Modal (unchanged) */}
        <div
          className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-md flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (MODIFIED to include resolving) */}
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold text-white">
              {stage === 'confirm' && 'Export to Spotify'}
              {stage === 'pushing' && 'Exporting to Spotify...'}
              {stage === 'success' && '✅ Playlist Exported'}
              {stage === 'error' && '❌ Error'}
            </h2>
            {/* ... (close button unchanged) ... */}
          </div>

          {/* Content */}
          <div className="px-6 py-6 flex-1 overflow-y-auto">
            
            {/* Confirm Stage (HEAVILY MODIFIED for Tasks 4.5.1 & 4.5.2) */}
            {stage === 'confirm' && (
              <div className="space-y-4">
                <p className="text-white text-lg font-medium">
                  "{playlist.name}"
                </p>

                {/* NEW: Description Input */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-300">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="My favorite tracks for beach days..."
                  />
                </div>

                {/* NEW: Branding Preview */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Preview
                  </label>
                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-700 text-sm text-gray-400 whitespace-pre-wrap">
                    {previewDescription}
                  </div>
                  {FEATURES.BRANDING_ON_EXPORT.enabled && !FEATURES.BRANDING_ON_EXPORT.removable && (
                    <p className="text-xs text-gray-500 text-center">
                      ℹ️ Branding can be removed with Premium (coming soon)
                    </p>
                  )}
                </div>

                {/* MODIFIED: Export Summary */}
                <div className="p-4 bg-gray-700 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Total songs:</span>
                    <span className="text-white font-medium">{playlist.songs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Found directly (Tier 1):</span>
                    <span className="text-emerald-400 font-medium">
                      {songsWithDirectLink.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">To be searched (Tier 2/3):</span>
                    <span className="text-orange-400 font-medium">
                      {songsToBeSearched}
                    </span>
                  </div>
                </div>

                {songsToBeSearched > 0 && (
                  <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <p className="text-xs text-blue-300">
                      ℹ️ The {songsToBeSearched} song{songsToBeSearched !== 1 ? 's' : ''} will be found using a smart search. This may take a moment.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePush}
                    // MODIFIED: Only disable if there are no songs at all
                    disabled={playlist.songs.length === 0}
                    className="flex-1 px-4 py-3 rounded-lg bg-[#1DB954] text-white hover:bg-[#1ed760] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center justify-center gap-2"
                  >
                    {/* ... (spotify icon unchanged) ... */}
                    <span>Export to Spotify</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pushing Stage (MODIFIED to show new messages) */}
            {stage === 'pushing' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl mb-4 animate-bounce">🎵</div>
                  <p className="text-white text-lg font-medium mb-2">
                    Exporting your playlist...
                  </p>
                  <p className="text-gray-400 text-sm">
                    {progressMessage || 'Initializing...'}
                  </p>
                </div>
                {/* ... (progress bar unchanged) ... */}
              </div>
            )}

            {/* Success Stage (MODIFIED for new ExportReport) */}
            {stage === 'success' && result && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-white text-xl font-bold mb-2">
                    Export Successful!
                  </p>
                  <p className="text-gray-400 text-sm">
                    "{playlist.name}" is now on Spotify
                  </p>
                </div>

                {/* NEW: Detailed Export Summary */}
                <div className="p-4 bg-gray-700 rounded-lg space-y-2 text-sm">
                  <h3 className="text-white font-medium mb-2">📊 Export Summary</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Total songs:</span>
                    <span className="text-white font-medium">{result.totalSongs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Successfully added:</span>
                    <span className="text-emerald-400 font-medium">
                      {result.successful.total} ({result.statistics.successRate.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="pl-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">• Direct links (Tier 1):</span>
                      <span className="text-gray-300">{result.successful.direct}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">• Smart search (Tier 2/3):</span>
                      <span className="text-gray-300">{result.successful.softSearch + result.successful.hardSearch}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Not available:</span>
                    <span className="text-orange-400 font-medium">{result.failed.count}</span>
                  </div>
                </div>

                {result.failed.count > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-orange-400 hover:text-orange-300 font-medium">
                      ⚠️ View songs not found ({result.failed.count})
                    </summary>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {result.failed.songs.map((item, idx) => (
                        <div key={idx} className="p-2 bg-orange-900/20 rounded text-xs text-orange-300">
                          {item.song.artist} - {item.song.title}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                {/* ... (buttons unchanged) ... */}
              </div>
            )}

            {/* Error Stage (Unchanged, but error messages will be better) */}
            {stage === 'error' && result && (
              // ... (this JSX is unchanged)
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl mb-4">😞</div>
                  <p className="text-white text-lg font-medium mb-2">
                    Something went wrong
                  </p>
                  <p className="text-gray-400 text-sm">
                    {result.error || 'Failed to push playlist to Spotify'}
                  </p>
                </div>
                <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                  <p className="text-xs text-red-400">
                    {result.error?.includes('Not logged in') 
                      ? '🔐 Please sign in to Spotify and try again.'
                      : result.error?.includes('No songs could be found')
                      ? '🔍 No songs could be found on Spotify, even with smart search.'
                      : '💡 Try again or check your internet connection.'}
                  </p>
                </div>
                {/* ... (buttons unchanged) ... */}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};