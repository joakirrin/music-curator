// src/App.tsx
import { useMemo, useState, useCallback } from "react";
import { Header } from "./components/Header";
import Toolbar from "./components/Toolbar";
import FilterBar from "./components/FilterBar";
import { ChatGPTSongRow } from "./components/ChatGPTSongRow";
import ImportChatGPTModal from "./components/ImportChatGPTModal";
import type { FilterType, Song } from "./types/song";
import { useSongsState } from "./hooks/useLocalState";
import { demoSongs } from "./utils/demoData";

export default function App() {
  const { songs, setSongs } = useSongsState(demoSongs ?? []);
  const [filterType, setFilterType] = useState<FilterType>("all");
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    // Filter by round if not "all"
    let base = songs;
    if (selectedRound !== "all") {
      base = songs.filter((s) => s.round === selectedRound);
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

    // Filter by status
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
  }, [songs, search, filterType, selectedRound]);

  // ✅ ENHANCED: Export feedback with verification details
  const handleExportFeedback = useCallback(() => {
    // Get songs with feedback (keep/skip)
    const songsWithFeedback = songs.filter(
      (s) => s.feedback && s.feedback !== "pending"
    );

    // ✅ NEW: Also get unverified/failed songs for ChatGPT to correct
    const unverifiedSongs = songs.filter(
      (s) => s.verificationStatus === 'failed' || s.verificationStatus === 'unverified'
    );

    if (songsWithFeedback.length === 0 && unverifiedSongs.length === 0) {
      alert("No feedback to export yet. Mark some songs as Keep or Skip first!");
      return;
    }

    // Get the latest round
    const latestRound = Math.max(...songs.map((s) => s.round || 0));

    // ✅ ENHANCED: Create comprehensive feedback JSON
    const feedbackData: any = {
      round: latestRound,
      summary: {
        total: songs.length,
        reviewed: songsWithFeedback.length,
        kept: songsWithFeedback.filter(s => s.feedback === 'keep').length,
        skipped: songsWithFeedback.filter(s => s.feedback === 'skip').length,
        verified: songs.filter(s => s.verificationStatus === 'verified').length,
        unverified: unverifiedSongs.length,
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
    };

    // ✅ NEW: Add unverified tracks section with helpful questions
    if (unverifiedSongs.length > 0) {
      feedbackData.unverifiedTracks = unverifiedSongs.map((s) => {
        const unverified: any = {
          requestedTitle: s.title,
          requestedArtist: s.artist,
          status: 'could_not_verify',
          error: s.verificationError || 'Track not found on Spotify',
        };

        // ✅ NEW: Add question to help ChatGPT self-correct
        if (s.verificationError?.includes('mismatch')) {
          unverified.question = `Did you mean a different artist, or a different song by ${s.artist}?`;
        } else {
          unverified.question = `Does this track exist on Spotify? If not, please suggest an alternative.`;
        }

        return unverified;
      });

      feedbackData.instructions = 
        `⚠️ ${unverifiedSongs.length} track${unverifiedSongs.length > 1 ? 's' : ''} could not be verified on Spotify. ` +
        `Please review and provide corrections or alternatives that exist on Spotify.`;
    }

    // Copy to clipboard
    const json = JSON.stringify(feedbackData, null, 2);
    navigator.clipboard.writeText(json);

    // ✅ ENHANCED: Better alert message
    const message = unverifiedSongs.length > 0
      ? `✅ Feedback copied to clipboard!\n\n` +
        `• ${songsWithFeedback.length} reviewed song${songsWithFeedback.length !== 1 ? 's' : ''}\n` +
        `• ${unverifiedSongs.length} unverified track${unverifiedSongs.length !== 1 ? 's' : ''} (for correction)\n\n` +
        `Paste into ChatGPT for better recommendations in Round ${latestRound + 1}!`
      : `✅ Feedback for ${songsWithFeedback.length} songs copied to clipboard!\n\n` +
        `Paste this into ChatGPT to get better recommendations for Round ${latestRound + 1}.`;

    alert(message);
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
      />
      <FilterBar
        value={filterType}
        onChange={setFilterType}
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
            {selectedRound !== "all" ? (
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
