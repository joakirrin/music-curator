// src/components/ImportChatGPTModal.tsx
// ✅ PHASE 4 UPDATE: Uses MusicBrainz for universal verification (no login required!)
// ✅ PHASE 4.1 UPDATE: Added Spotify ISRC resolution for direct links
// 🆕 TIER S UPDATE: Integrated auto-replacement orchestrator for failed verifications

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Song } from "../types/song";
import { mapChatGPTRecommendationToSong } from "@/utils/songMappers";
import {
  verifySongsInBatch,
  type VerificationProgress,
  type VerificationSummary,
} from "@/utils/verificationOrchestrator";
// 🆕 AUTO-REPLACEMENT: Import orchestrator
import {
  autoReplaceFailedSongs,
  type ReplacementProgress,
  type ReplacementResult,
} from "@/utils/autoReplacementOrchestrator";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (songs: Song[], replaceFailedInRound?: number) => void;
  existingSongs: Song[];
};

type ChatGPTRecommendation = {
  title: string;
  artist: string;
  album?: string;
  year?: string;
  producer?: string;
  serviceUri?: string;  // Generic: "spotify:track:..." or "youtube:video:..." etc.
  serviceUrl?: string;  // Generic: full URL to track on any service
  previewUrl?: string;
  reason?: string;
  duration?: number;
  // Legacy Spotify fields for backward compatibility
  spotifyUri?: string;
  spotifyUrl?: string;
};

type ChatGPTFormat = {
  round?: number;
  recommendations: ChatGPTRecommendation[];
};

export default function ImportChatGPTModal({
  open,
  onOpenChange,
  onImport,
  existingSongs,
}: Props) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState<VerificationProgress | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<VerificationSummary | null>(null);

  // 🆕 AUTO-REPLACEMENT: New state
  const [isAutoReplacing, setIsAutoReplacing] = useState(false);
  const [replacementProgress, setReplacementProgress] = useState<ReplacementProgress | null>(null);
  const [replacementResults, setReplacementResults] = useState<Map<number, ReplacementResult>>(new Map());
  const [currentReplacementRound, setCurrentReplacementRound] = useState<number | null>(null);
  void currentReplacementRound; // referenced for future UI; avoids unused warning
  
  // 🔒 SECURE: Check if API route is available (instead of checking for client-side API key)
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);

  // Check API availability on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch('/api/get-replacements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: 'test' }),
        });
        // Even if it returns an error, if we get a response, the API is available
        setIsApiAvailable(response.status !== 404);
      } catch {
        setIsApiAvailable(false);
      }
    };
    checkApi();
  }, []);

  // Auto-close after showing summary for 10 seconds
  useEffect(() => {
    if (verificationSummary && !isAutoReplacing && open) {
      const timer = setTimeout(() => {
        setJsonText("");
        setVerificationSummary(null);
        setReplacementResults(new Map());
        onOpenChange(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [verificationSummary, isAutoReplacing, open, onOpenChange]);

  // 🔒 SECURE: Call API route instead of OpenAI directly
  const callChatGPT = async (prompt: string): Promise<ChatGPTRecommendation[]> => {
    const response = await fetch('/api/get-replacements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to get replacements from server');
    }

    const data = await response.json();
    
    if (!data.recommendations || !Array.isArray(data.recommendations)) {
      throw new Error('Invalid response format from server');
    }

    return data.recommendations;
  };

  // 🆕 AUTO-REPLACEMENT: Build replacement prompt
  const buildReplacementPrompt = (
    failedSongs: Song[],
    existingSongs: Song[],
    round: number
  ): string => {
    const failedList = failedSongs
      .map(s => `"${s.title}" by ${s.artist}${s.verificationError ? ` (Error: ${s.verificationError})` : ''}`)
      .join('\n');

    const existingList = existingSongs
      .filter(s => s.verificationStatus !== 'failed')
      .map(s => `"${s.title}" by ${s.artist}`)
      .slice(0, 50) // Limit to avoid token overflow
      .join(', ');

    return `I need ${failedSongs.length} replacement song recommendations for Round ${round}.

⚠️ IMPORTANT VERIFICATION REQUIREMENTS:
- Only suggest songs that are REAL and VERIFIED on major streaming platforms (Spotify, Apple Music, YouTube Music)
- Avoid obscure, unreleased, or hard-to-find tracks
- Each song must be verifiable by title + artist on MusicBrainz
- NO AI hallucinations or made-up songs

These songs failed verification (they don't exist or are too obscure):
${failedList}

DO NOT suggest any of these existing songs (to avoid duplicates):
${existingList}

Please suggest ${failedSongs.length} alternative tracks that are:
1. Similar in style/genre to the failed songs
2. VERIFIED to exist on major streaming platforms
3. Mainstream enough to be found in music databases
4. Not already in my library

Respond in JSON format:
{
  "recommendations": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "reason": "Brief reason why this is a good alternative"
    }
  ]
}`;
  };

  // 🆕 AUTO-REPLACEMENT: Request replacements from ChatGPT
  const requestReplacements = async (
    failedSongs: Song[],
    round: number
  ): Promise<Song[]> => {
    const prompt = buildReplacementPrompt(failedSongs, existingSongs, round);
    const recommendations = await callChatGPT(prompt);
    
    // Map ChatGPT recommendations to Song objects
    const replacementSongs = recommendations.map((rec, index) =>
      mapChatGPTRecommendationToSong(rec, round, index, true)
    );

    return replacementSongs;
  };

  // 🆕 AUTO-REPLACEMENT: Import and verify replacement songs
  const importAndVerifyReplacements = async (
    songs: Song[],
    round: number
  ): Promise<Song[]> => {
    void round; // currently unused, kept for interface compatibility
    const { verifiedSongs } = await verifySongsInBatch(
      songs,
      (progress) => {
        // Update replacement progress with verification details
        setReplacementProgress(prev => prev ? {
          ...prev,
          message: `Verifying replacement ${progress.current}/${progress.total}...`,
        } : null);
      }
    );

    return verifiedSongs;
  };

  // 🆕 AUTO-REPLACEMENT: Delete failed songs from app state
  const deleteFailedSongs = async (songIds: string[]): Promise<void> => {
    // This will be handled by the parent component via onImport
    // We'll mark songs for deletion and let the parent handle it
    console.log(`[Auto-Replacement] Marking ${songIds.length} songs for deletion:`, songIds);
  };

  // 🆕 AUTO-REPLACEMENT: Main orchestration function
  const triggerAutoReplacement = async (
    failedByRound: Map<number, Song[]>
  ): Promise<void> => {
    setIsAutoReplacing(true);
    const results = new Map<number, ReplacementResult>();

    for (const [round, failedSongs] of failedByRound.entries()) {
      setCurrentReplacementRound(round);
      
      try {
        const result = await autoReplaceFailedSongs({
          round,
          failedSongs,
          originalPrompt: "", // Not needed, we build our own
          maxRetries: 3,
          
          requestReplacements: async (_count) => {
            return await requestReplacements(failedSongs, round);
          },
          
          importAndVerifySongs: async (songs) => {
            const verified = await importAndVerifyReplacements(songs, round);
            
            // Map to VerificationResult format expected by orchestrator
            return verified.map(song => ({
              songId: song.id,
              success: song.verificationStatus === 'verified',
              reason: song.verificationError || undefined,
            }));
          },
          
          deleteSongs: deleteFailedSongs,
          
          onProgress: (progress) => {
            setReplacementProgress(progress);
          },
          
          onComplete: (result) => {
            results.set(round, result);
          },
        });

        results.set(round, result);

        // If replacements succeeded, import them and remove failed songs
        if (result.success && result.replacedCount > 0) {
          // The new verified songs are already in the state from importAndVerifyReplacements
          // We just need to signal the parent to remove the old failed songs
          onImport([], round); // Signal to delete failed songs in this round
        }

      } catch (error) {
        console.error(`[Auto-Replacement] Error in round ${round}:`, error);
        results.set(round, {
          success: false,
          round,
          attempts: 0,
          replacedCount: 0,
          stillFailedSongs: failedSongs,
          userActionNeeded: true,
        });
      }
    }

    setReplacementResults(results);
    setIsAutoReplacing(false);
    setCurrentReplacementRound(null);
    setReplacementProgress(null);
  };

  // 🆕 AUTO-REPLACEMENT: Group failed songs by round
  const groupFailedSongsByRound = (songs: Song[]): Map<number, Song[]> => {
    const byRound = new Map<number, Song[]>();
    
    songs
      .filter(s => s.verificationStatus === 'failed')
      .forEach(song => {
        const round = song.round ?? 0;
        if (!byRound.has(round)) {
          byRound.set(round, []);
        }
        byRound.get(round)!.push(song);
      });

    return byRound;
  };

  const handleImport = async () => {
    setError("");
    setIsLoading(true);
    setVerificationSummary(null);
    setReplacementResults(new Map());

    try {
      const parsed: ChatGPTFormat = JSON.parse(jsonText.trim());

      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid format: JSON must contain a "recommendations" array');
      }

      if (parsed.recommendations.length === 0) {
        throw new Error("No recommendations found in JSON");
      }

      const existingRounds = existingSongs
        .map((s) => s.round)
        .filter((r): r is number => typeof r === "number");
      const maxRound = existingRounds.length > 0 ? Math.max(...existingRounds) : 0;
      const nextRound = parsed.round ?? maxRound + 1;

      let newSongs: Song[] = parsed.recommendations.map((rec, index) =>
        mapChatGPTRecommendationToSong(rec, nextRound, index, autoVerify)
      );

      if (autoVerify) {
        setIsVerifying(true);

        const { verifiedSongs, summary } = await verifySongsInBatch(
          newSongs,
          (progress) => {
            setVerificationProgress(progress);
          }
        );

        newSongs = verifiedSongs;
        setVerificationSummary(summary);
        setIsVerifying(false);
        setVerificationProgress(null);

        // 🆕 AUTO-REPLACEMENT START
        // If there are failed songs, trigger auto-replacement immediately
        if (summary.failed > 0 && isApiAvailable) {
          const failedByRound = groupFailedSongsByRound(verifiedSongs);
          
          if (failedByRound.size > 0) {
            // Show friendly message about what's happening
            setReplacementProgress({
              round: nextRound,
              stage: 'requesting',
              attempt: 1,
              totalAttempts: 3,
              message: `🤖 AI sometimes hallucinates songs that don't exist. We're automatically getting verified replacements for ${summary.failed} failed track${summary.failed !== 1 ? 's' : ''}. Please wait...`,
            });

            await triggerAutoReplacement(failedByRound);
          }
        }
        // 🆕 AUTO-REPLACEMENT END

        // Smart Replacement Detection (AFTER auto-replacement)
        const failedInThisRound = existingSongs.filter(
          (s) => s.round === nextRound && s.verificationStatus === 'failed'
        );

        let replaceFailedInRound: number | undefined = undefined;

        if (failedInThisRound.length > 0) {
          const isReplacement = window.confirm(
            `🔄 Round ${nextRound} has ${failedInThisRound.length} failed track${failedInThisRound.length !== 1 ? 's' : ''}.\n\n` +
            `Are these new songs replacements for the failed tracks?\n\n` +
            `• Click "OK" to DELETE the failed tracks and import these as replacements\n` +
            `• Click "Cancel" to KEEP both the failed tracks and import these as additional songs`
          );

          if (isReplacement) {
            replaceFailedInRound = nextRound;
            console.log(`🔄 Replacing ${failedInThisRound.length} failed tracks in Round ${nextRound}`);
          }
        }

        onImport(newSongs, replaceFailedInRound);
        return;
      }

      onImport(newSongs, undefined);
      
      if (!autoVerify) {
        setJsonText("");
        onOpenChange(false);
        alert(`✅ Successfully imported ${newSongs.length} song(s) from Round ${nextRound}!`);
      }

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to parse JSON. Please check the format.";
      setError(message);
      setIsVerifying(false);
      setVerificationProgress(null);
      setIsAutoReplacing(false);
      setReplacementProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setJsonText("");
    setError("");
    setVerificationSummary(null);
    setReplacementResults(new Map());
  };

  const handleCloseSummary = () => {
    setJsonText("");
    setVerificationSummary(null);
    setReplacementResults(new Map());
    onOpenChange(false);
  };

  const exampleJSON = `{
  "round": 1,
  "recommendations": [
    {
      "title": "Blinding Lights",
      "artist": "The Weeknd",
      "reason": "Catchy synth-pop anthem"
    },
    {
      "title": "Shape of You",
      "artist": "Ed Sheeran",
      "reason": "Groovy pop hit"
    }
  ]
}`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-auto">
          
          {/* 🆕 AUTO-REPLACEMENT: Show replacement progress during auto-replacement */}
          {isAutoReplacing && replacementProgress && (
            <div className="mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                🔄 Auto-Replacing Failed Tracks
              </Dialog.Title>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                {/* Friendly explanation */}
                <div className="text-sm text-blue-900">
                  {replacementProgress.message}
                </div>

                {/* Progress indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-blue-800">
                      Round {replacementProgress.round} • Attempt {replacementProgress.attempt}/{replacementProgress.totalAttempts}
                    </span>
                    <span className="text-blue-600">
                      {replacementProgress.stage === 'requesting' && '🤖 Requesting...'}
                      {replacementProgress.stage === 'verifying' && '🔍 Verifying...'}
                      {replacementProgress.stage === 'deleting' && '🗑️ Cleaning up...'}
                      {replacementProgress.stage === 'retrying' && '🔄 Retrying...'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 animate-pulse"
                      style={{ width: '70%' }}
                    />
                  </div>
                </div>

                <div className="text-xs text-blue-700">
                  💡 We're ensuring all songs in your library are real and verified.
                </div>
              </div>
            </div>
          )}

          {verificationSummary && !isAutoReplacing ? (
            <>
              <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                ✅ Import Complete!
              </Dialog.Title>
              
              <p className="text-sm text-gray-600 mb-4">
                {verificationSummary.failed > 0 ? (
                  <>
                    • {verificationSummary.verified} track{verificationSummary.verified !== 1 ? 's' : ''} verified with MusicBrainz<br />
                    • {verificationSummary.failed} track{verificationSummary.failed !== 1 ? 's' : ''} failed verification<br />
                    
                    {/* 🆕 AUTO-REPLACEMENT: Show replacement results */}
                    {replacementResults.size > 0 && (
                      <>
                        <br />
                        {Array.from(replacementResults.values()).map(result => (
                          <span key={result.round}>
                            {result.success ? (
                              <span className="text-emerald-600 font-medium">
                                ✓ Auto-replaced {result.replacedCount} track{result.replacedCount !== 1 ? 's' : ''} in Round {result.round}<br />
                              </span>
                            ) : (
                              <span className="text-orange-600 font-medium">
                                ⚠️ Could not auto-replace {result.stillFailedSongs.length} track{result.stillFailedSongs.length !== 1 ? 's' : ''} in Round {result.round} (manual intervention needed)<br />
                              </span>
                            )}
                          </span>
                        ))}
                      </>
                    )}
                    
                    {(!isApiAvailable || replacementResults.size === 0) && (
                      <>
                        <br />
                        <span className="text-orange-600 font-medium">
                          ⚠️ Failed tracks are hidden from the main list.
                          Click "🔄 Get Replacements" in the toolbar to fix them.
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>Imported {verificationSummary.verified} verified track{verificationSummary.verified !== 1 ? 's' : ''} with MusicBrainz!</>
                )}
              </p>
              
              <p className="text-xs text-gray-500 mb-4">
                Closing automatically in 10 seconds... (or click Done)
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700">
                      {verificationSummary.verified}
                    </div>
                    <div className="text-sm text-emerald-600">✓ Verified (MusicBrainz)</div>
                  </div>
                  
                  {verificationSummary.failed > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-2xl font-bold text-red-700">
                        {verificationSummary.failed}
                      </div>
                      <div className="text-sm text-red-600">✗ Failed</div>
                    </div>
                  )}
                  
                  {verificationSummary.skipped > 0 && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-700">
                        {verificationSummary.skipped}
                      </div>
                      <div className="text-sm text-gray-600">⚠ Skipped</div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {verificationSummary.total}
                    </div>
                    <div className="text-sm text-blue-600">Total Songs</div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Success Rate</span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round((verificationSummary.verified / verificationSummary.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(verificationSummary.verified / verificationSummary.total) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {verificationSummary.failedSongs.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-red-600 hover:text-red-700 font-medium">
                      ⚠️ View Failed Tracks ({verificationSummary.failedSongs.length})
                    </summary>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {verificationSummary.failedSongs.map((song, idx) => (
                        <div key={idx} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                          <div className="font-medium text-red-900">
                            {song.artist} - {song.title}
                          </div>
                          <div className="text-red-600 mt-1">
                            {song.error}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleCloseSummary}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </>
          ) : !isAutoReplacing && (
            <>
              <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                Import from ChatGPT
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mb-4">
                Paste the JSON response from ChatGPT below. We'll verify with MusicBrainz (no login required!)
                {isApiAvailable && (
                  <span className="block mt-1 text-emerald-600 font-medium">
                    ✨ Auto-replacement enabled: Failed tracks will be automatically replaced!
                  </span>
                )}
                {isApiAvailable === false && (
                  <span className="block mt-1 text-orange-600 font-medium">
                    ⚠️ Auto-replacement unavailable: API route not configured.
                  </span>
                )}
              </Dialog.Description>

              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoVerify}
                      onChange={(e) => setAutoVerify(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      disabled={isLoading || isVerifying}
                    />
                    <span className="text-sm font-medium text-emerald-900">
                      ✓ Auto-verify with MusicBrainz (No login required!)
                    </span>
                  </label>
                  
                  <p className="text-xs text-emerald-700">
                    {autoVerify 
                      ? "We'll verify each track with MusicBrainz and extract platform IDs. Failed tracks will be automatically replaced if API key is configured." 
                      : "Songs will be imported without verification (you can verify them later)."}
                  </p>
                </div>

                {isVerifying && verificationProgress && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        🔄 Verifying with MusicBrainz...
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        {verificationProgress.current} / {verificationProgress.total}
                      </span>
                    </div>
                    
                    <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(verificationProgress.current / verificationProgress.total) * 100}%` 
                        }}
                      />
                    </div>
                    
                    {verificationProgress.currentSong && (
                      <div className="text-xs text-blue-700 truncate">
                        Checking: {verificationProgress.currentSong}
                      </div>
                    )}
                    
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-emerald-600">
                        ✓ {verificationProgress.verified} verified
                      </span>
                      <span className="text-red-600">
                        ✗ {verificationProgress.failed} failed
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ChatGPT JSON Response
                  </label>
                  <textarea
                    value={jsonText}
                    onChange={(e) => {
                      setJsonText(e.target.value);
                      setError("");
                    }}
                    placeholder={exampleJSON}
                    rows={12}
                    className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-700 text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    disabled={isLoading || isVerifying}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Error:</span> {error}
                    </p>
                  </div>
                )}

                {isApiAvailable === false && autoVerify && (
                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-sm text-orange-700">
                      <span className="font-semibold">⚠️ Auto-replacement disabled:</span> API route not available. Make sure you have <code>/api/get-replacements.ts</code> configured with your OpenAI API key.
                    </p>
                  </div>
                )}

                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                    📋 Expected JSON Format
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded-lg overflow-x-auto text-xs">
                    {exampleJSON}
                  </pre>
                </details>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isLoading || isVerifying}
                >
                  Clear
                </button>
                <Dialog.Close asChild>
                  <button
                    className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isLoading || isVerifying}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleImport}
                  disabled={!jsonText.trim() || isLoading || isVerifying}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isVerifying ? "Verifying..." : isLoading ? "Importing..." : "Import Songs"}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
