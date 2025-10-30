import { Song } from '../types/song';

export const demoSongs: Song[] = [
  {
    id: crypto.randomUUID(),
    cancion: 'Blinding Lights',
    artista: 'The Weeknd',
    fts: '',
    album: 'After Hours',
    anio: '2020',
    productor: 'Max Martin',
    plataformas: ['Spotify', 'YouTube'],
    me_gusta: true,
    agregar: true,
    comentarios: 'Perfect opening track'
  },
  {
    id: crypto.randomUUID(),
    cancion: 'Levitating',
    artista: 'Dua Lipa',
    fts: 'DaBaby',
    album: 'Future Nostalgia',
    anio: '2020',
    productor: 'Stuart Price',
    plataformas: ['Spotify', 'YouTube'],
    me_gusta: true,
    agregar: false,
    comentarios: 'Great dance vibe'
  },
  {
    id: crypto.randomUUID(),
    cancion: 'Save Your Tears',
    artista: 'The Weeknd',
    fts: 'Ariana Grande',
    album: 'After Hours',
    anio: '2021',
    productor: 'Max Martin',
    plataformas: ['Spotify', 'YouTube', 'SoundCloud'],
    me_gusta: true,
    agregar: true,
    comentarios: 'Remix version is amazing'
  },
  {
    id: crypto.randomUUID(),
    cancion: 'Good 4 U',
    artista: 'Olivia Rodrigo',
    fts: '',
    album: 'SOUR',
    anio: '2021',
    productor: 'Dan Nigro',
    plataformas: ['Spotify', 'YouTube'],
    me_gusta: false,
    agregar: false,
    comentarios: ''
  },
  {
    id: crypto.randomUUID(),
    cancion: 'Heat Waves',
    artista: 'Glass Animals',
    fts: '',
    album: 'Dreamland',
    anio: '2020',
    productor: 'Dave Bayley',
    plataformas: ['Spotify', 'YouTube', 'Bandcamp'],
    me_gusta: true,
    agregar: false,
    comentarios: 'Summer anthem'
  }
];
