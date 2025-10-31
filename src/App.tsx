import { useState, useMemo } from 'react';
import { Song, FilterType } from './types/song';
import { useLocalState } from './hooks/useLocalState';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { FilterBar } from './components/FilterBar';
import { SongRow } from './components/SongRow';
import { SpotifyButton } from './components/SpotifyButton';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from "react";

useEffect(() => {
  document.title = "Fonea – Sound Curator";
}, []);


function App() {
  const [songs, setSongs] = useLocalState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

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
    setSongs([newSong, ...songs]);
  };

  // 🔥 FIX: Use functional update to ensure we're working with the latest state
  const updateSong = (updatedSong: Song) => {
    setSongs(prevSongs => 
      prevSongs.map(song => 
        song.id === updatedSong.id ? updatedSong : song
      )
    );
  };

  const deleteSong = (id: string) => {
    setSongs(prevSongs => prevSongs.filter(song => song.id !== id));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all songs? This cannot be undone.')) {
      setSongs([]);
    }
  };

  const filteredSongs = useMemo(() => {
    let filtered = songs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(song =>
        song.cancion.toLowerCase().includes(term) ||
        song.artista.toLowerCase().includes(term) ||
        song.fts.toLowerCase().includes(term) ||
        song.album.toLowerCase().includes(term) ||
        song.anio.toLowerCase().includes(term) ||
        song.productor.toLowerCase().includes(term) ||
        song.comentarios.toLowerCase().includes(term)
      );
    }

    switch (filterType) {
      case 'liked':
        filtered = filtered.filter(song => song.me_gusta);
        break;
      case 'toAdd':
        filtered = filtered.filter(song => song.agregar);
        break;
      case 'pending':
        filtered = filtered.filter(song => !song.me_gusta && !song.agregar);
        break;
    }

    return filtered;
  }, [songs, searchTerm, filterType]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Toolbar
        onAddSong={addNewSong}
        onImport={setSongs}
        songs={songs}
        onClear={clearAll}
      />
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterChange={setFilterType}
      />

      <SpotifyButton />

      <div className="container mx-auto px-4 py-6">
        {filteredSongs.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-600">
              {songs.length === 0
                ? 'No songs yet. Click "Add Song" to get started!'
                : 'No songs match your filters. Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredSongs.map(song => (
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
          <p>TBD Curator - Your interactive playlist workspace</p>
          <p className="mt-1 text-xs text-gray-500">
            {songs.length} total songs • {songs.filter(s => s.me_gusta).length} liked • {songs.filter(s => s.agregar).length} to add
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;