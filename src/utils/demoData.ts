// src/utils/demoData.ts
import type { Song } from "../types/song";

export const demoSongs: Song[] = [
  {
    id: "demo_1",
    title: "Echoes",
    artist: "Aurora Lane",
    featuring: "",
    album: "Night Signals",
    year: "2022",
    producer: "Mono Peak",
    platforms: ["Spotify", "YouTube"],
    liked: true,
    toAdd: false,
    comments: "great synth textures",
  },
  {
    id: "demo_2",
    title: "Sunlit Threads",
    artist: "Palmera",
    featuring: "Koa",
    album: "",
    year: "",
    producer: "",
    platforms: ["Bandcamp", "SoundCloud"],
    liked: false,
    toAdd: true,
    comments: "bandcamp first",
  },
];
