// src/components/CreatePlaylistModal.tsx
/**
 * Modal for creating a new playlist
 * Allows user to name the playlist, add description, and select songs
 * 
 * NOW PASSES FULL SONG OBJECTS (not just IDs)
 */

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Song } from "../types/song";
import type { Playlist, CreatePlaylistInput } from "../types/playlist";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songs: Song[];
  existingPlaylists: Playlist[];
  onCreatePlaylist: (input: CreatePlaylistInput) => void;
};

export function CreatePlaylistModal({
  open,
  onOpenChange,
  songs,
  existingPlaylists,
  onCreatePlaylist,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"empty" | "select" | "keep">("keep");

  // Helper: check if playlist name already exists (case-insensitive, trimmed)
  const playlistNameExists = (candidate: string) => {
    const trimmed = candidate.trim().toLowerCase();
    if (!trimmed) return false;
    return existingPlaylists.some(
      (p) => p.name.trim().toLowerCase() === trimmed
    );
  };

  // Get songs marked as "keep"
  const keepSongs = songs.filter((s) => s.feedback === "keep");

  // Reset form when modal opens/closes - COMBINED LOGIC
  useEffect(() => {
    if (open) {
      // Reset form fields
      setName("");
      setDescription("");
      setIsPublic(false);
      setError("");
      
      // Determine default mode
      const defaultMode = keepSongs.length > 0 ? "keep" : "empty";
      setMode(defaultMode);
      
      // Set initial selected songs based on mode
      if (defaultMode === "keep") {
        const ids = songs
          .filter((s) => s.feedback === "keep" && s.verificationStatus !== "failed")
          .map((s) => s.id);
        setSelectedSongIds(new Set(ids));
      } else {
        setSelectedSongIds(new Set());
      }
    }
  }, [open]); // Only depend on 'open' to avoid re-runs

  // Handle mode changes (when user clicks mode buttons)
  useEffect(() => {
    if (!open) return; // Only run when modal is open
    
    if (mode === "keep") {
      const ids = songs
        .filter((s) => s.feedback === "keep" && s.verificationStatus !== "failed")
        .map((s) => s.id);
      setSelectedSongIds(new Set(ids));
    } else if (mode === "empty") {
      setSelectedSongIds(new Set());
    }
    // For "select", we don't auto-change current selection
  }, [mode]); // Only depend on mode changes

  const handleCreate = () => {
    const trimmedName = name.trim();

    // Validation
    if (!trimmedName) {
      setError("Playlist name is required");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Playlist name must be 100 characters or less");
      return;
    }

    if (playlistNameExists(trimmedName)) {
      setError("A playlist with this name already exists");
      return;
    }

    // Get full song objects (not just IDs!)
    const selectedSongs = songs.filter(song => selectedSongIds.has(song.id));

    // Create playlist
    onCreatePlaylist({
      name: trimmedName,
      description: description.trim() || undefined,
      songs: selectedSongs, // Full Song objects!
      isPublic,
    });

    // Close modal
    onOpenChange(false);

    // Show success message
    const songCount = selectedSongs.length;
    alert(
      `✅ Playlist "${trimmedName}" created with ${songCount} song${
        songCount !== 1 ? "s" : ""
      }!`
    );
  };

  const toggleSong = (songId: string) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allSongIds = songs
      .filter((s) => s.verificationStatus !== "failed")
      .map((s) => s.id);
    setSelectedSongIds(new Set(allSongIds));
  };

  const deselectAll = () => {
    setSelectedSongIds(new Set());
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-gray-800 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-auto">
          <Dialog.Title className="text-lg font-semibold text-white mb-2">
            Create New Playlist
          </Dialog.Title>

          <Dialog.Description className="text-sm text-gray-400 mb-4">
            ⚠️ Playlists are saved locally. Clearing browser cache will delete
            them. Push to Spotify to backup!
          </Dialog.Description>

          <div className="space-y-4">
            {/* Playlist Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Playlist Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="My Awesome Playlist"
                className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-700 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {name.length}/100 characters
              </p>
              {error && (
                <p className="text-xs text-red-400 mt-1">
                  {error}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this playlist about?"
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-700 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                maxLength={300}
              />
            </div>

            {/* Public/Private */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-500 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-300">
                Make public on Spotify (when pushed)
              </label>
            </div>

            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Initial Songs
              </label>
              <div className="flex gap-2">
                {keepSongs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMode("keep")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mode === "keep"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    Keep Songs ({keepSongs.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "select"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Select Songs
                </button>
                <button
                  type="button"
                  onClick={() => setMode("empty")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "empty"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Start Empty
                </button>
              </div>
            </div>

            {/* Song Selection */}
            {mode === "select" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Select Songs ({selectedSongIds.size} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-xs text-gray-400 hover:text-gray-300"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-700 rounded-lg p-2">
                  {songs
                    .filter((s) => s.verificationStatus !== "failed")
                    .map((song) => {
                      const checked = selectedSongIds.has(song.id);
                      return (
                        <label
                          key={song.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-650 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSong(song.id)}
                            className="w-4 h-4 text-emerald-600 border-gray-500 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-white truncate">
                            {song.title}{" "}
                            <span className="text-gray-400">· {song.artist}</span>
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              disabled={!name.trim()}
            >
              Create Playlist
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
