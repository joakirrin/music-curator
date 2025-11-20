// src/components/ImportChatGPTModal.tsx
// ✅ PHASE 4 UPDATE: Uses MusicBrainz for universal verification (no login required!)
// ✅ PHASE 4.1 UPDATE: Added Spotify ISRC resolution for direct links

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Song } from "../types/song";
import { verifyWithMusicBrainz } from "../services/verification/musicBrainzVerification";
import type { VerificationResult } from "../services/verification/verificationTypes";
import { spotifyAuth } from "../services/spotifyAuth";
import { resolveSpotifyByISRC } from "../services/spotifyIsrcResolver";
import { resolveAppleMusic } from "../services/appleMusicResolver";

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

type VerificationProgress = {
  total: number;
  current: number;
  verified: number;
  failed: number;
  currentSong?: string;
};

type VerificationSummary = {
  total: number;
  verified: number;
  failed: number;
  skipped: number;
  failedSongs: Array<{ title: string; artist: string; error: string }>;
};

/**
 * Normalizes service link to URI format
 * Supports Spotify, YouTube, Apple Music URLs and converts them to URIs
 */
function normalizeServiceLink(input?: string): string | undefined {
  if (!input) return undefined;
  
  // Already a URI format
  if (input.includes(':')) return input;
  
  // Spotify URL
  const spotifyMatch = input.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) return `spotify:track:${spotifyMatch[1]}`;
  
  // YouTube URL
  const youtubeMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) return `youtube:video:${youtubeMatch[1]}`;
  
  // Apple Music URL
  const appleMusicMatch = input.match(/music\.apple\.com\/.*\/album\/.*\/(\d+)\?i=(\d+)/);
  if (appleMusicMatch) return `applemusic:track:${appleMusicMatch[2]}`;
  
  // Just an ID (assume Spotify for backward compatibility)
  if (input.match(/^[a-zA-Z0-9]{22}$/)) return `spotify:track:${input}`;
  
  return input;
}

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

  // Auto-close after showing summary for 10 seconds
  useEffect(() => {
    if (verificationSummary && open) {
      const timer = setTimeout(() => {
        setJsonText("");
        setVerificationSummary(null);
        onOpenChange(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [verificationSummary, open, onOpenChange]);

  const handleImport = async () => {
    setError("");
    setIsLoading(true);
    setVerificationSummary(null);

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

      let newSongs: Song[] = parsed.recommendations.map((rec, index) => {
        if (!rec.title || !rec.artist) {
          throw new Error(`Recommendation #${index + 1} is missing required fields (title or artist)`);
        }

        // Support both new service-agnostic fields and legacy Spotify fields
        const serviceLink = normalizeServiceLink(
          rec.serviceUri || rec.serviceUrl || rec.spotifyUri || rec.spotifyUrl
        );

        return {
          id: `chatgpt-${Date.now()}-${index}`,
          title: rec.title,
          artist: rec.artist,
          album: rec.album,
          year: rec.year,
          source: "chatgpt" as const,
          round: nextRound,
          feedback: "pending" as const,
          spotifyUri: serviceLink, // Store service link in spotifyUri for now (legacy field)
          addedAt: new Date().toISOString(),
          comments: rec.reason,
          duration: rec.duration,
          platforms: [],
          liked: false,
          toAdd: false,
          verificationStatus: autoVerify ? "checking" : undefined,
        };
      });

      if (autoVerify) {
        setIsVerifying(true);
        
        const summary: VerificationSummary = {
          total: newSongs.length,
          verified: 0,
          failed: 0,
          skipped: 0,
          failedSongs: [],
        };

        setVerificationProgress({
          total: newSongs.length,
          current: 0,
          verified: 0,
          failed: 0,
        });

        for (let i = 0; i < newSongs.length; i++) {
          const song = newSongs[i];
          
          setVerificationProgress({
            total: newSongs.length,
            current: i + 1,
            verified: summary.verified,
            failed: summary.failed,
            currentSong: `${song.artist} - ${song.title}`,
          });

          if (!song.artist || !song.title) {
            summary.skipped++;
            newSongs[i] = {
              ...song,
              verificationStatus: 'unverified',
            };
            continue;
          }

          try {
            let isVerified = false;
            let verificationSource: 'musicbrainz' | 'apple' | 'spotify' = 'musicbrainz';
            
            // ===================================================================
            // TIER 1: Try MusicBrainz first (best source - has ISRCs, metadata)
            // ===================================================================
            const mbResult: VerificationResult = await verifyWithMusicBrainz(
              song.artist,
              song.title
            );
            
            if (mbResult.verified) {
              // ✅ MusicBrainz success! Update song with all the data
              newSongs[i] = {
                ...song,
                verificationStatus: 'verified',
                verificationSource: 'musicbrainz',
                
                // MusicBrainz-specific fields
                musicBrainzId: mbResult.musicBrainzId,
                isrc: mbResult.isrc,
                albumArtUrl: mbResult.albumArtUrl,
                releaseId: mbResult.releaseId,

                // Metadata (prefer MusicBrainz over ChatGPT)
                artist: mbResult.artist,
                title: mbResult.title,
                album: mbResult.album || song.album,
                year: mbResult.year || song.year,
                duration: mbResult.duration,
                durationMs: mbResult.durationMs,
                
                // Platform IDs from MusicBrainz
                platformIds: mbResult.platformIds,
              };
              
              isVerified = true;
              verificationSource = 'musicbrainz';
              
              // Try to enhance with Spotify ISRC resolution (if user is logged in and ISRC exists)
              if (mbResult.isrc && !mbResult.platformIds?.spotify) {
                const spotifyToken = await spotifyAuth.getAccessToken();
                if (spotifyToken) {
                  const spotifyData = await resolveSpotifyByISRC(mbResult.isrc, spotifyToken);
                  if (spotifyData) {
                    if (!newSongs[i].platformIds) newSongs[i].platformIds = {};
                    newSongs[i].platformIds!.spotify = spotifyData;
                  }
                }
              }
              
              // Try to enhance with Apple Music resolution (always try - no auth needed)
              const appleMusicData = await resolveAppleMusic(mbResult.artist, mbResult.title);
              if (appleMusicData) {
                if (!newSongs[i].platformIds) newSongs[i].platformIds = {};
                newSongs[i].platformIds!.apple = appleMusicData;
                // Use iTunes artwork as fallback if Cover Art Archive didn't have it
                if (!newSongs[i].albumArtUrl && appleMusicData.artworkUrl) {
                  newSongs[i].albumArtUrl = appleMusicData.artworkUrl;
                }
              }
            } else {
              // ===================================================================
              // TIER 2: MusicBrainz failed → Try Apple Music (no auth required!)
              // ===================================================================
              const appleMusicData = await resolveAppleMusic(song.artist, song.title);
              
              if (appleMusicData) {
                // ✅ Apple Music success!
                newSongs[i] = {
                  ...song,
                  verificationStatus: 'verified',
                  verificationSource: 'apple',
                  
                  // Store Apple Music data
                  platformIds: {
                    apple: appleMusicData,
                  },
                  
                  // Use iTunes artwork
                  albumArtUrl: appleMusicData.artworkUrl,
                  
                  // Keep original metadata from ChatGPT (Apple Music API doesn't return detailed metadata in our simplified resolver)
                  artist: song.artist,
                  title: song.title,
                  album: song.album,
                  year: song.year,
                };
                
                isVerified = true;
                verificationSource = 'apple';
                
                // Try to enhance with Spotify (if user is logged in)
                const spotifyToken = await spotifyAuth.getAccessToken();
                if (spotifyToken) {
                  // Note: We can't use ISRC here since we don't have it from Apple Music
                  // This is a limitation - Spotify verification would need artist+title search
                  // For now, we skip Spotify enhancement when verifying via Apple Music
                }
              } else {
                // ===================================================================
                // TIER 3: Both failed → Mark as failed
                // ===================================================================
                // Note: We could add Spotify as a third tier here if needed,
                // but it requires user login, so we keep it optional
                
                newSongs[i] = {
                  ...song,
                  verificationStatus: 'failed',
                  verificationSource: 'multi',
                  verificationError: `Not found in MusicBrainz or Apple Music. ${mbResult.error || 'No details available.'}`,
                };
              }
            }
            
            // Update summary
            if (isVerified) {
              summary.verified++;
            } else {
              summary.failed++;
              summary.failedSongs.push({
                title: song.title,
                artist: song.artist,
                error: newSongs[i].verificationError || 'Verification failed',
              });
            }
            
          } catch (err) {
            // Catch-all error handler
            summary.failed++;
            summary.failedSongs.push({
              title: song.title,
              artist: song.artist,
              error: err instanceof Error ? err.message : 'Verification failed',
            });
            newSongs[i] = {
              ...song,
              verificationStatus: 'failed',
              verificationSource: 'multi',
              verificationError: err instanceof Error ? err.message : 'Verification failed',
            };
          }

          // Small delay to avoid hammering the API
          if (i < newSongs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        setVerificationSummary(summary);
        setIsVerifying(false);
        setVerificationProgress(null);

        // Smart Replacement Detection (AFTER verification)
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

    } catch (err: any) {
      setError(err.message || "Failed to parse JSON. Please check the format.");
      setIsVerifying(false);
      setVerificationProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setJsonText("");
    setError("");
    setVerificationSummary(null);
  };

  const handleCloseSummary = () => {
    setJsonText("");
    setVerificationSummary(null);
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
          
          {verificationSummary ? (
            <>
              <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                ✅ Import Complete!
              </Dialog.Title>
              
              <p className="text-sm text-gray-600 mb-4">
                {verificationSummary.failed > 0 ? (
                  <>
                    • {verificationSummary.verified} track{verificationSummary.verified !== 1 ? 's' : ''} verified with MusicBrainz<br />
                    • {verificationSummary.failed} track{verificationSummary.failed !== 1 ? 's' : ''} failed verification<br />
                    <br />
                    <span className="text-orange-600 font-medium">
                      ⚠️ Failed tracks are hidden from the main list.
                      Click "🔄 Get Replacements" in the toolbar to fix them.
                    </span>
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
          ) : (
            <>
              <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                Import from ChatGPT
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mb-4">
                Paste the JSON response from ChatGPT below. We'll verify with MusicBrainz (no login required!)
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
                      ? "We'll verify each track with MusicBrainz and extract platform IDs. Failed tracks will be hidden from the main list." 
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
