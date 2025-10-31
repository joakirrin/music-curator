import { useState, useMemo, useEffect } from 'react';
import { Song, FilterType } from './types/song';
import { useLocalState } from './hooks/useLocalState';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { FilterBar } from './components/FilterBar';
import { SongRow } from './components/SongRow';
import { SpotifyButton } from './components/SpotifyButton';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [songs, setSongs] = useLocalState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  useEffect(() => { document.title = 'Fonea – Sound Curator'; }, []);

  const addNewSong = () => {
    const newSong: Song = {
      id: crypto.randomUUID(),
      cancion: '',
      artista: '',
      fts: '',
      album: '',
      anio: '',
      productor: '',
      plataformas: [],
      me_gusta: false,
      agregar: false,
      comentarios: ''
    };
    setSongs(prev => [newSong, ...prev]);
  };

  const updateSong = (updated: Song) => {
    setSongs(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const deleteSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
  };

  const handleImport = (imported: Song[]) => {
    setSongs(imported);
  };

  const clearAll = () => {
    if (confirm('Clear all songs?')) {
      setSongs([]);
    }
  };

  const filteredSongs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    let list = songs;

    if (q) {
      list = list.filter(s =>
        [s.cancion, s.artista, s.fts, s.album, s.anio, s.productor, s.comentarios]
          .filter(Boolean)
          .some(v => (v || '').toLowerCase().includes(q))
      );
    }

    if (filterType === 'liked') list = list.filter(s => s.me_gusta);
    if (filterType === 'toAdd') list = list.filter(s => s.agregar);
    if (filterType === 'pending') list = list.filter(s => !s.me_gusta && !s.agregar);

    return list;
  }, [songs, searchTerm, filterType]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <Toolbar
        onAddSong={addNewSong}
        onImport={handleImport}
        songs={songs}
        onClear={clearAll}
      />

      <div className="container mx-auto px-4 py-6">
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterChange={setFilterType}
        />

        {filteredSongs.length === 0 ? (
          <div className="mt-10 rounded-lg border bg-white p-8 text-center text-gray-600">
            No songs match your filters yet. Try adding a song or adjusting the filters.
            <div className="mt-6">
              <SpotifyButton />
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <AnimatePresence initial={false}>
              {filteredSongs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  onUpdate={updateSong}
                  onDelete={() => deleteSong(song.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <footer className="border-t bg-white py-6 text-center text-sm text-gray-600">
        <div className="container mx-auto px-4">
          <p>Fonea – Sound Curator — Curate by feeling</p>
          <p className="mt-1 text-xs text-gray-500">
            {songs.length} total songs • {songs.filter(s => s.me_gusta).length} liked • {songs.filter(s => s.agregar).length} to add
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
