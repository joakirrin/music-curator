// src/App.tsx - FINAL VERSION with GDPR Compliance + Export Verification + AUDIO PREVIEW
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

// ✅ ANALYTICS & PRIVACY: GDPR-compliant setup
import { clarity } from "./services/analytics/clarity";
import { ANALYTICS_CONFIG, hasAnalyticsConsent } from "./config/analytics";
import { CookieConsentBanner } from "./components/CookieConsent";
import { PrivacyRouteHandler } from "./components/PrivacyRouteHandler";

// 🆕 NEW IMPORTS - Audio Preview System
import { AudioProvider } from "./contexts/AudioContext";
import { Toaster } from "sonner";

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
    updatePlaylistSongsStatus,
    markAsSynced, // ✅ For Spotify integration
  } = usePlaylistsState();

  // Playlist modal states
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
  const [isPlaylistsDrawerOpen, setIsPlaylistsDrawerOpen] = useState(false);

  // ✅ ANALYTICS: Initialize Clarity (only if user already consented)
  useEffect(() => {
    if (hasAnalyticsConsent() && ANALYTICS_CONFIG.clarity.enabled) {
      clarity.init(ANALYTICS_CONFIG.clarity.projectId);
      clarity.event('app_opened');
      
      // Optional: Set user segment for analytics
      clarity.setTag('user_type', songs.length > 0 ? 'returning' : 'new');
    }
  }, [songs.length]); // Re-run when songs change to update user type

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
        console.log("[App] 🔑 OAuth callback detected");
        console.log("  code:", code?.substring(0, 20) + "...");
        console.log("  state:", state?.substring(0, 20) + "...");
      }

      (async () => {
        try {
          await spotifyAuth.handleCallback(code, state);
          if (DEV) console.log("[App] ✅ OAuth successful");
        } catch (err) {
          console.error("[App] ❌ OAuth failed:", err);
          alert("❌ Failed to authenticate with Spotify. Please try again.");
        } finally {
          window.history.replaceState({}, "", window.location.pathname);
        }
      })();
    }
  }, []);

  // --- Song logic ---
  const updateSong = useCallback(
    (id: string, updates: Partial<Song>) => {
      setSongs((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    [setSongs]
  );

  const deleteSong = useCallback(
    (id: string) => {
      const song = songs.find((s) => s.id === id);
      if (!song) return;

      if (window.confirm(`🗑️ Delete "${song.title}"?`)) {
        setSongs((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [setSongs, songs]
  );

  const onClear = useCallback(() => {
    if (songs.length === 0) return;
    if (window.confirm("🗑️ Clear ALL songs? This action cannot be undone.")) {
      setSongs([]);
    }
  }, [songs, setSongs]);

  const handleChatGPTImport = useCallback(
    (newSongs: Song[]) => {
      setSongs((prev) => [...prev, ...newSongs]);
      setIsChatGPTModalOpen(false);
    },
    [setSongs]
  );

  // --- Filtering ---
  const filtered = useMemo(() => {
    let result = songs;

    if (filterType !== "all") {
      result = result.filter((s) => s.feedback === filterType);
    }

    if (verificationFilter !== "all") {
      if (verificationFilter === "verified") {
        result = result.filter((s) => s.verificationStatus === "verified");
      } else if (verificationFilter === "unverified") {
        result = result.filter((s) => 
          s.verificationStatus !== "verified" && s.verificationStatus !== "failed"
        );
      } else if (verificationFilter === "failed") {
        result = result.filter((s) => s.verificationStatus === "failed");
      }
    }

    if (selectedRound !== "all") {
      result = result.filter((s) => s.round === selectedRound);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [songs, filterType, verificationFilter, selectedRound, search]);

  const hasContent = useMemo(() => songs.length > 0, [songs.length]);

  // --- Export logic ---
  const handleExportFeedback = useCallback(() => {
    const lines: string[] = [];
    lines.push("## Your Feedback Summary:\n");
    const keep = songs.filter((s) => s.feedback === "keep");
    const skip = songs.filter((s) => s.feedback === "skip");
    if (keep.length > 0) {
      lines.push("### ✓ Keep:\n");
      keep.forEach((s) => lines.push(`- "${s.title}" by ${s.artist}`));
      lines.push("");
    }
    if (skip.length > 0) {
      lines.push("### ✗ Skip:\n");
      skip.forEach((s) => lines.push(`- "${s.title}" by ${s.artist}`));
    }
    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    alert("📋 Feedback copied to clipboard!");
  }, [songs]);

  const handleGetReplacements = useCallback(() => {
    // Get songs that failed verification (not songs marked as skip)
    const failedSongs = songs.filter((s) => s.verificationStatus === "failed");
    
    if (failedSongs.length === 0) {
      alert("⚠️ No failed tracks found. All songs verified successfully!");
      return;
    }
    
    const lines: string[] = [];
    lines.push("These tracks failed verification and couldn't be found:");
    lines.push("");
    failedSongs.forEach((s) => lines.push(`- "${s.title}" by ${s.artist}`));
    lines.push("");
    lines.push("Can you suggest alternative tracks that are similar but more mainstream/verified?");
    
    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    alert(`📋 Replacement prompt for ${failedSongs.length} failed track(s) copied! Paste it into ChatGPT.`);
  }, [songs]);

  const handleCopyReplacementPrompt = useCallback(
    (failedSongs: Song[]) => {
      if (failedSongs.length === 0) {
        alert("⚠️ No failed tracks to copy.");
        return;
      }

      const lines: string[] = [];
      lines.push("These tracks failed verification:");
      failedSongs.forEach((s) => lines.push(`- "${s.title}" by ${s.artist}`));
      lines.push("");
      lines.push("Can you suggest alternative tracks that would be similar and are more mainstream/verified?");

      const text = lines.join("\n");
      navigator.clipboard.writeText(text);
      alert("📋 Replacement prompt copied! Paste it into ChatGPT.");
    },
    []
  );

  // --- Playlist logic ---
  const handleAddToPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      const song = songs.find((s) => s.id === songId);
      if (!song) return;
      addSongsToPlaylist(playlistId, [song]);
    },
    [songs, addSongsToPlaylist]
  );

  const handleRemoveFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      removeSongsFromPlaylist(playlistId, [songId]);
    },
    [removeSongsFromPlaylist]
  );

  const handleRemoveSongFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      if (window.confirm("🗑️ Remove this song from the playlist?")) {
        removeSongsFromPlaylist(playlistId, [songId]);
      }
    },
    [removeSongsFromPlaylist]
  );

  const handleOpenCreatePlaylist = useCallback(() => {
    setIsPlaylistsDrawerOpen(false);
    setIsCreatePlaylistModalOpen(true);
  }, []);

  const handleImportFromEmpty = useCallback(() => {
    setIsChatGPTModalOpen(true);
    
    // ✅ ANALYTICS: Track import modal open from empty state (GDPR compliant)
    if (clarity.isInitialized()) {
      clarity.event('import_modal_opened_from_empty');
      clarity.setTag('user_journey', 'first_time');
    }
  }, []);

  return (
    // 🆕 WRAP EVERYTHING WITH AudioProvider - THIS IS THE ONLY CHANGE IN THE RETURN STATEMENT
    <AudioProvider>
      <div className="min-h-screen bg-gray-800 flex flex-col">
        {/* ✅ GDPR-COMPLIANT PRIVACY SYSTEM */}
        <CookieConsentBanner />
        <PrivacyRouteHandler />

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
          onOpenCreatePlaylist={handleOpenCreatePlaylist}
          onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
          onMarkAsSynced={markAsSynced}
          onUpdatePlaylistSongs={updatePlaylistSongsStatus}
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

      {/* 🆕 ADD TOASTER FOR NOTIFICATIONS */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
        }}
      />
    </AudioProvider>
  );
}
