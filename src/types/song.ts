export type Platform = 'Spotify' | 'YouTube' | 'Bandcamp' | 'SoundCloud';

export interface Song {
  id: string;
  cancion: string;
  artista: string;
  fts: string;
  album: string;
  anio: string;
  productor: string;
  plataformas: Platform[];
  me_gusta: boolean;
  agregar: boolean;
  comentarios: string;
}

export type FilterType = 'all' | 'liked' | 'toAdd' | 'pending';
