// src/App.tsx
import { useMemo, useState, useCallback } from "react";
import { Header } from "./components/Header";
import Toolbar from "./components/Toolbar";
import FilterBar from "./components/FilterBar";
import { ChatGPTSongRow } from "./components/ChatGPTSongRow";
import ImportChatGPTModal from "./components/ImportChatGPTModal";
import type { FilterType, VerificationFilterType, Song } from "./types/song";
import { useSongsState } from "./hooks/useLocalState";
import { demoSongs } from "./utils/demoData";

export default function App() {
  const { songs, setSongs } = useSongsState(demoSongs ?? []);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilterType>("all"); // ✅ NEW: Phase 2.1
  const [search, setSearch] = useState("");
  const [isChatGPTModalOpen, setIsChatGPTModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | "all">("all");

  const applyImport = useCallback(
    (incoming: Song[]) => {
      setSongs(incoming);
    },
    [setSongs]
  );

  const handleChatGPTImport = useCallback(
    (incoming: Song[]) => {
      setSongs([...songs, ...incoming]);
      setFilterType("all");
      if (incoming.length > 0 && incoming[0].round) {
        setSelectedRound(incoming[0].round);
      }
    },
    [songs, setSongs]
  );

  const onClear = useCallback(() => {
    if (confirm("Delete all songs?")) {
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

  const deleteSong = useCallback(
    (id: string) => setSongs(songs.filter((s) => s.id !== id)),
    [songs, setSongs]
  );

  // ✅ UPDATED: Enhanced filtering with verification status (Phase 2.1)
  // ✅ PHASE 2.2 UPDATE: Failed tracks NEVER show in main list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    // ✅ NEW: ALWAYS exclude failed tracks from main list
    // Failed tracks only visible in FailedTracksModal
    let base = songs.filter((s) => s.verificationStatus !== 'failed');
    
    // Filter by round if not "all"
    if (selectedRound !== "all") {
      base = base.filter((s) => s.round === selectedRound);
    }

    // Filter by search query
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

    // ✅ Filter by verification status (Phase 2.1)
    switch (verificationFilter) {
      case "verified":
        base = base.filter((s) => s.verificationStatus === "verified");
        break;
      case "unverified":
        base = base.filter((s) => s.verificationStatus === "unverified" || !s.verificationStatus);
        break;
      case "failed":
        // Failed tracks are excluded above, but user might click the filter
        // Show empty list with helpful message
        return [];
      // "all" - no additional filtering (but failed already excluded)
    }

    // Filter by feedback status
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

  // ✅ NEW: Generate replacement prompt for failed tracks (Phase 2.2 - Chunk 1)
  const handleGetReplacements = useCallback(() => {
    // Get all failed verification tracks
    const failedTracks = songs.filter(
      (s) => s.verificationStatus === 'failed'
    );

    if (failedTracks.length === 0) {
      alert("No failed tracks to replace! All songs are verified. 🎉");
      return;
    }

    // Group by round for better organization
    const tracksByRound = failedTracks.reduce((acc, track) => {
      const round = track.round || 0;
      if (!acc[round]) acc[round] = [];
      acc[round].push(track);
      return acc;
    }, {} as Record<number, Song[]>);

    // Generate the prompt
    let prompt = `🔄 REPLACEMENT REQUEST\n\n`;
    prompt += `I need help replacing ${failedTracks.length} track${failedTracks.length !== 1 ? 's' : ''} that couldn't be verified on Spotify.\n\n`;
    
    // List tracks by round
    Object.entries(tracksByRound).forEach(([round, tracks]) => {
      prompt += `📀 Round ${round}:\n`;
      tracks.forEach((track) => {
        prompt += `  • "${track.title}" by ${track.artist}\n`;
        if (track.verificationError) {
          prompt += `    ❌ Error: ${track.verificationError}\n`;
        }
        if (track.comments) {
          prompt += `    💡 Original reason: "${track.comments}"\n`;
        }
      });
      prompt += `\n`;
    });

    prompt += `\n🎯 INSTRUCTIONS:\n`;
    prompt += `Please suggest replacement tracks that:\n`;
    prompt += `1. Exist on Spotify (verify before suggesting)\n`;
    prompt += `2. Match the original vibe/reason for recommendation\n`;
    prompt += `3. Keep the same round number as the original\n\n`;
    
    prompt += `Format your response as JSON:\n`;
    prompt += `{\n`;
    prompt += `  "round": [round_number],\n`;
    prompt += `  "recommendations": [\n`;
    prompt += `    {\n`;
    prompt += `      "title": "Song Name",\n`;
    prompt += `      "artist": "Artist Name",\n`;
    prompt += `      "reason": "Why this replaces the failed track"\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n\n`;
    prompt += `✨ Thanks for helping improve the recommendations!`;

    // Copy to clipboard
    navigator.clipboard.writeText(prompt);

    // Show success message with details
    const roundCount = Object.keys(tracksByRound).length;
    alert(
      `✅ Replacement prompt copied to clipboard!\n\n` +
      `• ${failedTracks.length} failed track${failedTracks.length !== 1 ? 's' : ''}\n` +
      `• Across ${roundCount} round${roundCount !== 1 ? 's' : ''}\n\n` +
      `Paste this into ChatGPT to get better alternatives!`
    );
  }, [songs]);

  // ✅ UPDATED: Export feedback (Phase 2.2 - Separate from Get Replacements)
  // Export Feedback = Learning loop (what you kept/skipped)
  // Get Replacements = Fix loop (handle failed tracks separately)
  const handleExportFeedback = useCallback(() => {
    // Get songs with feedback (keep/skip)
    const songsWithFeedback = songs.filter(
      (s) => s.feedback && s.feedback !== "pending"
    );

    if (songsWithFeedback.length === 0) {
      alert("No feedback to export yet. Mark some songs as Keep or Skip first!");
      return;
    }

    // Get the latest round
    const latestRound = Math.max(...songs.map((s) => s.round || 0));

    // ✅ SIMPLIFIED: Export only focuses on user decisions (keep/skip)
    // Failed tracks are handled separately via "Get Replacements" button
    const feedbackData: any = {
      round: latestRound,
      summary: {
        total: songs.length,
        reviewed: songsWithFeedback.length,
        kept: songsWithFeedback.filter(s => s.feedback === 'keep').length,
        skipped: songsWithFeedback.filter(s => s.feedback === 'skip').length,
        verified: songs.filter(s => s.verificationStatus === 'verified').length,
      },
      feedback: songsWithFeedback.map((s) => {
        const feedback: any = {
          requestedTitle: s.title,
          requestedArtist: s.artist,
          decision: s.feedback,
          userFeedback: s.userFeedback || "",
        };

        // Add verification status
        if (s.verificationStatus === 'verified') {
          feedback.verification = {
            status: 'verified',
            spotifyUrl: s.spotifyUrl,
            album: s.album,
            popularity: s.popularity,
          };
        }

        return feedback;
      }),
      instructions: `Use this feedback to improve future recommendations for Round ${latestRound + 1}.`,
    };

    // Copy to clipboard
    const json = JSON.stringify(feedbackData, null, 2);
    navigator.clipboard.writeText(json);

    alert(
      `✅ Feedback for ${songsWithFeedback.length} songs copied to clipboard!\n\n` +
      `Paste this into ChatGPT to get better recommendations for Round ${latestRound + 1}.\n\n` +
      `💡 Tip: Use "Get Replacements" button to fix failed tracks separately.`
    );
  }, [songs]);

  return (
    <div className="min-h-screen bg-gray-800">
      <Header />
      <Toolbar
        songs={songs}
        onImport={applyImport}
        onClear={onClear}
        onOpenChatGPTModal={() => setIsChatGPTModalOpen(true)}
        onExportFeedback={handleExportFeedback}
        onGetReplacements={handleGetReplacements}
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

      <ImportChatGPTModal
        open={isChatGPTModalOpen}
        onOpenChange={setIsChatGPTModalOpen}
        onImport={handleChatGPTImport}
        existingSongs={songs}
      />

      <div>
        {filtered.map((s) => (
          <ChatGPTSongRow
            key={s.id}
            song={s}
            onUpdate={(next) => updateSong(s.id, next)}
            onDelete={() => deleteSong(s.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="container mx-auto px-4 py-12 text-center text-gray-400">
            {verificationFilter === "failed" ? (
              <>
                Failed tracks are hidden from the main list.
                <br />
                <button
                  onClick={handleGetReplacements}
                  className="mt-3 px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
                >
                  🔄 Get Replacements
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
    </div>
  );
}
