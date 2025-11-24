// src/App.tsx - FINAL VERSION with GDPR Compliance + Export Verification + AUDIO PREVIEW + CHAT UI
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

// 🆕 PHASE 2: Chat UI Integration
import ChatPanel from "./components/ChatPanel";
import { useChatState } from "./hooks/useChatState";
import { verifySongsInBatch } from "./utils/verificationOrchestrator";

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

  // 🆕 PHASE 2: Chat state
  const {
    messages,
    currentRound,
    isOpen: isChatOpen,
    isLoading: isChatLoading,
    addMessage,
    updateLastMessage,
    incrementRound,
    toggleChat,
    clearHistory,
    setIsLoading: setChatLoading,
  } = useChatState();

  // 🆕 PHASE 2.2: Pre-filled message for feedback
  const [preFilledMessage, setPreFilledMessage] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (isChatOpen && preFilledMessage) {
      const timer = setTimeout(() => setPreFilledMessage(undefined), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isChatOpen, preFilledMessage]);

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

  // 🆕 PHASE 2.5: Auto-import and verify songs from chat
  const handleChatImportSongs = useCallback(
    async (newSongs: Song[]) => {
      try {
        // 1. Add songs to state immediately (with "checking" status)
        setSongs((prev) => [...prev, ...newSongs]);

        // 2. Run verification in background
        const { verifiedSongs, summary } = await verifySongsInBatch(
          newSongs,
          (progress) => {
            // Update last chat message with progress
            updateLastMessage({
              verificationProgress: {
                total: progress.total,
                verified: progress.verified,
                failed: progress.failed,
              },
            });
          }
        );

        // 3. Update songs with verification results
        setSongs((prev) => {
          const updatedSongs = prev.map((song) => {
            const verified = verifiedSongs.find((v) => v.id === song.id);
            return verified || song;
          });
          return updatedSongs;
        });

        // 4. Update last chat message as complete
        updateLastMessage({
          verificationStatus: "complete",
          verificationProgress: {
            total: summary.total,
            verified: summary.verified,
            failed: summary.failed,
          },
        });

        // ✅ ANALYTICS: Track chat import success
        if (clarity.isInitialized()) {
          clarity.event('chat_import_completed', {
            total: summary.total,
            verified: summary.verified,
            failed: summary.failed,
          });
        }
      } catch (err) {
        console.error("[App] Failed to verify chat songs:", err);
        updateLastMessage({
          verificationStatus: "failed",
        });
      }
    },
    [setSongs, updateLastMessage]
  );

  // --- Filtering ---
const filtered = useMemo(() => {
    let result = songs;

    // 🆕 ALWAYS exclude failed songs unless specifically filtering for them
    if (verificationFilter !== "failed") {
      result = result.filter((s) => s.verificationStatus !== "failed");
    }

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
    // Filter only verified songs with decisions
    const verifiedSongs = songs.filter(
      (s) => s.verificationStatus === "verified" && (s.feedback === "keep" || s.feedback === "skip")
    );
    
    if (verifiedSongs.length === 0) {
      alert("⚠️ No verified songs with decisions to export.");
      return;
    }
    
    const lines: string[] = [];
    lines.push("Based on my library feedback:\n");
    
    const keep = verifiedSongs.filter((s) => s.feedback === "keep");
    const skip = verifiedSongs.filter((s) => s.feedback === "skip");
    
    // KEEP songs
    if (keep.length > 0) {
      lines.push(`✓ Kept: ${keep.map(s => {
        const feedback = s.userFeedback ? ` (${s.userFeedback})` : '';
        return `"${s.title}" by ${s.artist}${feedback}`;
      }).join(', ')}`);
    }
    
    // SKIP songs
    if (skip.length > 0) {
      lines.push(`\n✗ Skipped: ${skip.map(s => {
        const feedback = s.userFeedback ? ` (${s.userFeedback})` : '';
        return `"${s.title}" by ${s.artist}${feedback}`;
      }).join(', ')}`);
    }
    
    lines.push("\n\nGive me 5 new refined recommendations based on what I kept.");
    
    const feedbackMessage = lines.join("\n");
    
    // 🆕 PHASE 2.2: Open chat with pre-filled message
    setPreFilledMessage(feedbackMessage);
    if (!isChatOpen) {
      toggleChat();
    }
    
    // ✅ ANALYTICS: Track feedback refinement
    if (clarity.isInitialized()) {
      clarity.event('feedback_refinement_requested', {
        kept: keep.length,
        skipped: skip.length,
      });
    }
  }, [songs, isChatOpen, toggleChat]);

const handleGetReplacements = useCallback(() => {
    const failedSongs = songs.filter((s) => s.verificationStatus === "failed");
    
    if (failedSongs.length === 0) {
      alert("⚠️ No failed tracks to get replacements for.");
      return;
    }
    
    const lines: string[] = [];
    lines.push("These tracks failed verification:");
    lines.push("");
    failedSongs.forEach((s) => {
      lines.push(`- "${s.title}" by ${s.artist}`);
      if (s.verificationError) lines.push(`  (Error: ${s.verificationError})`);
    });
    lines.push("");
    lines.push("Can you suggest alternative tracks that are similar but more mainstream/verified?");
    
    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    alert(`📋 Replacement prompt for ${failedSongs.length} failed track(s) copied! Paste it into ChatGPT.`);
  }, [songs]);

const handleCopyReplacementPrompt = useCallback(() => {
    // Filter failed songs from the current songs list
    const failedSongs = songs.filter((s) => s.verificationStatus === "failed");
    
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
  }, [songs]);


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
              onExportFeedback={handleExportFeedback}
              onGetReplacements={handleGetReplacements}
              onOpenPlaylistsDrawer={() => setIsPlaylistsDrawerOpen(true)}
              onOpenCreatePlaylist={() => setIsCreatePlaylistModalOpen(true)}
              onOpenChat={toggleChat}
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
          <EmptyState onOpenChat={toggleChat} onOpenGuide={() => setDrawerOpen(true)} />
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

        {/* 🆕 PHASE 2: Chat Panel */}
        <ChatPanel
          isOpen={isChatOpen}
          messages={messages}
          isLoading={isChatLoading}
          currentRound={currentRound}
          onClose={toggleChat}
          onClearHistory={clearHistory}
          onAddMessage={addMessage}
          onUpdateLastMessage={updateLastMessage}
          onSetLoading={setChatLoading}
          onIncrementRound={incrementRound}
          onImportSongs={handleChatImportSongs}
      preFilledMessage={preFilledMessage}
    />
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
