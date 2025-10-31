// src/App.tsx
import { useMemo, useState, useCallback } from "react";
import { Header } from "./components/Header";
import Toolbar from "./components/Toolbar";
import FilterBar from "./components/FilterBar"; // ✅ default import
import { SongRow } from "./components/SongRow";
import type { FilterType, Song } from "./types/song";
import { useSongsState } from "./hooks/useLocalState";
import { demoSongs } from "./utils/demoData";

export default function App() {
  const { songs, setSongs } = useSongsState(demoSongs ?? []);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const applyImport = useCallback(
    (incoming: Song[]) => {
      setSongs(incoming);
    },
    [setSongs]
  );

  const onClear = useCallback(() => {
    if (confirm("Delete all songs?")) setSongs([]);
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
    const base = songs.filter((s) => {
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
  }, [songs, search, filterType]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toolbar songs={songs} onImport={applyImport} onClear={onClear} />
      <FilterBar
        value={filterType}
        onChange={setFilterType}
        search={search}
        onSearch={setSearch}
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
            No songs yet. Import CSV/JSON or add new entries.
          </div>
        )}
      </div>
    </div>
  );
}
