// src/components/FailedTracksModal.tsx
// ✅ PHASE 2.2 - CHUNK 2: Failed Tracks Modal
// Shows all failed verifications grouped by round with option to copy replacement prompt

import * as Dialog from "@radix-ui/react-dialog";
import type { Song } from "../types/song";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songs: Song[];
  onGetReplacements: () => void;
};

export default function FailedTracksModal({
  open,
  onOpenChange,
  songs,
  onGetReplacements,
}: Props) {
  // Filter to get only failed tracks
  const failedTracks = songs.filter(s => s.verificationStatus === 'failed');
  
  // Group by round
  const tracksByRound = failedTracks.reduce((acc, track) => {
    const round = track.round ?? 0;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(track);
    return acc;
  }, {} as Record<number, Song[]>);

  // Sort rounds in descending order (latest first)
  const sortedRounds = Object.keys(tracksByRound)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[700px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-gray-800 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-auto">
          
          {/* Header */}
          <div className="mb-4">
            <Dialog.Title className="text-lg font-semibold text-white mb-2">
              ❌ Failed Verifications
              <span className="ml-2 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
                {failedTracks.length}
              </span>
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-400">
              These tracks couldn't be verified on Spotify. You can get replacement suggestions from ChatGPT.
            </Dialog.Description>
          </div>

          {/* Empty State */}
          {failedTracks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4">✓</div>
              <div className="text-lg font-medium text-gray-300 mb-2">
                No Failed Tracks
              </div>
              <div className="text-sm text-gray-400">
                All your tracks have been successfully verified!
              </div>
            </div>
          ) : (
            <>
              {/* Failed Tracks by Round */}
              <div className="space-y-6 mb-6">
                {sortedRounds.map((round) => {
                  const tracks = tracksByRound[round];
                  return (
                    <div key={round} className="space-y-2">
                      {/* Round Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-sm font-bold text-emerald-400">
                          📀 Round {round}
                        </div>
                        <div className="text-xs text-gray-500">
                          ({tracks.length} track{tracks.length !== 1 ? 's' : ''})
                        </div>
                      </div>

                      {/* Track Cards */}
                      <div className="space-y-2">
                        {tracks.map((track) => (
                          <div
                            key={track.id}
                            className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg hover:bg-red-950/40 transition-colors"
                          >
                            {/* Track Info */}
                            <div className="mb-2">
                              <div className="font-medium text-white text-sm">
                                {track.title}
                              </div>
                              <div className="text-gray-400 text-xs">
                                by {track.artist}
                                {track.album && <span className="text-gray-500"> • {track.album}</span>}
                                {track.year && <span className="text-gray-500"> ({track.year})</span>}
                              </div>
                            </div>

                            {/* Verification Error */}
                            {track.verificationError && (
                              <div className="mb-2 p-2 bg-red-900/30 border border-red-800/50 rounded text-xs">
                                <div className="text-red-400 font-medium">
                                  ❌ {track.verificationError}
                                </div>
                              </div>
                            )}

                            {/* Original Reason */}
                            {track.comments && (
                              <div className="p-2 bg-gray-700/50 border border-gray-600 rounded text-xs">
                                <div className="text-gray-400 mb-1 font-medium">
                                  💡 Original Reason:
                                </div>
                                <div className="text-gray-300 italic">
                                  "{track.comments}"
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="p-4 bg-orange-950/30 border border-orange-900/50 rounded-lg mb-6">
                <div className="text-sm text-orange-300">
                  <div className="font-medium mb-1">💡 What to do next?</div>
                  <div className="text-orange-400/80 text-xs">
                    Copy the replacement prompt below and paste it into ChatGPT. 
                    It will suggest alternative tracks that exist on Spotify.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            {failedTracks.length > 0 && (
              <button
                onClick={() => {
                  onGetReplacements();
                  onOpenChange(false);
                }}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                📋 Copy Replacement Prompt
              </button>
            )}
            <Dialog.Close asChild>
              <button
                className="px-4 py-2 rounded-xl border border-gray-600 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
