// src/App.tsx
import { useMemo, useState, useCallback } from "react";
import { Header } from "./components/Header";
import Toolbar from "./components/Toolbar";
import FilterBar from "./components/FilterBar";
import { ChatGPTSongRow } from "./components/ChatGPTSongRow"; // ✅ ONLY ChatGPT view now
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
      setFilterType("all"); // ✅ Just show all songs after import
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

    // Filter by status - ✅ UPDATED: use feedback field (keep/skip/pending)
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

  // ✅ Export feedback function
  const handleExportFeedback = useCallback(() => {
    // Get songs with feedback
    const songsWithFeedback = songs.filter(
      (s) => s.feedback && s.feedback !== "pending"
    );

    if (songsWithFeedback.length === 0) {
      alert("No feedback to export yet. Mark some songs as Keep or Skip first!");
      return;
    }

    // Get the latest round
    const latestRound = Math.max(...songs.map((s) => s.round || 0));

    // Create feedback JSON
    const feedbackData = {
      round: latestRound,
      feedback: songsWithFeedback.map((s) => ({
        title: s.title,
        artist: s.artist,
        decision: s.feedback,
        userFeedback: s.userFeedback || "",
      })),
    };

    // Copy to clipboard
    const json = JSON.stringify(feedbackData, null, 2);
    navigator.clipboard.writeText(json);

    alert(
      `✅ Feedback for ${songsWithFeedback.length} songs copied to clipboard!\n\nPaste this into ChatGPT to get better recommendations for Round ${latestRound + 1}.`
    );
  }, [songs]);

  return (
    <div className="min-h-screen bg-gray-800">
      {/* ✅ Dark gray background */}
      <Header />
      <Toolbar
        songs={songs}
        onImport={applyImport}
        onClear={onClear}
        onOpenChatGPTModal={() => setIsChatGPTModalOpen(true)}
        onExportFeedback={handleExportFeedback} // ✅ Export feedback button
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

      {/* ✅ Always use ChatGPT view - no switching */}
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
