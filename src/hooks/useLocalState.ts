// src/components/SongRow.tsx
import React from "react";
import { Song, Platform } from "../types/song";

type Props = {
  song: Song;
  onChange: (patch: Partial<Song>) => void;
};

const platformString = (arr: Platform[] | undefined) => (arr && arr.length ? arr.join(";") : "");

export default function SongRow({ song, onChange }: Props) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 border-b">
      {/* Title */}
      <input
        className="col-span-2 px-2 py-1 rounded border"
        placeholder="Title"
        value={song.title ?? ""}
        onChange={(e) => onChange({ title: e.target.value })}
      />

      {/* Artist */}
      <input
        className="col-span-2 px-2 py-1 rounded border"
        placeholder="Artist"
        value={song.artist ?? ""}
        onChange={(e) => onChange({ artist: e.target.value })}
      />

      {/* Featuring */}
      <input
        className="col-span-1 px-2 py-1 rounded border"
        placeholder="Featuring"
        value={song.featuring ?? ""}
        onChange={(e) => onChange({ featuring: e.target.value })}
      />

      {/* Album */}
      <input
        className="col-span-1 px-2 py-1 rounded border"
        placeholder="Album"
        value={song.album ?? ""}
        onChange={(e) => onChange({ album: e.target.value })}
      />

      {/* Year */}
      <input
        className="col-span-1 px-2 py-1 rounded border"
        placeholder="Year"
        value={song.year ?? ""}
        onChange={(e) => onChange({ year: e.target.value })}
      />

      {/* Producer */}
      <input
        className="col-span-1 px-2 py-1 rounded border"
        placeholder="Producer"
        value={song.producer ?? ""}
        onChange={(e) => onChange({ producer: e.target.value })}
      />

      {/* Platforms (semicolon-separated) */}
      <input
        className="col-span-2 px-2 py-1 rounded border"
        placeholder="Platforms (e.g., Spotify;YouTube)"
        value={platformString(song.platforms)}
        onChange={(e) => {
          const parts = e.target.value.split(";").map((x) => x.trim()).filter(Boolean) as Platform[];
          onChange({ platforms: parts });
        }}
      />

      {/* Liked */}
      <label className="col-span-1 inline-flex items-center gap-1">
        <input
          type="checkbox"
          className="h-4 w-4 accent-green-600"
          checked={!!song.liked}
          onChange={(e) => onChange({ liked: e.target.checked })}
        />
        <span className="text-sm">Liked</span>
      </label>

      {/* To Add */}
      <label className="col-span-1 inline-flex items-center gap-1">
        <input
          type="checkbox"
          className="h-4 w-4 accent-blue-600"
          checked={!!song.toAdd}
          onChange={(e) => onChange({ toAdd: e.target.checked })}
        />
        <span className="text-sm">Add to Playlist</span>
      </label>

      {/* Comments */}
      <input
        className="col-span-12 mt-2 px-2 py-1 rounded border"
        placeholder="Comments"
        value={song.comments ?? ""}
        onChange={(e) => onChange({ comments: e.target.value })}
      />
    </div>
  );
}
