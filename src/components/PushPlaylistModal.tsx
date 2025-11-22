// FILE: src/components/PushPlaylistModal.tsx (MODIFIED - Phase 4.5.6)

import { useState, useEffect } from 'react';
import type { Playlist } from '@/types/playlist';
import type { Song } from '@/types/song';
import { FoneaLogo } from './FoneaLogo';
// MODIFIED: Import the new types and components
import { pushPlaylistToSpotify } from '@/services/spotifyPlaylistService';
import type { ExtendedPushResult } from '@/services/export/spotifyExportVerification';
import type { VerificationResult } from '@/services/export/exportVerificationService';
import { ExportResultsModal } from './ExportResultsModal';
import { formatPlaylistDescription } from '@/utils/formatters';
import { FEATURES } from '@/config/features';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist | null;
  onSuccess: (playlistId: string, spotifyPlaylistId: string, spotifyUrl: string) => void;
  // NEW: Callback to update playlist songs with sync status
  onUpdatePlaylistSongs?: (playlistId: string, updatedSongs: Song[]) => void;
};

type Stage = 'confirm' | 'pushing' | 'success' | 'error';

export const PushPlaylistModal = ({
  open,
  onOpenChange,
  playlist,
  onSuccess,
  onUpdatePlaylistSongs, // NEW
}: Props) => {
  const [stage, setStage] = useState<Stage>('confirm');
  const [_progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ExtendedPushResult | null>(null);
  const [description, setDescription] = useState(playlist?.description || '');
  
  // NEW: State for export results modal
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStage('confirm');
      setProgress(0);
      setProgressMessage('');
      setResult(null);
      setDescription(playlist?.description || '');
      // NEW: Reset results modal state
      setShowResultsModal(false);
      setVerificationResult(null);
    }
  }, [open, playlist]);

  const handlePush = async () => {
    if (!playlist) return;

    setStage('pushing');
    setProgress(0);

    const playlistToPush: Playlist = {
      ...playlist,
      description: description,
    };

    // MODIFIED: Call returns ExtendedPushResult now
    const result: ExtendedPushResult = await pushPlaylistToSpotify(playlistToPush, (progressUpdate) => {
      setProgress(progressUpdate.current);
      setProgressMessage(progressUpdate.message);
      if (progressUpdate.stage === 'resolving') {
        setProgressMessage(progressUpdate.message);
      }
    });

    setResult(result);

    if (result.success && result.playlistId && result.playlistUrl) {
      // NEW: Update songs with sync status
      if (result.updatedSongs && onUpdatePlaylistSongs) {
        onUpdatePlaylistSongs(playlist.id, result.updatedSongs);
      }
      
      // NEW: Show verification results if available
      if (result.verification) {
        setVerificationResult(result.verification);
        setShowResultsModal(true);
      }
      
      setStage('success');
      onSuccess(playlist.id, result.playlistId, result.playlistUrl);
    } else {
      setStage('error');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };
  
  // NEW: Handle closing the results modal
  const handleResultsModalClose = () => {
    setShowResultsModal(false);
    handleClose();
  };

  const songsWithDirectLink = playlist?.songs.filter(song => {
      const hasPlatformId = !!song.platformIds?.spotify?.id;
      const hasLegacyId = 
        song.serviceUri?.startsWith('spotify:') ||
        song.spotifyUri?.startsWith('spotify:') ||
        !!song.serviceId ||
        !!song.spotifyId;
      return hasPlatformId || hasLegacyId;
  }) || [];

  const songsToBeSearched = (playlist?.songs.length || 0) - songsWithDirectLink.length;

  if (!open || !playlist) return null;

  const previewDescription = formatPlaylistDescription(description);

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
              {stage === 'confirm' && 'Export to Spotify'}
              {stage === 'pushing' && 'Exporting to Spotify...'}
              {stage === 'success' && '✅ Playlist Exported'}
              {stage === 'error' && '❌ Error'}
            </h2>
            {(stage === 'confirm' || stage === 'error') && (
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Close"
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
                <p className="text-white text-lg font-medium">
                  "{playlist.name}"
                </p>

                {/* Description Input */}
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

                {/* Branding Preview */}
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

                {/* Export Summary */}
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
                    disabled={playlist.songs.length === 0}
                    className="flex-1 px-4 py-3 rounded-lg bg-[#1DB954] text-white hover:bg-[#1ed760] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
                    </svg>
                    <span>Export to Spotify</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pushing Stage */}
            {stage === 'pushing' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <FoneaLogo variant="icon" className="h-16 w-16 text-emerald-400 animate-bounce" />
                  </div>
                  <p className="text-white text-lg font-medium mb-2">
                    Exporting your playlist...
                  </p>
                  <p className="text-gray-400 text-sm">
                    {progressMessage || 'Initializing...'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${_progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success Stage */}
            {stage === 'success' && result && !showResultsModal && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <FoneaLogo variant="icon" className="h-16 w-16 text-emerald-400" />
                  </div>
                  <p className="text-white text-xl font-bold mb-2">
                    Export Successful!
                  </p>
                  <p className="text-gray-400 text-sm">
                    "{playlist.name}" is now on Spotify
                  </p>
                </div>

                {result.playlistUrl && (
                  <a
                    href={result.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-3 rounded-lg bg-[#1DB954] text-white text-center font-medium hover:bg-[#1ed760] transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
                    </svg>
                    <span>Open in Spotify</span>
                  </a>
                )}

                <button
                  onClick={handleClose}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
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
                      : result.error?.includes('No songs could be found')
                      ? '🔍 No songs could be found on Spotify, even with smart search.'
                      : '💡 Try again or check your internet connection.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setStage('confirm');
                      setResult(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW: Export Results Modal */}
      {showResultsModal && verificationResult && (
        <ExportResultsModal
          isOpen={showResultsModal}
          onClose={handleResultsModalClose}
          verification={verificationResult}
          playlistUrl={result?.playlistUrl}
          platform="Spotify"
          playlistName={playlist?.name || ''}
          onRetryFailed={() => {
            // TODO: Implement retry logic
            console.log('Retry failed songs - to be implemented');
            setShowResultsModal(false);
          }}
        />
      )}
    </>
  );
};