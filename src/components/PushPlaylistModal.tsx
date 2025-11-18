// src/components/PushPlaylistModal.tsx
/**
 * Modal for pushing a playlist to Spotify
 * Shows progress and handles the push operation
 */

import { useState, useEffect } from 'react';
import type { Playlist } from '@/types/playlist';

import { pushPlaylistToSpotify, type PushResult } from '@/services/spotifyPlaylistService';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist | null;
  onSuccess: (playlistId: string, spotifyPlaylistId: string, spotifyUrl: string) => void;
};

type Stage = 'confirm' | 'pushing' | 'success' | 'error';

export const PushPlaylistModal = ({
  open,
  onOpenChange,
  playlist,
  onSuccess,
}: Props) => {
  const [stage, setStage] = useState<Stage>('confirm');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<PushResult | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStage('confirm');
      setProgress(0);
      setProgressMessage('');
      setResult(null);
    }
  }, [open]);

  const handlePush = async () => {
    if (!playlist) return;

    setStage('pushing');
    setProgress(0);

    const result = await pushPlaylistToSpotify(playlist, (progressUpdate) => {
      setProgress(progressUpdate.current);
      setProgressMessage(progressUpdate.message);
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

  const songsWithoutSpotify = playlist?.songs.filter(song => {
    return !song.serviceUri?.startsWith('spotify:') && 
           !song.spotifyUri?.startsWith('spotify:') &&
           !song.serviceId &&
           !song.spotifyId;
  }) || [];

  if (!open || !playlist) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
        onClick={stage === 'confirm' || stage === 'success' || stage === 'error' ? handleClose : undefined}
      >
        {/* Modal */}
        <div
          className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-md flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold text-white">
              {stage === 'confirm' && 'Push to Spotify'}
              {stage === 'pushing' && 'Pushing to Spotify...'}
              {stage === 'success' && '✅ Success!'}
              {stage === 'error' && '❌ Error'}
            </h2>
            {(stage === 'confirm' || stage === 'success' || stage === 'error') && (
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-6 flex-1 overflow-y-auto">
            {/* Confirm Stage */}
            {stage === 'confirm' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl mb-4">🎵</div>
                  <p className="text-white text-lg font-medium mb-2">
                    Ready to create this playlist on Spotify?
                  </p>
                  <p className="text-gray-400 text-sm">
                    "{playlist.name}"
                  </p>
                </div>

                <div className="p-4 bg-gray-700 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Total songs:</span>
                    <span className="text-white font-medium">{playlist.songs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Ready to push:</span>
                    <span className="text-emerald-400 font-medium">
                      {playlist.songs.length - songsWithoutSpotify.length}
                    </span>
                  </div>
                  {songsWithoutSpotify.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Missing Spotify data:</span>
                      <span className="text-orange-400 font-medium">
                        {songsWithoutSpotify.length}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Visibility:</span>
                    <span className="text-white font-medium">
                      {playlist.isPublic ? '🌐 Public' : '🔒 Private'}
                    </span>
                  </div>
                </div>

                {songsWithoutSpotify.length > 0 && (
                  <div className="p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                    <p className="text-xs text-orange-400">
                      ⚠️ {songsWithoutSpotify.length} song{songsWithoutSpotify.length !== 1 ? 's' : ''} without Spotify data will be skipped. 
                      Verify songs first for best results.
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
                    disabled={playlist.songs.length - songsWithoutSpotify.length === 0}
                    className="flex-1 px-4 py-3 rounded-lg bg-[#1DB954] text-white hover:bg-[#1ed760] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
                    </svg>
                    <span>Push to Spotify</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pushing Stage */}
            {stage === 'pushing' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl mb-4 animate-bounce">🎵</div>
                  <p className="text-white text-lg font-medium mb-2">
                    Creating your playlist...
                  </p>
                  <p className="text-gray-400 text-sm">
                    {progressMessage}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-[#1DB954] h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-center text-sm text-gray-400">
                    {progress}%
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Please don't close this window...
                </p>
              </div>
            )}

            {/* Success Stage */}
            {stage === 'success' && result && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-white text-xl font-bold mb-2">
                    Playlist created!
                  </p>
                  <p className="text-gray-400 text-sm">
                    "{playlist.name}" is now on your Spotify
                  </p>
                </div>

                <div className="p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300">Tracks added:</span>
                    <span className="text-white font-medium">{result.tracksAdded}</span>
                  </div>
                  {result.tracksFailed && result.tracksFailed > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-orange-300">Tracks skipped:</span>
                      <span className="text-orange-400 font-medium">{result.tracksFailed}</span>
                    </div>
                  )}
                </div>

                {result.missingTracks && result.missingTracks.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-orange-400 hover:text-orange-300 font-medium">
                      ⚠️ View skipped tracks ({result.missingTracks.length})
                    </summary>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {result.missingTracks.map((song, idx) => (
                        <div key={idx} className="p-2 bg-orange-900/20 rounded text-xs text-orange-300">
                          {song.artist} - {song.title}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  {result.playlistUrl && (
                    <a
                      href={result.playlistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 rounded-lg bg-[#1DB954] text-white hover:bg-[#1ed760] transition-colors font-medium text-center inline-flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
                      </svg>
                      <span>Open in Spotify</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Error Stage */}
            {stage === 'error' && result && (
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
                      : result.error?.includes('No songs with Spotify IDs')
                      ? '🔍 Verify your songs first using the auto-verification feature.'
                      : '💡 Try again or check your internet connection.'}
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handlePush}
                    className="flex-1 px-4 py-3 rounded-lg bg-[#1DB954] text-white hover:bg-[#1ed760] transition-colors font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
