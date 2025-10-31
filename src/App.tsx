// src/App.tsx
import { useMemo, useState } from "react";
import { useSongsState } from "./hooks/useLocalState";
import { Song } from "./types/song";
import { SongRow } from "./components/SongRow";
import Toolbar from "./components/Toolbar";

type FilterType = "all" | "liked" | "toAdd" | "pending";

export default function App() {
  const { songs, setSongs } = useSongsState([]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = songs.filter((s) => {
      const hay = [s.title, s.artist, s.album, s.producer, s.comments, s.featuring]
        .map((x) => (x ?? "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
    switch (filter) {
      case "liked":
        return base.filter((s) => !!s.liked);
      case "toAdd":
        return base.filter((s) => !!s.toAdd);
      case "pending":
        return base.filter((s) => !s.liked && !s.toAdd);
      default:
        return base;
    }
  }, [songs, query, filter]);

  // Match SongRow props: onUpdate(nextSong), onDelete()
  const handleUpdate = (next: Song) => {
    setSongs(songs.map((s) => (s.id === next.id ? next : s)));
  };

  const handleDelete = (id: string) => {
    setSongs(songs.filter((s) => s.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Toolbar songs={songs} onImport={(incoming) => setSongs(incoming)} />

      <div className="flex items-center gap-2 p-2">
        <input
          className="flex-1 px-2 py-1 rounded border"
          placeholder="Search by Title, Artist, Album, Producer, Comments…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="px-2 py-1 rounded border"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
        >
          <option value="all">All</option>
          <option value="liked">Liked</option>
          <option value="toAdd">To Add</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div>
        {filtered.map((s) => (
          <SongRow
            key={s.id}
            song={s}
            onUpdate={handleUpdate}
            onDelete={() => handleDelete(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
