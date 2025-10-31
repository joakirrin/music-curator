// src/types/song.ts

export type Platform = "Spotify" | "YouTube" | "Bandcamp" | "SoundCloud";

export type Song = {
  id: string;
  title: string;         // (was: cancion)
  artist: string;        // (was: artista)
  featuring?: string;    // (was: fts)
  album?: string;
  year?: string;         // (was: anio)
  producer?: string;     // (was: productor)
  platforms: Platform[]; // (was: plataformas)
  liked: boolean;        // (was: me_gusta)
  toAdd: boolean;        // (was: agregar)
  comments?: string;     // (was: comentarios)
};
