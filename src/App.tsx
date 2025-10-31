// src/App.tsx
import { useMemo, useState } from "react";
import { useSongsState } from "./hooks/useLocalState";
import { Song, FilterType } from "./types/song";
import { SongRow } from "./components/SongRow";
import Toolbar from "./components/Toolbar";
import { FilterBar } from "./components/FilterBar";
import { Header } from "./components/Header";   // ← use the restored header
import { demoSongs } from "./utils/demoData";

export default function App() {
  const { songs, setSongs } = useSongsState(demoSongs ?? []);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const base = songs.filter((s) => {
      const hay = [s.title, s.artist, s.album, s.producer, s.comments, s.featuring]
        .map((x) => (x ?? "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
    switch (filterType) {
      case "liked":   return base.filter((s) => !!s.liked);
      case "toAdd":   return base.filter((s) => !!s.toAdd);
      case "pending": return base.filter((s) => !s.liked && !s.toAdd);
      default:        return base;
    }
  }, [songs, searchTerm, filterType]);

  const handleUpdate = (next: Song) => {
    setSongs(songs.map((s) => (s.id === next.id ? next : s)));
  };

  const handleDelete = (id: string) => {
    setSongs(songs.filter((s) => s.id !== id));
  };

  const handleClearAll = () => {
    if (!confirm("Delete all songs? This cannot be undone.")) return;
    setSongs([]);
    localStorage.removeItem("songs");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto py-6 space-y-4">
        <Toolbar
          songs={songs}
          onImport={(incoming) => setSongs(incoming)}
          onClear={handleClearAll}   // ← keeps Delete All button in the toolbar
        />

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterChange={setFilterType}
        />

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground px-1">
              No songs yet. Import CSV/JSON or start typing using the demo items.
            </div>
          ) : (
            filtered.map((s) => (
              <SongRow
                key={s.id}
                song={s}
                onUpdate={handleUpdate}
                onDelete={() => handleDelete(s.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
