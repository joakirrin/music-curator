// src/App.tsx
import { useMemo, useState, useCallback } from "react";
import { Header } from "./components/Header";
import Toolbar from "./components/Toolbar";
import FilterBar from "./components/FilterBar";
import { SongRow } from "./components/SongRow";
import ImportChatGPTModal from "./components/ImportChatGPTModal";
import type { FilterType, Song } from "./types/song";
import { useSongsState } from "./hooks/useLocalState";
import { demoSongs } from "./utils/demoData";

export default function App() {
  const { songs, setSongs } = useSongsState(demoSongs ?? []);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [isChatGPTModalOpen, setIsChatGPTModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | "all">("all"); // ✅ NEW: Round filter state

  const applyImport = useCallback(
    (incoming: Song[]) => {
      setSongs(incoming);
    },
    [setSongs]
  );

  const handleChatGPTImport = useCallback(
    (incoming: Song[]) => {
      setSongs([...songs, ...incoming]);
      // ✅ NEW: Auto-switch to the newly imported round
      if (incoming.length > 0 && incoming[0].round) {
        setSelectedRound(incoming[0].round);
      }
    },
    [songs, setSongs]
  );

  const onClear = useCallback(() => {
    if (confirm("Delete all songs?")) {
      setSongs([]);
      setSelectedRound("all"); // ✅ Reset round filter when clearing
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
    
    // ✅ NEW: First filter by round if not "all"
    let base = songs;
    if (selectedRound !== "all") {
      base = songs.filter((s) => s.round === selectedRound);
    }

    // Then filter by search query
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

    // Finally filter by status
    switch (filterType) {
      case "liked":
        return base.filter((s) => !!s.liked);
      case "toAdd":
        return base.filter((s) => !!s.toAdd);
      case "pending":
        return base.filter((s) => !s.liked && !s.toAdd);
      default:
        return base;
    }
  }, [songs, search, filterType, selectedRound]); // ✅ Added selectedRound dependency

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toolbar
        songs={songs}
        onImport={applyImport}
        onClear={onClear}
        onOpenChatGPTModal={() => setIsChatGPTModalOpen(true)}
      />
      <FilterBar
        value={filterType}
        onChange={setFilterType}
        search={search}
        onSearch={setSearch}
        songs={songs} // ✅ NEW: Pass songs for round calculation
        selectedRound={selectedRound} // ✅ NEW: Pass current round
        onRoundChange={setSelectedRound} // ✅ NEW: Pass round change handler
      />

      <ImportChatGPTModal
        open={isChatGPTModalOpen}
        onOpenChange={setIsChatGPTModalOpen}
        onImport={handleChatGPTImport}
        existingSongs={songs}
      />

      <div className="divide-y">
        {filtered.map((s) => (
          <SongRow
            key={s.id}
            song={s}
            onUpdate={(next) => updateSong(s.id, next)}
            onDelete={() => deleteSong(s.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="container mx-auto px-4 py-12 text-center text-gray-500">
            {selectedRound !== "all" ? (
              <>
                No songs in Round {selectedRound}.
                <button
                  onClick={() => setSelectedRound("all")}
                  className="ml-2 text-emerald-600 hover:text-emerald-700 underline"
                >
                  View all rounds
                </button>
              </>
            ) : (
              "No songs yet. Import CSV/JSON or add new entries."
            )}
          </div>
        )}
      </div>
    </div>
  );
}
