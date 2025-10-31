// src/components/SongRow.tsx
import type { Platform, Song } from "../types/song";

type Props = {
  song: Song;
  onUpdate: (next: Song) => void;
  onDelete: () => void;
};

const ALL_PLATFORMS: Platform[] = ["Spotify", "YouTube", "Bandcamp", "SoundCloud"];

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export const SongRow = ({ song, onUpdate, onDelete }: Props) => {
  const set = <K extends keyof Song>(key: K, value: Song[K]) =>
    onUpdate({ ...song, [key]: value });

  const chipCls = (active: boolean) =>
    `px-2 py-1 rounded-full text-xs border ${
      active ? "bg-emerald-50 border-emerald-300" : "bg-white hover:bg-gray-50"
    }`;

  return (
    <div className="container mx-auto px-4 py-3 border-b">
      <div className="flex items-center gap-3">
        {/* liked / toAdd checkboxes */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={song.liked}
            onChange={(e) => set("liked", e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
            aria-label="Liked"
          />
          <span className="text-sm text-gray-700">Liked</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={song.toAdd}
            onChange={(e) => set("toAdd", e.target.checked)}
            className="h-4 w-4 accent-blue-600"
            aria-label="To Add"
          />
          <span className="text-sm text-gray-700">To Add</span>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs rounded-lg border hover:bg-red-50 text-red-600 border-red-200"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="px-3 py-2 rounded-xl border text-sm"
          placeholder="Title"
          value={song.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <input
          className="px-3 py-2 rounded-xl border text-sm"
          placeholder="Artist"
          value={song.artist}
          onChange={(e) => set("artist", e.target.value)}
        />
        <input
          className="px-3 py-2 rounded-xl border text-sm"
          placeholder="Featuring"
          value={song.featuring ?? ""}
          onChange={(e) => set("featuring", e.target.value)}
        />
        <input
          className="px-3 py-2 rounded-xl border text-sm"
          placeholder="Album"
          value={song.album ?? ""}
          onChange={(e) => set("album", e.target.value)}
        />
        <input
          className="px-3 py-2 rounded-xl border text-sm"
          placeholder="Year"
          value={song.year ?? ""}
          onChange={(e) => set("year", e.target.value)}
        />
        <input
          className="px-3 py-2 rounded-xl border text-sm"
          placeholder="Producer"
          value={song.producer ?? ""}
          onChange={(e) => set("producer", e.target.value)}
        />
        <textarea
          className="px-3 py-2 rounded-xl border text-sm md:col-span-2"
          placeholder="Comments"
          value={song.comments ?? ""}
          onChange={(e) => set("comments", e.target.value)}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ALL_PLATFORMS.map((p) => {
          const active = song.platforms.includes(p);
          return (
            <button
              key={p}
              className={chipCls(active)}
              onClick={() => set("platforms", toggle(song.platforms, p))}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
};
