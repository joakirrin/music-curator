// src/components/ImportChatGPTModal.tsx
// ✅ UPDATED: Now uses Spotify Search API + Auto-closes after summary

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Song } from "../types/song";
import { verifySong, applySongVerification } from "../services/spotifyVerification";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (songs: Song[]) => void;
  existingSongs: Song[];
};

type ChatGPTRecommendation = {
  title: string;
  artist: string;
  featuring?: string;
  album?: string;
  year?: string;
  producer?: string;
  spotifyUri?: string;
  spotifyUrl?: string;
  previewUrl?: string;
  reason?: string;
  duration?: number;
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

function normalizeSpotifyLink(input?: string): string | undefined {
  if (!input) return undefined;
  if (input.startsWith('spotify:track:')) return input;
  const urlMatch = input.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (urlMatch) return `spotify:track:${urlMatch[1]}`;
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
  const [excludeUnverified, setExcludeUnverified] = useState(true); // ✅ NEW: Default to true
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState<VerificationProgress | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<VerificationSummary | null>(null);

  // ✅ NEW: Auto-close after showing summary for 5 seconds
  useEffect(() => {
    if (verificationSummary && open) {
      const timer = setTimeout(() => {
        setJsonText("");
        setVerificationSummary(null);
        onOpenChange(false);
      }, 5000); // 5 seconds

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

        const spotifyLink = normalizeSpotifyLink(rec.spotifyUri || rec.spotifyUrl);

        return {
          id: `chatgpt-${Date.now()}-${index}`,
          title: rec.title,
          artist: rec.artist,
          featuring: rec.featuring,
          album: rec.album,
          year: rec.year,
          producer: rec.producer,
          source: "chatgpt" as const,
          round: nextRound,
          feedback: "pending" as const,
          spotifyUri: spotifyLink,
          previewUrl: rec.previewUrl,
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

          // ✅ UPDATED: Now searches Spotify by artist+title (ignores ChatGPT's link)
          if (!song.artist || !song.title) {
            summary.skipped++;
            newSongs[i] = {
              ...song,
              verificationStatus: 'unverified',
            };
            continue;
          }

          try {
            const result = await verifySong(song);
            newSongs[i] = applySongVerification(song, result);
            
            if (result.verificationStatus === 'verified') {
              summary.verified++;
            } else {
              summary.failed++;
              summary.failedSongs.push({
                title: song.title,
                artist: song.artist,
                error: result.verificationError || 'Unknown error',
              });
            }
          } catch (err) {
            summary.failed++;
            summary.failedSongs.push({
              title: song.title,
              artist: song.artist,
              error: err instanceof Error ? err.message : 'Verification failed',
            });
            newSongs[i] = {
              ...song,
              verificationStatus: 'failed',
              verificationError: err instanceof Error ? err.message : 'Verification failed',
            };
          }

          // Small delay to avoid rate limiting
          if (i < newSongs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        setVerificationSummary(summary);
        setIsVerifying(false);
        setVerificationProgress(null);

        // ✅ UPDATED: Filter out unverified tracks if option enabled
        if (excludeUnverified) {
          const beforeCount = newSongs.length;
          newSongs = newSongs.filter(song => song.verificationStatus === 'verified');
          const excludedCount = beforeCount - newSongs.length;
          
          if (excludedCount > 0) {
            // Update summary to show excluded count
            summary.skipped = 0; // Not skipped, they're excluded
          }
        }
      }

      onImport(newSongs);
      
      // ✅ UPDATED: Don't close immediately, show summary first
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

  // ✅ NEW: Manual close (if user wants to close before auto-close)
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
              
              {/* ✅ NEW: Better notification message */}
              <p className="text-sm text-gray-600 mb-4">
                {excludeUnverified && verificationSummary.failed > 0 ? (
                  <>
                    • {verificationSummary.verified} track{verificationSummary.verified !== 1 ? 's' : ''} verified and imported<br />
                    • {verificationSummary.failed} track{verificationSummary.failed !== 1 ? 's' : ''} excluded (could not verify on Spotify)<br />
                    <br />
                    <span className="text-xs text-gray-500">
                      These may be incorrect artist names or non-existent tracks.
                      Export feedback will help ChatGPT correct them.
                    </span>
                  </>
                ) : (
                  <>Imported {verificationSummary.verified} verified track{verificationSummary.verified !== 1 ? 's' : ''}!</>
                )}
              </p>
              
              {/* Auto-close countdown */}
              <p className="text-xs text-gray-500 mb-4">
                Closing automatically in 5 seconds... (or click Done)
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700">
                      {verificationSummary.verified}
                    </div>
                    <div className="text-sm text-emerald-600">✓ Verified</div>
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
                      <div className="text-sm text-gray-600">
                        {excludeUnverified ? '⊘ Excluded' : '⚠ Skipped'}
                      </div>
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
                Paste the JSON response from ChatGPT below. Just provide artist + title - 
                we'll search Spotify for the real track!
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
                      ✓ Auto-verify with Spotify Search API
                    </span>
                  </label>
                  
                  {autoVerify && (
                    <label className="flex items-center gap-2 cursor-pointer ml-6">
                      <input
                        type="checkbox"
                        checked={excludeUnverified}
                        onChange={(e) => setExcludeUnverified(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        disabled={isLoading || isVerifying}
                      />
                      <span className="text-sm text-emerald-800">
                        Hide unverified tracks (recommended)
                      </span>
                    </label>
                  )}
                  
                  <p className="text-xs text-emerald-700 ml-6">
                    {autoVerify 
                      ? "We'll search Spotify for each track (ignoring ChatGPT's links)." 
                      : "Songs will be imported without verification (you can verify them later)."}
                  </p>
                </div>

                {isVerifying && verificationProgress && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        🔄 Verifying tracks...
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
