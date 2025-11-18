// src/App.tsx
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { spotifyAuth } from "./services/spotifyAuth";

import { Header } from "./components/Header";
import Toolbar from "./components/Toolbar";
import FilterBar from "./components/FilterBar";
import { ChatGPTSongRow } from "./components/ChatGPTSongRow";
import ImportChatGPTModal from "./components/ImportChatGPTModal";
import FailedTracksModal from "./components/FailedTracksModal";
import { FeedbackFAB } from "./components/FeedbackFAB";
import type { FilterType, VerificationFilterType, Song } from "./types/song";
import { useSongsState } from "./hooks/useLocalState";

// Playlist imports
import { usePlaylistsState } from "./hooks/usePlaylistsState";
import { CreatePlaylistModal } from "./components/CreatePlaylistModal";
import { PlaylistsDrawer } from "./components/PlaylistsDrawer";

// Guide / Empty state onboarding
import GuideDrawer from "@/components/GuideDrawer";
import EmptyState from "@/components/EmptyState";
import { useOnboardingFlag } from "@/hooks/useOnboardingFlag";
import "@/styles/guide.css";

const DEV = import.meta.env.DEV;

export default function App() {
  // --- Onboarding / Guide ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { open: onboardingOpen, close: onboardingClose } = useOnboardingFlag();

  // --- Core state ---
  const { songs, setSongs } = useSongsState([]);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilterType>("all");
  const [search, setSearch] = useState("");
  const [isChatGPTModalOpen, setIsChatGPTModalOpen] = useState(false);
  const [isFailedTracksModalOpen, setIsFailedTracksModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | "all">("all");

  // Playlist state
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    addSongsToPlaylist,
    removeSongsFromPlaylist,
    markAsSynced, // ✅ NEW: For Spotify integration
  } = usePlaylistsState();

  // Playlist modal states
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
  const [isPlaylistsDrawerOpen, setIsPlaylistsDrawerOpen] = useState(false);

  // OAuth callback handler
  const callbackHandledRef = useRef(false);

  useEffect(() => {
    if (callbackHandledRef.current) {
      if (DEV) console.log("[App] ⏭️ Skipping duplicate callback (already handled)");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (error) {
      if (DEV) {
        console.error("[App] OAuth error:", error, errorDescription);
      }
      alert(`❌ Spotify login error: ${error}\n${errorDescription || ''}`);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (code && state) {
      callbackHandledRef.current = true;

      if (DEV) {
        console.log("[App] 🔄 OAuth callback detected");
        console.log("[App] Code:", code.substring(0, 20) + "...");
        console.log("[App] State:", state);
      }
      
      spotifyAuth.handleCallback(code, state).then((success) => {
        window.history.replaceState({}, "", window.location.pathname);
        
        if (success) {
          if (DEV) console.log("[App] ✅ Login successful");
          alert("✅ Successfully logged in to Spotify!");
        } else {
          if (DEV) console.error("[App] ❌ Login failed");
          alert("❌ Login failed. Please check console and try again.");
        }
      }).catch((err) => {
        if (DEV) console.error("[App] ❌ Callback handler exception:", err);
        alert("❌ Login error. Please check console and try again.");
        window.history.replaceState({}, "", window.location.pathname);
      });
    }
  }, []);

  const hasContent = songs.length > 0;

  const handleChatGPTImport = useCallback(
    (incoming: Song[], replaceFailedInRound?: number) => {
      let updatedSongs = [...songs];

      if (replaceFailedInRound !== undefined) {
        updatedSongs = updatedSongs.filter(
          (s) => !(s.round === replaceFailedInRound && s.verificationStatus === "failed")
        );
      }

      setSongs([...updatedSongs, ...incoming]);
      setFilterType("all");
      if (incoming.length > 0 && incoming[0].round) {
        setSelectedRound(incoming[0].round);
      }
    },
    [songs, setSongs]
  );

  const onClear = useCallback(() => {
    if (confirm("Delete all songs from library?\n\nNote: Songs in playlists will NOT be deleted.")) {
      setSongs([]);
      setSelectedRound("all");
    }
  }, [setSongs]);

  const updateSong = useCallback(
    (id: string, next: Song) => {
      setSongs(songs.map((s) => (s.id === id ? next : s)));
    },
    [songs, setSongs]
  );

  /**
   * Delete song from library
   * Song will be removed from the library view, but will stay in playlists
   */
  const deleteSong = useCallback(
    (id: string) => {
      const song = songs.find(s => s.id === id);
      if (!song) return;

      // Check if song is in any playlist
      const isInPlaylists = playlists.some(p => p.songs.some(s => s.id === id));

      const message = isInPlaylists
        ? `Delete "${song.title}" from library?\n\n` +
          `⚠️ This song is in ${playlists.filter(p => p.songs.some(s => s.id === id)).length} playlist(s).\n\n` +
          `It will be removed from your library but will stay in your playlists.`
        : `Delete "${song.title}" from library?`;

      if (confirm(message)) {
        setSongs(songs.filter((s) => s.id !== id));
        
        if (isInPlaylists) {
          console.log(`[App] Song "${song.title}" deleted from library but preserved in playlists`);
        }
      }
    },
    [songs, setSongs, playlists]
  );

  /**
   * Add song to playlist (now passes full Song object)
   */
  const handleAddToPlaylist = useCallback((playlistId: string, songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song) {
      console.error('[App] Song not found:', songId);
      return;
    }
    
    // Pass full song object to playlist
    addSongsToPlaylist(playlistId, [song]);
  }, [songs, addSongsToPlaylist]);

  /**
   * Remove song from playlist (by ID)
   */
  const handleRemoveFromPlaylist = useCallback((playlistId: string, songId: string) => {
    removeSongsFromPlaylist(playlistId, [songId]);
  }, [removeSongsFromPlaylist]);

  /**
   * ✅ NEW: Mark playlist as synced after successful Spotify push
   */
  const handleMarkAsSynced = useCallback((
    playlistId: string,
    spotifyPlaylistId: string,
    spotifyUrl: string
  ) => {
    markAsSynced(playlistId, spotifyPlaylistId, spotifyUrl);
    console.log(`[App] ✅ Playlist marked as synced: ${playlistId}`);
  }, [markAsSynced]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let base = songs.filter((s) => s.verificationStatus !== "failed");

    if (selectedRound !== "all") {
      base = base.filter((s) => s.round === selectedRound);
    }

    base = base.filter((s) => {
      const hay = [
        s.title,
        s.artist,
        s.featuring ?? "",
        s.album ?? "",
        s.year ?? "",
        s.producer ?? "",
        s.comments ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    switch (verificationFilter) {
      case "verified":
        base = base.filter((s) => s.verificationStatus === "verified");
        break;
      case "unverified":
        base = base.filter((s) => s.verificationStatus === "unverified" || !s.verificationStatus);
        break;
      case "failed":
        return [];
    }

    switch (filterType) {
      case "keep":
        return base.filter((s) => s.feedback === "keep");
      case "skip":
        return base.filter((s) => s.feedback === "skip");
      case "pending":
        return base.filter((s) => s.feedback === "pending" || !s.feedback);
      default:
        return base;
    }
  }, [songs, search, filterType, verificationFilter, selectedRound]);

  const handleGetReplacements = useCallback(() => {
    const failedTracks = songs.filter((s) => s.verificationStatus === "failed");
    if (failedTracks.length === 0) {
      alert("No failed tracks to replace! All songs are verified. 🎉");
      return;
    }
    setIsFailedTracksModalOpen(true);
  }, [songs]);

  const handleCopyReplacementPrompt = useCallback(() => {
    const failedTracks = songs.filter((s) => s.verificationStatus === "failed");
    const tracksByRound = failedTracks.reduce((acc, track) => {
      const round = track.round || 0;
      if (!acc[round]) acc[round] = [];
      acc[round].push(track);
      return acc;
    }, {} as Record<number, Song[]>);

    let prompt = `🔄 REPLACEMENT REQUEST\n\n`;
    prompt += `I need help replacing ${failedTracks.length} track${
      failedTracks.length !== 1 ? "s" : ""
    } that couldn't be verified on Spotify.\n\n`;

    Object.entries(tracksByRound).forEach(([round, tracks]) => {
      prompt += `💿 Round ${round}:\n`;
      tracks.forEach((track) => {
        prompt += `  • "${track.title}" by ${track.artist}\n`;
        if (track.verificationError) prompt += `    ❌ Error: ${track.verificationError}\n`;
        if (track.comments) prompt += `    💡 Original reason: "${track.comments}"\n`;
      });
      prompt += `\n`;
    });

    prompt += `🎯 Please suggest verified Spotify replacements with the same vibe and round.\n`;
    navigator.clipboard.writeText(prompt);
    alert("✅ Replacement prompt copied to clipboard!");
  }, [songs]);

  const handleExportFeedback = useCallback(() => {
    const songsWithFeedback = songs.filter((s) => s.feedback && s.feedback !== "pending");
    if (songsWithFeedback.length === 0) {
      alert("No feedback to export yet. Mark some songs as Keep or Skip first!");
      return;
    }

    const latestRound = Math.max(...songs.map((s) => s.round || 0));
    const feedbackData: any = {
      round: latestRound,
      summary: {
        total: songs.length,
        reviewed: songsWithFeedback.length,
        kept: songsWithFeedback.filter((s) => s.feedback === "keep").length,
        skipped: songsWithFeedback.filter((s) => s.feedback === "skip").length,
        verified: songs.filter((s) => s.verificationStatus === "verified").length,
      },
      feedback: songsWithFeedback.map((s) => ({
        requestedTitle: s.title,
        requestedArtist: s.artist,
        decision: s.feedback,
        userFeedback: s.userFeedback || "",
        verification:
          s.verificationStatus === "verified"
            ? { status: "verified", spotifyUrl: s.spotifyUrl, album: s.album, popularity: s.popularity }
            : undefined,
      })),
      instructions: `Use this feedback to improve future recommendations for Round ${latestRound + 1}.`,
    };

    navigator.clipboard.writeText(JSON.stringify(feedbackData, null, 2));
    alert("✅ Feedback copied to clipboard!");
  }, [songs]);

  const handleImportFromEmpty = () => setIsChatGPTModalOpen(true);

  return (
    <div className="min-h-screen bg-gray-800 flex flex-col">
      <Header onOpenGuide={() => setDrawerOpen(true)} />

      {hasContent ? (
        <>
          <Toolbar
            songs={songs}
            playlists={playlists}
            onClear={onClear}
            onOpenChatGPTModal={() => setIsChatGPTModalOpen(true)}
            onExportFeedback={handleExportFeedback}
            onGetReplacements={handleGetReplacements}
            onOpenPlaylistsDrawer={() => setIsPlaylistsDrawerOpen(true)}
            onOpenCreatePlaylist={() => setIsCreatePlaylistModalOpen(true)}
          />

          <FilterBar
            value={filterType}
            onChange={setFilterType}
            verificationFilter={verificationFilter}
            onVerificationFilterChange={setVerificationFilter}
            search={search}
            onSearch={setSearch}
            songs={songs}
            selectedRound={selectedRound}
            onRoundChange={setSelectedRound}
          />

          <div className="flex-1 pb-8">
            {filtered.map((s) => (
              <ChatGPTSongRow
                key={s.id}
                song={s}
                onUpdate={(next) => updateSong(s.id, next)}
                onDelete={() => deleteSong(s.id)}
                onOpenCreatePlaylist={() => setIsCreatePlaylistModalOpen(true)}
                playlists={playlists}
                onAddToPlaylist={handleAddToPlaylist}
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
              />
            ))}

            {filtered.length === 0 && (
              <div className="container mx-auto px-4 py-12 text-center text-gray-400">
                {verificationFilter === "failed" ? (
                  <>
                    Failed tracks are hidden from the main list.
                    <br />
                    <button
                      onClick={() => setIsFailedTracksModalOpen(true)}
                      className="mt-3 px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
                    >
                      🔄 View Failed Tracks
                    </button>
                  </>
                ) : selectedRound !== "all" ? (
                  <>
                    No songs in Round {selectedRound}.
                    <button
                      onClick={() => setSelectedRound("all")}
                      className="ml-2 text-emerald-400 hover:text-emerald-300 underline"
                    >
                      View all rounds
                    </button>
                  </>
                ) : filterType === "keep" ? (
                  "No songs marked as Keep yet. Click the ✓ Keep button on songs you like!"
                ) : filterType === "skip" ? (
                  "No songs marked as Skip yet. Click the ✗ Skip button on songs you want to skip!"
                ) : filterType === "pending" ? (
                  "No pending songs. All songs have been reviewed!"
                ) : (
                  <>
                    No songs yet. Click{" "}
                    <button
                      onClick={() => setIsChatGPTModalOpen(true)}
                      className="text-emerald-400 hover:text-emerald-300 underline"
                    >
                      🤖 Import from ChatGPT
                    </button>{" "}
                    to get started.
                  </>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyState onImport={handleImportFromEmpty} onOpenGuide={() => setDrawerOpen(true)} />
      )}

      {/* Modals */}
      <ImportChatGPTModal
        open={isChatGPTModalOpen}
        onOpenChange={setIsChatGPTModalOpen}
        onImport={handleChatGPTImport}
        existingSongs={songs}
      />

      <FailedTracksModal
        open={isFailedTracksModalOpen}
        onOpenChange={setIsFailedTracksModalOpen}
        songs={songs}
        onGetReplacements={handleCopyReplacementPrompt}
      />

      <CreatePlaylistModal
        open={isCreatePlaylistModalOpen}
        onOpenChange={setIsCreatePlaylistModalOpen}
        songs={songs}
        onCreatePlaylist={createPlaylist}
        existingPlaylists={playlists}
      />

      <PlaylistsDrawer
        open={isPlaylistsDrawerOpen}
        onOpenChange={setIsPlaylistsDrawerOpen}
        playlists={playlists}
        onDeletePlaylist={deletePlaylist}
        onOpenCreatePlaylist={() => {
          setIsCreatePlaylistModalOpen(true);
          setIsPlaylistsDrawerOpen(false);
        }}
        onRemoveSongFromPlaylist={handleRemoveFromPlaylist}
        onMarkAsSynced={handleMarkAsSynced} // ✅ NEW: Wire in Spotify sync handler
      />

      <GuideDrawer
        open={drawerOpen || onboardingOpen}
        onClose={() => {
          setDrawerOpen(false);
          onboardingClose();
        }}
      />
      
      <FeedbackFAB onOpenGuide={() => setDrawerOpen(true)} />
    </div>
  );
}
