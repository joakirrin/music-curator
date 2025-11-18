// src/components/ChatGPTSongRow.tsx
import { useState } from "react";
import type { Song } from "../types/song";
import type { Playlist } from "../types/playlist";
import { formatDistanceToNow } from "date-fns";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

type Props = {
  song: Song;
  onUpdate: (next: Song) => void;
  onDelete: () => void;
  onOpenCreatePlaylist: () => void;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: string, songId: string) => void;
  onRemoveFromPlaylist: (playlistId: string, songId: string) => void;
};

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

  // Changed from showPlaylistDropdown to showPlaylistModal
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

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

  const spotifyHref = `https://open.spotify.com/search/${encodeURIComponent(
    `${song.artist} ${song.title}`,
  )}`;
  const youtubeHref = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${song.artist} ${song.title}`,
  )}`;

  const playlistCount = playlists.filter(p => p.songs.some(s => s.id === song.id)).length;

  return (
    <div className="container mx-auto px-4 py-4 border-b border-gray-700 bg-gray-700 hover:bg-gray-650 transition-colors overflow-hidden">
      {/* TOP META ROW */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
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
            {song.verificationStatus === "verified" && "✓ Verified"}
            {song.verificationStatus === "checking" && "🔄 Checking..."}
            {song.verificationStatus === "failed" && "✗ Failed"}
            {song.verificationStatus === "unverified" && "⚠️ Unverified"}
          </span>
        )}

        {song.round && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-900 text-emerald-300 border border-emerald-700">
            Round {song.round}
          </span>
        )}

        {song.duration && (
          <span className="px-2 py-1 rounded-full text-xs text-gray-300 bg-gray-600">
            ⏱️ {formatDuration(song.duration)}
          </span>
        )}

        {/* Platform badges */}
        <div className="flex items-center gap-3">
          <a
            href={spotifyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-[#1DB954] text-white shadow-md hover:shadow-xl hover:bg-[#1ed760] transition-all active:scale-95"
            title="Search on Spotify"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current"
            >
              <path d="M12 0a12 12 0 100 24 12 12 0 000-24Zm5.2 16.7a.9.9 0 01-1.2.3c-3.2-2-7.6-2.5-12.3-1.3a.9.9 0 01-.4-1.7c5.1-1.3 10.2-.7 13.9 1.6a.9.9 0 01.4 1.1Zm1.7-3.6a1 1 0 01-1.3.3c-3.7-2.3-9.3-3-13.5-1.6a1 1 0 11-.6-1.9c4.9-1.5 11.2-.7 15.5 2a1 1 0 01-.1 1.2Zm.1-3.8c-4.3-2.6-11.4-2.8-15.8-1.5a1.2 1.2 0 11-.7-2.2c5.1-1.5 13-1.2 18 1.8a1.2 1.2 0 01-1.3 2Z" />
            </svg>
          </a>

          <a
            href={youtubeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-[#FF0000] text-white shadow-md hover:shadow-xl hover:bg-[#e60000] transition-all active:scale-95"
            title="Search on YouTube"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current"
            >
              <path d="M23 7.5s-.2-2-1-2.8c-.8-.9-1.7-1-2.2-1C16.3 3.3 12 3.3 12 3.3s-4.3 0-7.8.4c-.5 0-1.4.1-2.2 1C1.2 5.5 1 7.5 1 7.5S.8 9.7.8 12s.2 4.5.2 4.5.2 2 1 2.8 1.7 1 2.2 1c3.5.4 7.8.4 7.8.4s4.3 0 7.8-.4c.5 0 1.4-.1 2.2-1 .8-.8 1-2.8 1-2.8s.2-2.3.2-4.5-.2-4.5-.2-4.5ZM9.8 15.6V8.4l6.2 3.6-6.2 3.6Z" />
            </svg>
          </a>
        </div>

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

          {/* Artist · Album · Year */}
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
          </div>

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

      {/* DECISION BUTTONS */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
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
            {option === "pending" && "⏸ Pending"}
          </button>
        ))}

        {/* Add to Playlist button - NO MORE RELATIVE WRAPPER */}
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
      </div>

      {/* FEEDBACK */}
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
          Example: "Love the groove" · "Too slow for this context" · "More like this please".
        </p>
      </div>

      {/* EXTRA platform metadata if exists */}
      {song.platforms && song.platforms.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-medium text-gray-400">
            Available on:
          </span>
          {song.platforms.map((platform) => (
            <span
              key={platform}
              className="px-2 py-1 rounded-full text-xs bg-gray-600 text-gray-200 border border-gray-500"
            >
              {platform}
            </span>
          ))}
        </div>
      )}

      {/* Modal - renders at root level, not inside relative container */}
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
    </div>
  );
};
