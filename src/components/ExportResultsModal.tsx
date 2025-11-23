// src/components/ExportResultsModal.tsx
/**
 * Export Results Modal (Phase 4.5.6)
 * 
 * Displays detailed results after exporting a playlist to a streaming platform.
 * Shows success rate, failed songs, and provides options to retry or manually resolve.
 */

import { useState } from 'react';
import { FoneaLogo } from './FoneaLogo';
import type { VerificationResult } from '@/services/export/exportVerificationService';

interface ExportResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  verification: VerificationResult;
  playlistUrl?: string;
  platform: string;
  playlistName: string;
  onRetryFailed?: () => void;
 
}

export function ExportResultsModal({
  isOpen,
  onClose,
  verification,
  playlistUrl,
  platform,
  playlistName,
  onRetryFailed,
 
}: ExportResultsModalProps) {
  const [showFailedList, setShowFailedList] = useState(false);
  
  if (!isOpen) return null;
  
  const { totalSuccessful, totalFailed, successRate, failedSongs } = verification;
  const hasFailures = totalFailed > 0;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold text-white">
              {hasFailures ? '⚠️ Export Complete' : '✅ Export Successful'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            
            {/* Playlist Name */}
            <div className="mb-4">
              <p className="text-sm text-gray-400">Playlist</p>
              <p className="text-lg font-semibold text-white">"{playlistName}"</p>
            </div>

            {/* Success Summary */}
            <div className="mb-6 p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-xl">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-white mb-1">
                  {successRate.toFixed(0)}%
                </div>
                <p className="text-sm text-gray-300">Success Rate</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-400">
                    ✓ {totalSuccessful}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Successful</p>
                </div>
                
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-400">
                    ✗ {totalFailed}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Failed</p>
                </div>
              </div>
            </div>

            {/* Link to playlist */}
            {playlistUrl && (
              <div className="mb-6">
                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 rounded-lg bg-[#1DB954] text-white text-center font-medium hover:bg-[#1ed760] transition-colors inline-flex items-center justify-center gap-2"
                >
                  {platform === 'Spotify' && (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
                    </svg>
                  )}
                  <span>Open in {platform}</span>
                </a>
              </div>
            )}

            {/* Failed songs section */}
            {hasFailures && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowFailedList(!showFailedList)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 font-medium">
                        ⚠️ {totalFailed} song{totalFailed !== 1 ? 's' : ''} not added
                      </span>
                    </div>
                    <button className="text-orange-400 hover:text-orange-300">
                      <svg 
                        className={`w-5 h-5 transition-transform ${showFailedList ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-xs text-orange-300 mt-2">
                    These songs could not be added to your {platform} playlist. 
                    They will be highlighted in your Fonea playlist.
                  </p>
                </div>
                
                {/* Expandable failed songs list */}
                {showFailedList && (
                  <div className="max-h-64 overflow-y-auto space-y-2 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                    {failedSongs.map((song, idx) => (
                      <div 
                        key={idx}
                        className="p-3 bg-gray-800 border border-gray-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">
                              {song.title}
                            </p>
                            <p className="text-sm text-gray-400 truncate">
                              {song.artist}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 p-2 bg-orange-900/20 rounded text-xs text-orange-300">
                          {song.reason}
                        </div>
                        
                        {song.tier && (
                          <div className="mt-1 text-xs text-gray-500">
                            Source: {song.tier}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Perfect export message */}
            {!hasFailures && (
              <div className="text-center p-6 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                <div className="flex justify-center mb-3">
                  <FoneaLogo variant="icon" className="h-12 w-12 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Perfect Export!
                </h3>
                <p className="text-sm text-gray-300">
                  All {totalSuccessful} songs were successfully added to your {platform} playlist.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-900 border-t border-gray-700 flex-shrink-0">
            <div className="flex gap-3">
              {hasFailures && onRetryFailed && (
                <button
                  onClick={onRetryFailed}
                  className="flex-1 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  <span>Retry Failed</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors font-medium"
              >
                {hasFailures ? 'Got It' : 'Close'}
              </button>
            </div>
            
            {hasFailures && (
              <p className="text-xs text-center text-gray-500 mt-3">
                💡 Tip: Failed songs will be marked in red in your playlist
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}