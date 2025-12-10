// src/components/ExportYouTubeModal.tsx
/**
 * Export to YouTube Modal - Chunk 8
 * 
 * Handles 3 scenarios:
 * 1. Export New: Create new playlist on YouTube (first time)
 * 2. Sync: Add only new songs to existing YouTube playlist (append-only)
 * 3. Replace: Delete old playlist and create new one
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { exportPlaylistToYouTube, syncPlaylistToYouTube } from '@/services/youtubePlaylistService';
import { youtubeAuth } from '@/services/youtubeAuth';
import { checkPlaylistLimit } from '@/utils/youtubePlaylistHelpers';
import type { Playlist } from '@/types/playlist';
import type { ExportProgress, ExportReport } from '@/services/export/types';

interface ExportYouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
  onExportComplete: (updatedPlaylist: Playlist) => void;
}

type ViewState = 'options' | 'exporting' | 'results';
type ExportMode = 'new' | 'sync' | 'replace';

export function ExportYouTubeModal({
  isOpen,
  onClose,
  playlist,
  onExportComplete,
}: ExportYouTubeModalProps) {
  const [viewState, setViewState] = useState<ViewState>('options');
  const [selectedMode, setSelectedMode] = useState<ExportMode>('sync');
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportReport, setExportReport] = useState<ExportReport | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth and determine mode on open
  useEffect(() => {
    if (isOpen) {
      checkAuth();
      determineDefaultMode();
    }
  }, [isOpen]);

  const checkAuth = async () => {
    const auth = await youtubeAuth.isAuthenticated();
    setIsAuthenticated(auth);
    
    if (!auth) {
      toast.error('Please log in to YouTube first');
      onClose();
    }
  };

  const determineDefaultMode = () => {
    const hasYouTubePlaylist = !!playlist.platformPlaylists?.youtube?.id;
    
    if (hasYouTubePlaylist) {
      // Default to sync if playlist exists
      setSelectedMode('sync');
    } else {
      // Default to new if no YouTube playlist
      setSelectedMode('new');
    }
  };

  const handleExport = async () => {
    setViewState('exporting');
    setExportProgress({ stage: 'resolving', current: 0, total: 1, message: 'Starting export...' });

    try {
      let report: ExportReport;

      if (selectedMode === 'sync') {
        // Append-only sync
        report = await syncPlaylistToYouTube(playlist, setExportProgress);
      } else {
        // Export new or replace (both create new playlist)
        report = await exportPlaylistToYouTube(playlist, setExportProgress);
      }

      setExportReport(report);
      setViewState('results');

      if (report.success) {
        // Update playlist with YouTube info
        const updatedPlaylist: Playlist = {
          ...playlist,
          platformPlaylists: {
            ...playlist.platformPlaylists,
            youtube: {
              id: report.playlistId!,
              url: report.playlistUrl!,
              synced: true,
            },
          },
        };

        onExportComplete(updatedPlaylist);
        
        if (selectedMode === 'sync') {
          toast.success(`Added ${report.successful.total} songs to YouTube!`);
        } else {
          toast.success('Playlist exported to YouTube!');
        }
      } else {
        toast.error(report.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Export failed');
      setViewState('options');
    }
  };

  const handleClose = () => {
    if (viewState === 'exporting') return; // Don't close during export
    
    setViewState('options');
    setExportProgress(null);
    setExportReport(null);
    onClose();
  };

  if (!isOpen || !isAuthenticated) return null;

  const hasYouTubePlaylist = !!playlist.platformPlaylists?.youtube?.id;
  const songCount = playlist.songs.length;
  const limitWarning = checkPlaylistLimit(songCount);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4"
        onClick={viewState !== 'exporting' ? handleClose : undefined}
      >
        {/* Modal */}
        <div
          className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-red-600">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Export to YouTube</span>
            </h2>
            <button
              onClick={handleClose}
              disabled={viewState === 'exporting'}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {viewState === 'options' && (
              <div className="space-y-6">
                {/* Playlist info */}
                <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-1">"{playlist.name}"</h3>
                  <p className="text-sm text-gray-400">
                    {songCount} song{songCount !== 1 ? 's' : ''}
                    {playlist.isPublic ? ' · Public' : ' · Private'}
                  </p>
                  {playlist.description && (
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{playlist.description}</p>
                  )}
                </div>

                {/* Limit warning */}
                {limitWarning && (
                  <div className="p-4 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                    <p className="text-orange-300 text-sm">⚠️ {limitWarning}</p>
                  </div>
                )}

                {/* Status message */}
                {hasYouTubePlaylist ? (
                  <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <p className="text-blue-300 text-sm font-medium mb-1">
                      This playlist exists on YouTube
                    </p>
                    <p className="text-blue-300/80 text-sm">
                      Choose how to update it:
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                    <p className="text-emerald-300 text-sm">
                      Create a new playlist on YouTube with all {songCount} songs
                    </p>
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                  {hasYouTubePlaylist && (
                    <>
                      {/* Sync option */}
                      <label
                        className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedMode === 'sync'
                            ? 'border-emerald-500 bg-emerald-900/20'
                            : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="exportMode"
                          value="sync"
                          checked={selectedMode === 'sync'}
                          onChange={() => setSelectedMode('sync')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-white mb-1">Add new songs</div>
                          <p className="text-sm text-gray-400">
                            Keep all existing songs and add any new ones to the end.
                            This is the safest option.
                          </p>
                        </div>
                      </label>

                      {/* Replace option */}
                      <label
                        className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedMode === 'replace'
                            ? 'border-orange-500 bg-orange-900/20'
                            : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="exportMode"
                          value="replace"
                          checked={selectedMode === 'replace'}
                          onChange={() => setSelectedMode('replace')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-white mb-1">Replace playlist</div>
                          <p className="text-sm text-gray-400">
                            Remove all songs and create a fresh playlist with the current {songCount} songs.
                          </p>
                        </div>
                      </label>
                    </>
                  )}

                  {/* Create new option */}
                  <label
                    className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedMode === 'new'
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportMode"
                      value="new"
                      checked={selectedMode === 'new'}
                      onChange={() => setSelectedMode('new')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">
                        {hasYouTubePlaylist ? 'Create new separate playlist' : 'Create new playlist'}
                      </div>
                      <p className="text-sm text-gray-400">
                        {hasYouTubePlaylist 
                          ? 'Keep the existing playlist and create a new one (suggested name: "' + playlist.name + ' (2)")'
                          : 'Create a brand new playlist on YouTube with all songs'
                        }
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {viewState === 'exporting' && exportProgress && (
              <div className="space-y-6">
                {/* YouTube logo animation */}
                <div className="flex justify-center">
                  <div className="relative">
                    <svg viewBox="0 0 24 24" className="w-24 h-24 fill-red-600 animate-pulse">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                </div>

                {/* Progress info */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {selectedMode === 'sync' ? 'Syncing to YouTube...' : 'Exporting to YouTube...'}
                  </h3>
                  <p className="text-gray-400">{exportProgress.message}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{
                        width: `${(exportProgress.current / exportProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center">
                    {exportProgress.current} / {exportProgress.total}
                  </p>
                </div>

                {/* Stage indicators */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded ${exportProgress.stage === 'resolving' ? 'bg-red-900/30 text-red-300' : 'bg-gray-700 text-gray-400'}`}>
                    Resolving songs
                  </div>
                  <div className={`p-2 rounded ${exportProgress.stage === 'creating' ? 'bg-red-900/30 text-red-300' : 'bg-gray-700 text-gray-400'}`}>
                    {selectedMode === 'sync' ? 'Checking playlist' : 'Creating playlist'}
                  </div>
                  <div className={`p-2 rounded ${exportProgress.stage === 'adding_tracks' ? 'bg-red-900/30 text-red-300' : 'bg-gray-700 text-gray-400'}`}>
                    Adding songs
                  </div>
                </div>
              </div>
            )}

            {viewState === 'results' && exportReport && (
              <div className="space-y-6">
                {/* Success/Error icon */}
                <div className="flex justify-center">
                  {exportReport.success ? (
                    <div className="w-24 h-24 rounded-full bg-emerald-900/30 border-4 border-emerald-500 flex items-center justify-center">
                      <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-red-900/30 border-4 border-red-500 flex items-center justify-center">
                      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {exportReport.success 
                      ? selectedMode === 'sync' ? 'Sync Complete!' : 'Export Complete!'
                      : 'Export Failed'
                    }
                  </h3>
                  <p className="text-gray-400">"{playlist.name}"</p>
                </div>

                {/* Stats */}
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-white mb-1">
                      {exportReport.statistics.successRate.toFixed(0)}%
                    </div>
                    <p className="text-sm text-gray-300">Success Rate</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400">
                        ✓ {exportReport.successful.total}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {selectedMode === 'sync' ? 'Added' : 'Exported'}
                      </p>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400">
                        ✗ {exportReport.failed.count}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Failed</p>
                    </div>

                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        🕐 {(exportReport.statistics.exportDuration / 1000).toFixed(1)}s
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Duration</p>
                    </div>
                  </div>
                </div>

                {/* YouTube link */}
                {exportReport.playlistUrl && (
                  <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">YouTube Playlist</h4>
                    <a
                      href={exportReport.playlistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 text-sm break-all"
                    >
                      {exportReport.playlistUrl}
                    </a>
                  </div>
                )}

                {/* Warnings/Info */}
                {exportReport.failed.count > 0 && (
                  <div className="p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                    <p className="text-orange-300 text-sm">
                      ⚠️ {exportReport.failed.count} song{exportReport.failed.count !== 1 ? 's' : ''} could not be added 
                      (songs not found on YouTube or unavailable)
                    </p>
                  </div>
                )}

                {exportReport.success && (
                  <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      💡 Playlist is now synced with YouTube! Listen on YouTube Music or share with friends.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
            {viewState === 'options' && (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={!!limitWarning && limitWarning.startsWith('Cannot')}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedMode === 'sync' ? 'Sync to YouTube' : 'Export to YouTube'}
                </button>
              </>
            )}

            {viewState === 'exporting' && (
              <button
                disabled
                className="px-4 py-2 rounded-lg bg-gray-700 text-gray-400 cursor-not-allowed"
              >
                Exporting...
              </button>
            )}

            {viewState === 'results' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
