import { Song } from '../types/song';

export const demoSongs: Song[] = [
  {
    id: crypto.randomUUID(),
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    featuring: '',
    album: 'After Hours',
    year: '2020',
    producer: 'Max Martin',
    platforms: ['Spotify', 'YouTube'],
    liked: true,
    toAdd: true,
    comments: 'Perfect opening track'
  },
  {
    id: crypto.randomUUID(),
    title: 'Levitating',
    artist: 'Dua Lipa',
    featuring: 'DaBaby',
    album: 'Future Nostalgia',
    year: '2020',
    producer: 'Stuart Price',
    platforms: ['Spotify', 'YouTube'],
    liked: true,
    toAdd: false,
    comments: 'Great dance vibe'
  },
  {
    id: crypto.randomUUID(),
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    featuring: 'Ariana Grande',
    album: 'After Hours',
    year: '2021',
    producer: 'Max Martin',
    platforms: ['Spotify', 'YouTube', 'SoundCloud'],
    liked: true,
    toAdd: true,
    comments: 'Remix version is amazing'
  },
  {
    id: crypto.randomUUID(),
    title: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    featuring: '',
    album: 'SOUR',
    year: '2021',
    producer: 'Dan Nigro',
    platforms: ['Spotify', 'YouTube'],
    liked: false,
    toAdd: false,
    comments: ''
  },
  {
    id: crypto.randomUUID(),
    title: 'Heat Waves',
    artist: 'Glass Animals',
    featuring: '',
    album: 'Dreamland',
    year: '2020',
    producer: 'Dave Bayley',
    platforms: ['Spotify', 'YouTube', 'Bandcamp'],
    liked: true,
    toAdd: false,
    comments: 'Summer anthem'
  }
];
