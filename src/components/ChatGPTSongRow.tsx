// src/components/ChatGPTSongRow.tsx (MODIFIED - with Audio Player & On-Demand Links)
// ✅ ENHANCED: Now includes Apple Music preview player and on-demand platform link resolution

import { useState } from "react";
import type { Song } from "../types/song";
import type { Playlist } from "../types/playlist";
import { formatDistanceToNow } from "date-fns";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { ExportVerificationService } from "@/services/export/exportVerificationService";
// 🆕 NEW IMPORTS
import { AudioPlayer } from "./AudioPlayer";
import { fetchPlatformLink, type Platform as PlatformType } from "@/services/platformLinkService";
import { spotifyAuth } from "@/services/spotifyAuth";
import { toast } from "sonner";

type Props = {
  song: Song;
  onUpdate: (next: Song) => void;
  onDelete: () => void;
  onOpenCreatePlaylist: () => void;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: string, songId: string) => void;
  onRemoveFromPlaylist: (playlistId: string, songId: string) => void;
};

// 🆕 Platform button loading state type
type PlatformLinkState = {
  loading: boolean;
  error: string | null;
};

// Helper function to get sync status indicator
function getSyncStatusIndicator(song: Song): React.ReactNode {
  if (!song.overallSyncStatus) return null;
  
  switch (song.overallSyncStatus) {
    case 'all_success':
      return (
        <span 
          className="sync-status success" 
          title="Successfully exported to all platforms"
        >
          ✅
        </span>
      );
    case 'partial_success':
      return (
        <span 
          className="sync-status partial" 
          title="Exported to some platforms"
        >
          ⚠️
        </span>
      );
    case 'all_failed':
      return (
        <span 
          className="sync-status failed" 
          title="Failed to export to all platforms"
        >
          ❌
        </span>
      );
    case 'pending':
    default:
      return (
        <span 
          className="sync-status pending" 
          title="Not yet exported"
        >
          🔄
        </span>
      );
  }
}

// Helper function to get sync details tooltip content
function getSyncDetailsTooltip(song: Song): React.ReactNode {
  if (!song.syncStatus) return null;
  
  const entries = Object.entries(song.syncStatus);
  if (entries.length === 0) return null;
  
  return (
    <div className="sync-details-tooltip">
      {entries.map(([platform, info]) => {
        if (!info) return null;
        
        return (
          <div key={platform} className="platform-sync-info">
            <strong>{platform}</strong>: {info.status}
            {info.error && <span className="error-msg">{info.error}</span>}
            {info.lastSynced && (
              <span className="text-xs text-gray-500">
                Synced {formatDistanceToNow(new Date(info.lastSynced), { addSuffix: true })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const ChatGPTSongRow = ({ 
  song, 
  onUpdate, 
  onDelete, 
  onOpenCreatePlaylist,
  playlists,
  onAddToPlaylist,
  onRemoveFromPlaylist,
}: Props) => {
  
  const set = <K extends keyof Song>(key: K, value: Song[K]) =>
    onUpdate({ ...song, [key]: value });

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  
  // 🆕 NEW STATE: Platform link loading states
  const [platformLinkStates, setPlatformLinkStates] = useState<Record<PlatformType, PlatformLinkState>>({
    spotify: { loading: false, error: null },
    apple: { loading: false, error: null },
    tidal: { loading: false, error: null },
    youtube: { loading: false, error: null },
  });

  const feedbackOptions: Array<"keep" | "skip" | "pending"> = [
    "keep",
    "skip",
    "pending",
  ];

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return null;
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleKeep = () => {
    set("feedback", "keep");
    setShowPlaylistModal(true);
  };

  const getVerificationSourceLabel = (source?: string) => {
    if (!source) return "";
    
    switch (source) {
      case "musicbrainz":
        return "MusicBrainz";
      case "spotify":
        return "Spotify";
      case "itunes":
        return "iTunes";
      case "apple":
        return "Apple Music";
      case "multi":
        return "Multi";
      case "manual":
        return "Manual";
      default:
        return source;
    }
  };
  
  // Handler for manual resolution
  const handleMarkAsResolved = () => {
    const updatedSong = ExportVerificationService.markAsManuallyResolved(
      song,
      'Spotify'
    );
    onUpdate(updatedSong);
  };

  // 🆕 NEW HANDLER: On-demand platform link fetching
  const handleListenOnPlatform = async (platform: PlatformType) => {
    // Set loading state
    setPlatformLinkStates(prev => ({
      ...prev,
      [platform]: { loading: true, error: null }
    }));

    try {
      // Get Spotify token if needed
      let spotifyToken: string | undefined;
      if (platform === 'spotify') {
        spotifyToken = await spotifyAuth.getAccessToken();
        if (!spotifyToken) {
          throw new Error('Not logged in to Spotify');
        }
      }

      // Fetch platform link
      const { result, updatedSong } = await fetchPlatformLink(song, platform, {
        spotifyToken,
      });

      // Update song with cached link
      onUpdate(updatedSong);

      // Open the link
      if (result.isManualSearch) {
        toast.info(`Opening ${platform} search - couldn't find direct link`, {
          duration: 3000,
        });
      } else {
        toast.success(`Opening on ${platform}!`, {
          duration: 2000,
        });
      }

      window.open(result.url, '_blank', 'noopener,noreferrer');

      // Clear loading state
      setPlatformLinkStates(prev => ({
        ...prev,
        [platform]: { loading: false, error: null }
      }));

    } catch (error) {
      console.error(`Failed to fetch ${platform} link:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setPlatformLinkStates(prev => ({
        ...prev,
        [platform]: { loading: false, error: errorMessage }
      }));

      toast.error(`Failed to open ${platform}: ${errorMessage}`, {
        duration: 5000,
      });
    }
  };

  // 🆕 Helper: Check if platform link is cached
  const isPlatformCached = (platform: PlatformType): boolean => {
    const platformData = song.platformIds?.[platform];
    return !!(platformData?.id && platformData?.url);
  };

  // 🆕 Helper: Get platform link URL if cached
  const getPlatformUrl = (platform: PlatformType): string | undefined => {
    const platformData = song.platformIds?.[platform];
    return platformData?.url;
  };

  const playlistCount = playlists.filter(p => p.songs.some(s => s.id === song.id)).length;

  // Get className based on sync status
  const syncStatusClassName = 
    song.overallSyncStatus === 'all_failed' ? 'failed-export' :
    song.overallSyncStatus === 'partial_success' ? 'partial-export' :
    '';

  return (
    <div className={`container mx-auto px-4 py-4 border-b border-gray-700 bg-gray-700 hover:bg-gray-650 transition-colors overflow-hidden ${syncStatusClassName}`}>
      {/* TOP META ROW */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Sync Status Indicator */}
        {song.overallSyncStatus && (
          <div className="sync-indicator relative">
            {getSyncStatusIndicator(song)}
            {getSyncDetailsTooltip(song)}
          </div>
        )}
        
        {/* Verification Status */}
        {song.verificationStatus && (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${
              song.verificationStatus === "verified"
                ? "bg-emerald-600 text-white border-emerald-500"
                : song.verificationStatus === "checking"
                ? "bg-gray-500 text-white border-gray-400"
                : song.verificationStatus === "failed"
                ? "bg-red-700 text-white border-red-600"
                : "bg-orange-500 text-white border-orange-400"
            }`}
          >
            {song.verificationStatus === "verified" && (
              <>
                ✓ Verified
                {song.verificationSource && (
                  <span className="ml-1 opacity-75">
                    ({getVerificationSourceLabel(song.verificationSource)})
                  </span>
                )}
              </>
            )}
            {song.verificationStatus === "checking" && "🔄 Checking..."}
            {song.verificationStatus === "failed" && "✗ Failed"}
            {song.verificationStatus === "unverified" && "⚠️ Unverified"}
          </span>
        )}

        {/* Round */}
        {song.round && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-900 text-emerald-300 border border-emerald-700">
            Round {song.round}
          </span>
        )}

        <div className="flex items-center gap-3 ml-auto">
          {song.addedAt && (
            <span className="text-xs text-gray-400">
              Added {formatTimestamp(song.addedAt)}
            </span>
          )}
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 border border-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex gap-4">
        {song.albumArtUrl && (
          <div className="flex-shrink-0">
            <img
              src={song.albumArtUrl}
              alt={`${song.title} album cover`}
              className="w-32 h-32 rounded-xl object-cover shadow-md border border-gray-600"
            />
          </div>
        )}

        <div className="flex-1 mb-3">
          {/* Title */}
          <input
            value={song.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Title"
            className="w-full px-0 py-1 border-b border-gray-500/60 bg-transparent text-white placeholder-gray-500 text-lg font-bold focus:outline-none focus:border-emerald-500"
          />

          {/* Artist · Album · Year · Duration */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <input
              value={song.artist}
              onChange={(e) => set("artist", e.target.value)}
              placeholder="Artist"
              className="bg-transparent border-b border-transparent focus:border-emerald-500 text-white px-0 py-0.5 focus:outline-none"
            />

            {song.album && <span className="text-gray-500">·</span>}

            <input
              value={song.album ?? ""}
              onChange={(e) => set("album", e.target.value)}
              placeholder="Album"
              className="bg-transparent border-b border-transparent focus:border-emerald-500 text-gray-300 px-0 py-0.5 focus:outline-none"
            />

            {song.year && <span className="text-gray-500">·</span>}

            <input
              value={song.year ?? ""}
              onChange={(e) => set("year", e.target.value)}
              placeholder="Year"
              className="bg-transparent border-b border-transparent focus:border-emerald-500 text-gray-400 px-0 py-0.5 focus:outline-none w-14"
            />

            {song.duration && (
              <>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400">{formatDuration(song.duration)}</span>
              </>
            )}

            {song.musicBrainzId && (
              <>
                <span className="text-gray-500">·</span>
                <a
                  href={`https://musicbrainz.org/recording/${song.musicBrainzId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-xs underline"
                  title="View on MusicBrainz"
                >
                  MusicBrainz ↗
                </a>
              </>
            )}
          </div>

          {/* ISRC */}
          {song.isrc && (
            <div className="mt-1 text-xs text-gray-400">
              <span className="font-medium">ISRC:</span> {song.isrc}
            </div>
          )}

          {/* WHY ChatGPT recommended */}
          {song.comments && (
            <div className="mt-3 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
              <p className="text-xs font-medium text-amber-400 mb-1">
                Why ChatGPT recommended:
              </p>
              <p className="text-sm text-gray-300 italic">"{song.comments}"</p>
            </div>
          )}
        </div>
      </div>

      {/* 🆕 NEW: AUDIO PREVIEW PLAYER */}
      {song.previewUrl && (
        <div className="mt-4">
          <AudioPlayer
            previewUrl={song.previewUrl}
            title={song.title}
            artist={song.artist}
            songId={song.id}
          />
        </div>
      )}

      {/* 🆕 ENHANCED: Platform Links Section with On-Demand Fetching */}
      <div className="mt-4 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
        <p className="text-xs font-medium text-gray-400 mb-3">
          🌐 Listen on:
        </p>
        
        <div className="flex flex-wrap gap-2 items-center">
          {/* Spotify Button */}
          {isPlatformCached('spotify') ? (
            // Direct link (cached)
            <a
              href={getPlatformUrl('spotify')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1DB954] text-white hover:bg-[#1ed760] transition-all shadow-md hover:shadow-lg"
              title="Open in Spotify"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
              </svg>
              <span className="font-medium">Spotify</span>
              <span className="text-xs opacity-75">✓</span>
            </a>
          ) : (
            // On-demand button
            <button
              onClick={() => handleListenOnPlatform('spotify')}
              disabled={platformLinkStates.spotify.loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1DB954] text-white hover:bg-[#1ed760] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              title={platformLinkStates.spotify.loading ? "Finding link..." : "Listen on Spotify"}
            >
              {platformLinkStates.spotify.loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">Finding...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
                  </svg>
                  <span className="font-medium">Spotify</span>
                </>
              )}
            </button>
          )}

          {/* Apple Music Button */}
          {isPlatformCached('apple') ? (
            // Direct link (cached) with official badge
            <a
              href={getPlatformUrl('apple')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center transition-all hover:opacity-80"
              title="Listen on Apple Music"
            >
              <svg viewBox="0 0 140.62 41" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id={`apple-music-gradient-${song.id}`} gradientUnits="userSpaceOnUse" x1="20.1295" y1="32.4838" x2="20.1295" y2="7.9604">
                    <stop offset="0" style={{stopColor:"#FA233B"}}/>
                    <stop offset="1" style={{stopColor:"#FB5C74"}}/>
                  </linearGradient>
                </defs>
                <path fill="#A6A6A6" d="M130.09,0H9.53C9.17,0,8.81,0,8.44,0C8.13,0,7.83,0.01,7.52,0.01c-0.67,0.02-1.34,0.06-2,0.18 c-0.67,0.12-1.29,0.32-1.9,0.63C3.02,1.12,2.47,1.52,2,2C1.52,2.47,1.12,3.02,0.82,3.62c-0.31,0.61-0.51,1.23-0.63,1.9 c-0.12,0.66-0.16,1.33-0.18,2C0.01,7.83,0,8.14,0,8.44c0,0.36,0,0.73,0,1.09v20.93c0,0.37,0,0.73,0,1.09 c0,0.31,0.01,0.61,0.02,0.92c0.02,0.67,0.06,1.34,0.18,2c0.12,0.67,0.31,1.3,0.63,1.9c0.3,0.6,0.7,1.14,1.18,1.61 c0.47,0.48,1.02,0.88,1.62,1.18c0.61,0.31,1.23,0.51,1.9,0.63c0.66,0.12,1.34,0.16,2,0.18C7.83,39.99,8.13,40,8.44,40 c0.37,0,0.73,0,1.09,0h120.56c0.36,0,0.72,0,1.08,0c0.3,0,0.62,0,0.92-0.01c0.67-0.02,1.34-0.06,2-0.18 c0.67-0.12,1.29-0.32,1.91-0.63c0.6-0.3,1.14-0.7,1.62-1.18c0.48-0.47,0.87-1.02,1.18-1.61c0.31-0.61,0.51-1.23,0.62-1.9 c0.12-0.66,0.16-1.33,0.19-2c0-0.31,0-0.61,0-0.92c0.01-0.36,0.01-0.72,0.01-1.09V9.54c0-0.37,0-0.73-0.01-1.09 c0-0.31,0-0.61,0-0.92c-0.02-0.67-0.06-1.34-0.19-2c-0.11-0.67-0.31-1.29-0.62-1.9c-0.31-0.6-0.71-1.15-1.18-1.62 c-0.47-0.47-1.02-0.87-1.62-1.18c-0.62-0.31-1.24-0.51-1.91-0.63c-0.66-0.12-1.33-0.16-2-0.18c-0.3,0-0.62-0.01-0.92-0.01 C130.82,0,130.45,0,130.09,0L130.09,0z"/>
                <path d="M8.44,39.12c-0.3,0-0.6,0-0.9-0.01c-0.56-0.02-1.22-0.05-1.87-0.16c-0.61-0.11-1.15-0.29-1.66-0.55 c-0.52-0.26-0.99-0.61-1.4-1.02c-0.41-0.41-0.75-0.87-1.02-1.4c-0.26-0.5-0.44-1.05-0.54-1.66c-0.12-0.67-0.15-1.36-0.17-1.88 c-0.01-0.21-0.01-0.91-0.01-0.91V8.44c0,0,0.01-0.69,0.01-0.89C0.9,7.03,0.93,6.34,1.05,5.68C1.16,5.06,1.34,4.52,1.6,4.02 c0.27-0.52,0.61-0.99,1.02-1.4C3.03,2.2,3.5,1.86,4.01,1.6c0.51-0.26,1.06-0.44,1.65-0.54C6.34,0.93,7.02,0.9,7.54,0.89l0.9-0.01 h122.73l0.91,0.01c0.51,0.01,1.2,0.04,1.86,0.16c0.6,0.11,1.15,0.28,1.67,0.55c0.51,0.26,0.98,0.61,1.39,1.02 c0.41,0.41,0.75,0.88,1.02,1.4c0.26,0.51,0.43,1.05,0.54,1.65c0.12,0.63,0.15,1.28,0.17,1.89c0,0.28,0,0.59,0,0.89 c0.01,0.38,0.01,0.73,0.01,1.09v20.93c0,0.36,0,0.72-0.01,1.08c0,0.33,0,0.62,0,0.93c-0.02,0.59-0.06,1.24-0.17,1.85 c-0.1,0.61-0.28,1.16-0.54,1.67c-0.27,0.52-0.61,0.99-1.02,1.39c-0.41,0.42-0.88,0.76-1.4,1.02c-0.52,0.26-1.05,0.44-1.67,0.55 c-0.64,0.12-1.3,0.15-1.87,0.16c-0.29,0.01-0.6,0.01-0.9,0.01l-1.08,0L8.44,39.12z"/>
                <path fill="#FFFFFF" d="M42.12,14.75h-3.71V8.8h0.92v5.11h2.79V14.75z M43.21,8.93c0-0.31,0.24-0.54,0.57-0.54s0.57,0.24,0.57,0.54c0,0.31-0.24,0.54-0.57,0.54 S43.21,9.23,43.21,8.93z M43.34,10.26h0.88v4.49h-0.88V10.26z M47.3,10.17c1.01,0,1.67,0.47,1.76,1.26h-0.85c-0.08-0.33-0.4-0.54-0.91-0.54c-0.5,0-0.87,0.24-0.87,0.59 c0,0.27,0.23,0.44,0.71,0.55l0.75,0.17c0.85,0.2,1.25,0.56,1.25,1.23c0,0.85-0.79,1.41-1.86,1.41c-1.07,0-1.77-0.48-1.84-1.28 h0.89c0.11,0.35,0.44,0.56,0.98,0.56c0.55,0,0.95-0.25,0.95-0.61c0-0.27-0.21-0.44-0.66-0.55l-0.78-0.18 c-0.85-0.2-1.25-0.59-1.25-1.26C45.56,10.73,46.29,10.17,47.3,10.17z M51.52,9.14v1.14h0.97v0.75h-0.97v2.31c0,0.47,0.19,0.68,0.64,0.68c0.14,0,0.21-0.01,0.34-0.02v0.74 c-0.14,0.03-0.31,0.05-0.48,0.05c-0.99,0-1.38-0.35-1.38-1.21v-2.54h-0.71v-0.75h0.71V9.14H51.52z M57.42,13.54c-0.2,0.81-0.92,1.3-1.95,1.3c-1.29,0-2.08-0.88-2.08-2.32c0-1.44,0.81-2.35,2.07-2.35 c1.25,0,2.01,0.85,2.01,2.27v0.31H54.3v0.05c0.03,0.79,0.49,1.29,1.2,1.29c0.54,0,0.9-0.19,1.07-0.55H57.42z M54.3,12.09h2.27 c-0.02-0.71-0.45-1.16-1.11-1.16C54.81,10.93,54.35,11.39,54.3,12.09z M58.67,10.26h0.85v0.71h0.07c0.22-0.5,0.66-0.8,1.34-0.8c1,0,1.56,0.6,1.56,1.67v2.91H61.6v-2.69 c0-0.72-0.31-1.08-0.97-1.08c-0.66,0-1.07,0.44-1.07,1.14v2.63h-0.89V10.26z M66.09,12.5c0-1.45,0.81-2.33,2.12-2.33c1.31,0,2.12,0.88,2.12,2.33c0,1.46-0.81,2.34-2.12,2.34 C66.9,14.84,66.09,13.96,66.09,12.5z M69.42,12.5c0-0.97-0.44-1.54-1.2-1.54c-0.77,0-1.21,0.57-1.21,1.54 c0,0.98,0.43,1.55,1.21,1.55C68.98,14.05,69.42,13.48,69.42,12.5z M71.53,10.26h0.85v0.71h0.07c0.22-0.5,0.66-0.8,1.34-0.8c1,0,1.56,0.6,1.56,1.67v2.91h-0.89v-2.69 c0-0.72-0.31-1.08-0.97-1.08s-1.07,0.44-1.07,1.14v2.63h-0.89V10.26z"/>
                <path fill="#FFFFFF" d="M46.04,27.84H41.3l-1.14,3.36h-2.01l4.49-12.43h2.08l4.49,12.43h-2.04L46.04,27.84z M41.79,26.29h3.76 l-1.85-5.45h-0.05L41.79,26.29z M58.9,26.67c0,2.82-1.51,4.62-3.78,4.62c-1.29,0-2.32-0.58-2.85-1.58h-0.04v4.49h-1.86V22.14h1.8v1.51h0.03 c0.52-0.97,1.62-1.6,2.89-1.6C57.38,22.04,58.9,23.86,58.9,26.67z M56.99,26.67c0-1.83-0.95-3.04-2.39-3.04 c-1.42,0-2.38,1.23-2.38,3.04c0,1.83,0.96,3.05,2.38,3.05C56.04,29.72,56.99,28.52,56.99,26.67z M68.86,26.67c0,2.82-1.51,4.62-3.78,4.62c-1.29,0-2.32-0.58-2.85-1.58h-0.04v4.49h-1.86V22.14h1.8v1.51h0.03 c0.52-0.97,1.62-1.6,2.89-1.6C67.35,22.04,68.86,23.86,68.86,26.67z M66.95,26.67c0-1.83-0.95-3.04-2.39-3.04 c-1.42,0-2.38,1.23-2.38,3.04c0,1.83,0.96,3.05,2.38,3.05C66,29.72,66.95,28.52,66.95,26.67z M70.36,18.77h1.86V31.2h-1.86V18.77z M81.9,28.54c-0.25,1.65-1.85,2.77-3.9,2.77c-2.63,0-4.27-1.77-4.27-4.6c0-2.84,1.65-4.69,4.19-4.69 c2.51,0,4.08,1.72,4.08,4.47v0.64h-6.4v0.11c0,1.55,0.97,2.57,2.44,2.57c1.03,0,1.84-0.49,2.09-1.27H81.9z M75.61,25.83h4.53 c-0.04-1.39-0.93-2.3-2.22-2.3C76.64,23.53,75.71,24.46,75.61,25.83z M98.05,31.2v-9.15h-0.06l-3.75,9.05h-1.43l-3.76-9.05H89v9.15h-1.76V18.77h2.23l4.02,9.81h0.07l4.01-9.81 h2.24V31.2H98.05z M109.72,31.2h-1.78v-1.56h-0.04c-0.52,1.09-1.42,1.66-2.81,1.66c-1.97,0-3.18-1.27-3.18-3.35v-5.81h1.86 v5.45c0,1.38,0.65,2.11,1.94,2.11c1.34,0,2.15-0.93,2.15-2.34v-5.22h1.86V31.2z M115.01,22.04c2.01,0,3.45,1.11,3.49,2.71h-1.75c-0.08-0.8-0.76-1.29-1.79-1.29c-1.01,0-1.68,0.46-1.68,1.17 c0,0.54,0.45,0.9,1.39,1.14l1.53,0.35c1.83,0.44,2.51,1.11,2.51,2.44c0,1.64-1.55,2.76-3.76,2.76c-2.14,0-3.57-1.09-3.71-2.75 h1.84c0.13,0.87,0.83,1.34,1.96,1.34c1.11,0,1.81-0.46,1.81-1.18c0-0.56-0.34-0.86-1.29-1.10l-1.62-0.4 c-1.64-0.4-2.46-1.23-2.46-2.49C111.46,23.13,112.9,22.04,115.01,22.04z M120.16,19.75c0-0.59,0.48-1.07,1.08-1.07c0.6,0,1.09,0.47,1.09,1.07c0,0.59-0.48,1.06-1.09,1.06 C120.64,20.81,120.16,20.34,120.16,19.75z M120.3,22.14h1.86v9.06h-1.86V22.14z M130.17,25.26c-0.16-0.96-0.91-1.67-2.14-1.67c-1.43,0-2.38,1.2-2.38,3.08c0,1.93,0.96,3.09,2.39,3.09 c1.15,0,1.91-0.58,2.12-1.63h1.79c-0.21,1.9-1.73,3.18-3.93,3.18c-2.58,0-4.27-1.77-4.27-4.64c0-2.82,1.69-4.64,4.25-4.64 c2.33,0,3.77,1.47,3.93,3.23H130.17z"/>
                <path fill={`url(#apple-music-gradient-${song.id})`} fillRule="evenodd" clipRule="evenodd" d="M32.71,15.29c0-0.3,0-0.6,0-0.9c0-0.25,0-0.51-0.01-0.76c-0.01-0.55-0.05-1.11-0.15-1.65 c-0.1-0.55-0.26-1.07-0.52-1.57c-0.25-0.49-0.58-0.95-0.97-1.34c-0.39-0.39-0.84-0.72-1.34-0.97c-0.5-0.26-1.02-0.42-1.57-0.52 c-0.55-0.1-1.1-0.13-1.65-0.15c-0.25-0.01-0.51-0.01-0.76-0.01c-0.3,0-0.6,0-0.9,0h-9.42c-0.3,0-0.6,0-0.9,0 c-0.25,0-0.51,0-0.76,0.01c-0.55,0.01-1.11,0.05-1.65,0.15c-0.55,0.1-1.07,0.26-1.57,0.52C10.04,8.35,9.59,8.67,9.2,9.07 C8.8,9.46,8.48,9.91,8.22,10.4c-0.26,0.5-0.42,1.02-0.52,1.57c-0.1,0.55-0.13,1.1-0.15,1.65c-0.01,0.25-0.01,0.51-0.01,0.76 c0,0.3,0,0.6,0,0.9v9.42c0,0.3,0,0.6,0,0.9c0,0.25,0,0.51,0.01,0.76c0.01,0.55,0.05,1.11,0.15,1.65c0.1,0.55,0.26,1.07,0.52,1.57 c0.25,0.49,0.58,0.95,0.97,1.34c0.39,0.39,0.84,0.72,1.34,0.97c0.5,0.26,1.02,0.42,1.57,0.52c0.55,0.1,1.1,0.13,1.65,0.15 c0.25,0.01,0.51,0.01,0.76,0.01c0.3,0,0.6,0,0.9,0h9.42c0.3,0,0.6,0,0.9,0c0.25,0,0.51,0,0.76-0.01c0.55-0.01,1.11-0.05,1.65-0.15 c0.55-0.1,1.07-0.26,1.57-0.52c0.49-0.25,0.95-0.58,1.34-0.97c0.39-0.39,0.72-0.84,0.97-1.34c0.26-0.5,0.42-1.02,0.52-1.57 c0.1-0.55,0.13-1.1,0.15-1.65c0.01-0.25,0.01-0.51,0.01-0.76c0-0.3,0-0.6,0-0.9V15.29z"/>
                <path fill="#FFFFFF" fillRule="evenodd" clipRule="evenodd" d="M25.34,11.26c-0.06,0.01-0.6,0.1-0.67,0.11l-7.48,1.51l0,0c-0.2,0.04-0.35,0.11-0.47,0.21 c-0.14,0.12-0.22,0.29-0.25,0.49c-0.01,0.04-0.02,0.13-0.02,0.25c0,0,0,7.64,0,9.36c0,0.22-0.02,0.43-0.17,0.61 c-0.15,0.18-0.33,0.24-0.55,0.28l-0.49,0.1c-0.62,0.12-1.02,0.21-1.38,0.35c-0.35,0.14-0.61,0.31-0.82,0.52 c-0.41,0.43-0.58,1.02-0.52,1.56c0.05,0.47,0.26,0.91,0.62,1.25c0.24,0.22,0.55,0.39,0.91,0.47c0.37,0.08,0.77,0.05,1.35-0.07 c0.31-0.06,0.6-0.16,0.87-0.32c0.27-0.16,0.51-0.38,0.69-0.64c0.18-0.26,0.3-0.55,0.37-0.86c0.07-0.32,0.08-0.61,0.08-0.93V17.4 c0-0.44,0.12-0.55,0.47-0.63c0,0,6.22-1.25,6.51-1.31c0.4-0.08,0.6,0.04,0.6,0.46l0,5.54c0,0.22,0,0.44-0.15,0.62 c-0.15,0.18-0.33,0.24-0.55,0.28c-0.16,0.03-0.33,0.07-0.49,0.1c-0.62,0.12-1.02,0.21-1.38,0.35c-0.35,0.14-0.61,0.31-0.82,0.52 c-0.41,0.43-0.59,1.02-0.54,1.56c0.05,0.47,0.27,0.91,0.64,1.25c0.24,0.22,0.55,0.39,0.91,0.46c0.37,0.08,0.77,0.05,1.35-0.07 c0.31-0.06,0.6-0.15,0.87-0.32c0.27-0.16,0.51-0.38,0.69-0.64c0.18-0.26,0.3-0.55,0.37-0.86c0.07-0.32,0.07-0.61,0.07-0.93V11.92 C25.97,11.49,25.74,11.23,25.34,11.26z"/>
              </svg>
              <span className="text-xs opacity-75 ml-1">✓</span>
            </a>
          ) : (
            // On-demand button
            <button
              onClick={() => handleListenOnPlatform('apple')}
              disabled={platformLinkStates.apple.loading}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              title={platformLinkStates.apple.loading ? "Finding link..." : "Listen on Apple Music"}
            >
              {platformLinkStates.apple.loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">Finding...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.997 6.124a9.14 9.14 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.24-3.04-.486-.27-.97-.51-1.5-.69-.537-.18-1.088-.29-1.653-.335a11.78 11.78 0 00-2.332.002c-1.99.13-3.86.67-5.62 1.57-1.86.95-3.45 2.24-4.79 3.82-.16.19-.32.39-.48.58a27.47 27.47 0 00-1.77 2.51c-.47.79-.82 1.63-1.08 2.52-.14.48-.26.97-.35 1.47-.1.52-.15 1.05-.17 1.58-.04.96.03 1.92.19 2.87.16.96.44 1.89.82 2.77.39.9.89 1.72 1.51 2.45.63.74 1.38 1.34 2.24 1.78a5.51 5.51 0 001.8.59c.75.12 1.51.13 2.27.03.91-.12 1.74-.44 2.52-.89.78-.44 1.47-1.01 2.06-1.69.34-.39.66-.8.95-1.23.31-.46.59-.93.84-1.43.26-.51.47-1.04.64-1.58.17-.55.3-1.11.38-1.68.07-.48.12-.96.14-1.45.02-.75-.01-1.5-.13-2.24zm-2.02 6.49c-.09.57-.23 1.12-.41 1.66-.19.56-.44 1.1-.75 1.61-.18.3-.37.59-.58.87-.26.36-.55.69-.88 1-.46.43-1 .73-1.6.89-.63.17-1.28.19-1.93.06-.65-.13-1.23-.43-1.75-.86-.51-.42-.92-.95-1.24-1.55-.32-.6-.53-1.25-.64-1.92-.11-.68-.12-1.37-.03-2.06.09-.69.28-1.36.56-2 .27-.62.62-1.18 1.05-1.68.42-.5.93-.91 1.5-1.21.56-.3 1.17-.48 1.81-.53.65-.05 1.3.02 1.94.19.64.17 1.24.45 1.77.85.54.4.98.9 1.32 1.49.34.59.55 1.23.63 1.9.09.68.08 1.37-.04 2.05z"/>
                  </svg>
                  <span className="font-medium">Apple Music</span>
                </>
              )}
            </button>
          )}

          {/* YouTube Button */}
          <button
            onClick={() => handleListenOnPlatform('youtube')}
            disabled={platformLinkStates.youtube.loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FF0000] text-white hover:bg-[#e60000] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            title="Search on YouTube"
          >
            {platformLinkStates.youtube.loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Opening...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M23 7.5s-.2-2-1-2.8c-.8-.9-1.7-1-2.2-1C16.3 3.3 12 3.3 12 3.3s-4.3 0-7.8.4c-.5 0-1.4.1-2.2 1C1.2 5.5 1 7.5 1 7.5S.8 9.7.8 12s.2 4.5.2 4.5.2 2 1 2.8 1.7 1 2.2 1c3.5.4 7.8.4 7.8.4s4.3 0 7.8-.4c.5 0 1.4-.1 2.2-1 .8-.8 1-2.8 1-2.8s.2-2.3.2-4.5-.2-4.5-.2-4.5ZM9.8 15.6V8.4l6.2 3.6-6.2 3.6Z" />
                </svg>
                <span className="font-medium">YouTube</span>
              </>
            )}
          </button>

          {/* Tidal Button */}
          <button
            onClick={() => handleListenOnPlatform('tidal')}
            disabled={platformLinkStates.tidal.loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg border border-gray-700"
            title="Search on Tidal"
          >
            {platformLinkStates.tidal.loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Opening...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M12 0 L18 6 L12 12 L6 6 Z M12 12 L18 18 L12 24 L6 18 Z M0 12 L6 18 L12 12 L6 6 Z M12 12 L18 6 L24 12 L18 18 Z"/>
                </svg>
                <span className="font-medium">Tidal</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DECISION BUTTONS */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-300">Your decision:</span>
        {feedbackOptions.map((option) => (
          <button
            key={option}
            onClick={() => {
              if (option === "keep") {
                handleKeep();
              } else {
                set("feedback", option);
                setShowPlaylistModal(false);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              song.feedback === option
                ? option === "keep"
                  ? "bg-green-600 text-white border-green-600"
                  : option === "skip"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-gray-600 text-white border-gray-600"
                : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
            }`}
          >
            {option === "keep" && "✓ Keep"}
            {option === "skip" && "✗ Skip"}
            {option === "pending" && "⏳ Pending"}
          </button>
        ))}

        {song.feedback === 'keep' && (
          <button
            onClick={() => setShowPlaylistModal(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
          >
            <span>📚</span>
            <span>Add to Playlist</span>
            {playlistCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-700 text-xs font-bold">
                {playlistCount}
              </span>
            )}
          </button>
        )}

        {playlistCount > 0 && song.feedback !== 'keep' && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">·</span>
            <button
              onClick={() => setShowPlaylistModal(true)}
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>📁</span>
              <span>In {playlistCount} playlist{playlistCount !== 1 ? "s" : ""}</span>
            </button>
          </div>
        )}

        {song.overallSyncStatus === 'all_failed' && (
          <button
            onClick={handleMarkAsResolved}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-transparent text-emerald-400 border border-emerald-400 hover:bg-emerald-900/20 transition-colors inline-flex items-center gap-1"
            title="Mark as manually resolved"
          >
            <span>✓</span>
            <span>Mark as Resolved</span>
          </button>
        )}
      </div>

      {/* 🆕 USER FEEDBACK FIELD */}
      <div className="mt-3 mb-2">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          📝 Your feedback (will be sent back to ChatGPT):
        </label>
        <textarea
          value={song.userFeedback ?? ""}
          onChange={(e) => set("userFeedback", e.target.value)}
          placeholder="Tell ChatGPT why you kept/skipped this song, or what you'd like more of..."
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          Example: "Love the groove" · "Too slow for this context" · "More like this please"
        </p>
      </div>

      {/* Playlist Modal */}
      {showPlaylistModal && (
        <AddToPlaylistModal
          open={showPlaylistModal}
          onOpenChange={setShowPlaylistModal}
          songId={song.id}
          playlists={playlists}
          onTogglePlaylist={(playlistId, add) => {
            if (add) {
              onAddToPlaylist(playlistId, song.id);
            } else {
              onRemoveFromPlaylist(playlistId, song.id);
            }
          }}
          onCreateNewPlaylist={onOpenCreatePlaylist}
        />
      )}
    </div>
  );
};
