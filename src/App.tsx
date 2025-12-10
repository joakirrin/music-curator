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
import { ImportYouTubePlaylistModal } from "./components/ImportYouTubePlaylistModal";
import type { FilterType, VerificationFilterType, Song } from "./types/song";
import type { Playlist } from "./types/playlist";
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
import { mapChatGPTRecommendationToSong } from "./utils/songMappers";

const DEV = import.meta.env.DEV;

// 🆕 Parse timeout extension from user prompts
function parseTimeoutExtension(userMessage: string): number | null {
  const lowerMessage = userMessage.toLowerCase().trim();
  
  // Match patterns like:
  // "extend timeout to 60 seconds"
  // "extend timeout to 60s"
  // "set timeout to 60"
  // "increase timeout to 60"
  const patterns = [
    /(?:extend|set|increase|change)\s+timeout\s+to\s+(\d+)(?:\s*seconds?|s)?/,
    /timeout\s+(\d+)(?:\s*seconds?|s)?/,
  ];
  
  for (const pattern of patterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const seconds = parseInt(match[1]);
      // Only allow 30 or 60 seconds
      if (seconds === 30 || seconds === 60) {
        return seconds;
      }
    }
  }
  
  return null;
}

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
    updateChatMessage,
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
    replacePlaylist,
    updatePlaylistSongsStatus,
    markAsSynced, // ✅ For Spotify integration
  } = usePlaylistsState();

  // Playlist modal states
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
  const [isPlaylistsDrawerOpen, setIsPlaylistsDrawerOpen] = useState(false);
  // YouTube import modal state (Chunk 7)
  const [isImportYouTubeModalOpen, setIsImportYouTubeModalOpen] = useState(false);

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
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    // Skip if no OAuth params present
    if (!code && !state && !error) {
      return;
    }

    // Skip if already handled
    if (callbackHandledRef.current) {
      if (DEV) console.log("[App] ⏭️ Skipping duplicate callback (already handled)");
      return;
    }

    // Mark as handled immediately
    callbackHandledRef.current = true;

    // Handle OAuth errors
    if (error) {
      if (DEV) {
        console.error("[App] OAuth error:", error, errorDescription);
      }
      alert(`❌ Login error: ${error}\n${errorDescription || ''}`);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Check if this is an OAuth callback
    if (code && state) {
      // 🎯 CRITICAL: Determine which platform based on URL path
      const path = window.location.pathname;
      const isYouTubeCallback = path.includes('/callback/youtube');
      const isSpotifyCallback = path.includes('/callback') && !isYouTubeCallback;

      if (DEV) {
        console.log("[App] 🔑 OAuth callback detected");
        console.log("  Platform:", isYouTubeCallback ? 'YouTube' : isSpotifyCallback ? 'Spotify' : 'Unknown');
        console.log("  Path:", path);
        console.log("  code:", code?.substring(0, 20) + "...");
        console.log("  state:", state?.substring(0, 20) + "...");
      }

      (async () => {
        try {
          if (isYouTubeCallback) {
            // Handle YouTube callback
            if (DEV) console.log("[App] Calling youtubeAuth.handleCallback...");
            const { youtubeAuth } = await import('./services/youtubeAuth');
            const success = await youtubeAuth.handleCallback(code, state);
            if (DEV) console.log("[App] YouTube OAuth", success ? "✅ successful" : "❌ failed");
          } else if (isSpotifyCallback) {
            // Handle Spotify callback
            if (DEV) console.log("[App] Calling spotifyAuth.handleCallback...");
            const success = await spotifyAuth.handleCallback(code, state);
            if (DEV) console.log("[App] Spotify OAuth", success ? "✅ successful" : "❌ failed");
          } else {
            console.warn("[App] ⚠️ Unknown OAuth callback path:", path);
          }
        } catch (err) {
          console.error("[App] ❌ OAuth failed:", err);
          const platform = isYouTubeCallback ? 'YouTube' : 'Spotify';
          alert(`❌ Failed to authenticate with ${platform}. Please try again.`);
        } finally {
          // Clean up URL (remove query params and reset path to home)
          window.history.replaceState({}, "", window.location.pathname.replace(/\/callback.*$/, '/'));
        }
      })();
    }
  }, []);

  // 🆕 Timeout detection for hung verifications
  useEffect(() => {
    const checkTimeouts = setInterval(() => {
      messages.forEach(message => {
        // Only check messages that are actively verifying
        if (message.verificationStatus === 'in_progress' && message.verificationStartTime) {
          const timeoutSeconds = message.verificationTimeoutSeconds || 30;
          const elapsedSeconds = (Date.now() - message.verificationStartTime) / 1000;
          
          if (elapsedSeconds > timeoutSeconds) {
            console.log(`[Verification] Timeout after ${timeoutSeconds}s for message ${message.id}`);
            
            // Abort verification
            if (message.verificationAbortController) {
              message.verificationAbortController.abort();
            }
            
            // Update message status AND clear replacement status
            updateChatMessage(message.id, {
              verificationStatus: 'timeout',
              replacementStatus: undefined, // 🆕 Clear replacement animation
              replacementAttempt: undefined, // 🆕 Clear attempt counter
            });
            
            // Delete unverified songs (same logic as cancel)
            const verifiedCount = message.verificationProgress?.verified || 0;
            const totalCount = message.verificationProgress?.total || 0;
            const unverifiedCount = totalCount - verifiedCount;
            
            if (unverifiedCount > 0) {
              setSongs((prev) => {
                const updated = prev.filter(song => {
                  const isFromThisMessage = song.messageId === message.id || 
                                           (song.round === message.songs?.[0]?.round);
                  
                  if (!isFromThisMessage) return true;
                  if (song.verificationStatus === 'verified') return true;
                  
                  console.log(`[Verification] Timeout - Deleting: ${song.title}`);
                  return false;
                });
                
                return updated;
              });
              
              console.log(`[Verification] Timeout: Deleted ${unverifiedCount}, kept ${verifiedCount}`);
            }
          }
        }
      });
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(checkTimeouts);
  }, [messages, setSongs, updateChatMessage]);

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

  // 🆕 PHASE 2.5: Auto-import and verify songs from chat (WITH CANCELLATION SUPPORT)
  const handleChatImportSongs = useCallback(
    async (newSongs: Song[]) => {
      try {
        // 🆕 Create AbortController for cancellation support
        const abortController = new AbortController();
        
        // 1. Add songs to state immediately (with "checking" status)
        setSongs((prev) => [...prev, ...newSongs]);
        
        // 2. Initialize verification state in last message
        updateLastMessage({
          verificationStatus: 'in_progress', // 🆕 Set to in_progress
          verificationAbortController: abortController, // 🆕 Store controller
          verificationStartTime: Date.now(), // 🆕 Track start time
          verificationTimeoutSeconds: 30, // 🆕 Default 30s timeout
          verificationProgress: {
            total: newSongs.length,
            verified: 0,
            failed: 0,
          }
        });

        // 3. Run verification in background (WITH ABORT SIGNAL)
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
          },
          abortController.signal // 🆕 Pass abort signal for cancellation
        );
        
        // 4. Check if verification was aborted
        if (abortController.signal.aborted) {
          console.log('[Verification] Aborted by user or timeout');
          return; // Exit early, cleanup already handled by cancel/timeout handler
        }

        // 5. Update songs with verification results
        setSongs((prev) => {
          const updatedSongs = prev.map((song) => {
            const verified = verifiedSongs.find((v) => v.id === song.id);
            return verified || song;
          });
          return updatedSongs;
        });

        // 🆕 TIER S: AUTO-REPLACEMENT START
        // If there are failed songs (after ALL 4 verification tiers), automatically get replacements
        if (summary.failed > 0) {
          console.log(`[Auto-Replacement] ${summary.failed} songs failed all verification tiers`);
          const failedSongs = verifiedSongs.filter(s => s.verificationStatus === 'failed');
          const maxRetries = 3;
          let attempt = 0;
          let remainingFailed = [...failedSongs];

          while (attempt < maxRetries && remainingFailed.length > 0) {
            // 🆕 Check if aborted during auto-replacement
            if (abortController.signal.aborted) {
              console.log('[Auto-Replacement] Aborted during replacement');
              return;
            }

            attempt++;
            console.log(`[Auto-Replacement] Attempt ${attempt}/${maxRetries} for ${remainingFailed.length} songs`);
            
            try {
              // Update chat with replacement progress
              updateLastMessage({
                verificationProgress: {
                  total: summary.total,
                  verified: summary.verified,
                  failed: remainingFailed.length,
                },
                replacementStatus: 'requesting',
                replacementAttempt: attempt,
              });

              // Get replacements from OpenAI
              const { getReplacementsForInvalidSongs } = await import('@/services/openai/openaiService');
              const response = await getReplacementsForInvalidSongs({
                type: 'replacements',
                round: newSongs[0]?.round || currentRound,
                invalidSongs: remainingFailed.map(s => ({
                  title: s.title,
                  artist: s.artist,
                  reason: s.verificationError || 'Failed verification',
                })),
                requestedCount: remainingFailed.length,
              });

              if (!response.songsJson) {
                throw new Error('No replacement songs returned from OpenAI');
              }

              // 🆕 Check if aborted after OpenAI call
              if (abortController.signal.aborted) {
                console.log('[Auto-Replacement] Aborted after OpenAI call');
                return;
              }

              // Map replacement songs
              const replacementSongs = response.songsJson.recommendations.map((rec, index) =>
                mapChatGPTRecommendationToSong(
                  {
                    title: rec.title,
                    artist: rec.artist,
                    album: rec.album,
                    year: rec.year,
                    reason: rec.reason,
                    duration: rec.duration,
                  },
                  newSongs[0]?.round || currentRound,
                  summary.verified + index, // Continue indexing after verified songs
                  true // autoVerify
                )
              );

              // 🆕 Check if aborted before verifying replacements
              if (abortController.signal.aborted) {
                console.log('[Auto-Replacement] Aborted before verification');
                return;
              }

              // Update chat: verifying replacements
              updateLastMessage({
                replacementStatus: 'verifying',
                replacementAttempt: attempt,
              });

              // Verify replacement songs
              const { verifiedSongs: verifiedReplacements } = await verifySongsInBatch(
                replacementSongs,
                (progress) => {
                  updateLastMessage({
                    verificationProgress: {
                      total: summary.total + progress.total,
                      verified: summary.verified + progress.verified,
                      failed: progress.failed,
                    },
                    replacementStatus: 'verifying',
                    replacementAttempt: attempt,
                  });
                },
                abortController.signal // 🆕 Pass abort signal
              );

              // 🆕 Check if aborted after verification
              if (abortController.signal.aborted) {
                console.log('[Auto-Replacement] Aborted after verification');
                return;
              }

              // Check which replacements succeeded
              const successfulReplacements = verifiedReplacements.filter(
                s => s.verificationStatus === 'verified'
              );
              const failedReplacements = verifiedReplacements.filter(
                s => s.verificationStatus === 'failed'
              );

              console.log(`[Auto-Replacement] Attempt ${attempt} results: ${successfulReplacements.length} verified, ${failedReplacements.length} failed`);
              
              // Log which tier verified each successful replacement
              successfulReplacements.forEach(s => {
                console.log(`  ✓ "${s.title}" by ${s.artist} - verified via ${s.verificationSource}`);
              });

              if (successfulReplacements.length > 0) {
                // Delete ALL old failed songs that we tried to replace
                const failedIds = remainingFailed.map(s => s.id);
                
                setSongs((prev) => {
                  // Remove all failed songs we tried to replace
                  const withoutFailed = prev.filter(s => !failedIds.includes(s.id));
                  // Add ALL successful replacements
                  return [...withoutFailed, ...successfulReplacements];
                });

                // Update summary
                summary.verified += successfulReplacements.length;
                summary.failed = summary.failed - remainingFailed.length + failedReplacements.length;
              }

              // Update remaining failed songs for next retry
              remainingFailed = failedReplacements;

              if (remainingFailed.length === 0) {
                // All replacements successful!
                updateLastMessage({
                  replacementStatus: 'complete',
                  replacementAttempt: attempt,
                });
                break;
              }

            } catch (error) {
              console.error(`[App] Auto-replacement attempt ${attempt} failed:`, error);
              
              if (attempt >= maxRetries) {
                // Exhausted retries
                updateLastMessage({
                  replacementStatus: 'failed',
                  replacementAttempt: attempt,
                });
              }
            }
          }
        }
        // 🆕 TIER S: AUTO-REPLACEMENT END

        // 6. Mark verification as complete
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
        // 🆕 Handle abort errors gracefully
        if ((err as any)?.name === 'AbortError') {
          console.log('[Verification] Aborted');
          return;
        }
        
        console.error("[App] Failed to verify chat songs:", err);
        updateLastMessage({
          verificationStatus: "failed",
        });
      }
    },
    [setSongs, updateLastMessage, currentRound]
  );

  // 🆕 Cancel verification handler
  const handleCancelVerification = useCallback(
    (messageId: string) => {
      console.log(`[Verification] User cancelled verification for message ${messageId}`);
      
      // Find the message in chat
      const message = messages.find(m => m.id === messageId);
      if (!message) {
        console.warn('[Verification] Message not found for cancellation');
        return;
      }
      
      // Abort ongoing verification
      if (message.verificationAbortController) {
        message.verificationAbortController.abort();
        console.log('[Verification] Abort signal sent');
      }
      
      // Update message status to cancelled AND clear ALL verification/replacement state
      updateChatMessage(messageId, {
        verificationStatus: 'cancelled',
        replacementStatus: undefined, // Clear replacement animation
        replacementAttempt: undefined, // Clear attempt counter
      });
      
      // ALSO: Clear from the last message in case it's actively updating
      updateLastMessage({
        verificationStatus: 'cancelled',
        replacementStatus: undefined,
        replacementAttempt: undefined,
      });
      
      // Calculate how many songs to delete
      const verifiedCount = message.verificationProgress?.verified || 0;
      const totalCount = message.verificationProgress?.total || 0;
      const unverifiedCount = totalCount - verifiedCount;
      
      if (unverifiedCount > 0) {
        // Delete unverified songs (keep verified ones)
        setSongs((prev) => {
          const updated = prev.filter(song => {
            // Keep if: (1) verified, OR (2) from a different message
            const isFromThisMessage = song.messageId === messageId || 
                                     (song.round === message.songs?.[0]?.round);
            
            if (!isFromThisMessage) return true; // Keep songs from other messages
            if (song.verificationStatus === 'verified') return true; // Keep verified songs
            
            console.log(`[Verification] Deleting unverified: ${song.title} by ${song.artist}`);
            return false; // Delete unverified songs
          });
          
          return updated;
        });
        
        console.log(`[Verification] Deleted ${unverifiedCount} unverified songs, kept ${verifiedCount} verified`);
      }
    },
    [messages, setSongs, updateChatMessage]
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

  const handlePlaylistUpdate = useCallback((updatedPlaylist: Playlist) => {
    replacePlaylist(updatedPlaylist);
  }, [replacePlaylist]);

  /**
   * Handle playlist imported from YouTube (Chunk 7)
   */
  const handlePlaylistImported = useCallback((playlist: Playlist) => {
    // The playlist is already created with all songs,
    // we just need to add it to our playlists state
    createPlaylist({
      name: playlist.name,
      description: playlist.description,
      songs: playlist.songs,
      isPublic: playlist.isPublic,
    });
    
    // Note: The playlist already has platformPlaylists.youtube set from import
    // But since we're creating a new local playlist, we'd need to copy that over
    // For now, the imported songs are in the playlist, which is what matters
  }, [createPlaylist]);

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
              onOpenImportYouTube={() => setIsImportYouTubeModalOpen(true)} // 🆕 CHUNK 7
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
          onPlaylistUpdate={handlePlaylistUpdate}
          onMarkAsSynced={markAsSynced}
          onUpdatePlaylistSongs={updatePlaylistSongsStatus}
        />

        {/* 🆕 CHUNK 7: Import from YouTube Modal */}
        <ImportYouTubePlaylistModal
          isOpen={isImportYouTubeModalOpen}
          onClose={() => setIsImportYouTubeModalOpen(false)}
          onPlaylistImported={handlePlaylistImported}
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
          onUpdateChatMessage={updateChatMessage}
          onSetLoading={setChatLoading}
          onIncrementRound={incrementRound}
          onImportSongs={handleChatImportSongs}
          onCancelVerification={handleCancelVerification}
          parseTimeoutExtension={parseTimeoutExtension}
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
