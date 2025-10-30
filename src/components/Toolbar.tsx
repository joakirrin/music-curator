import { Plus, Upload, Download, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Song } from '../types/song';
import { toCSV, fromCSV, downloadFile } from '../utils/fileHandlers';
import { useRef } from 'react';

interface ToolbarProps {
  onAddSong: () => void;
  onImport: (songs: Song[]) => void;
  songs: Song[];
  onClear: () => void;
}

export const Toolbar = ({ onAddSong, onImport, songs, onClear }: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();

    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        const parsed = fromCSV(text);
        onImport(parsed);
      } else if (file.name.toLowerCase().endsWith('.json')) {
        const data = JSON.parse(text) as Partial<Song>[];
        const normalized: Song[] = data.map((s) => ({
          id: s.id ?? crypto.randomUUID(),
          cancion: s.cancion ?? '',
          artista: s.artista ?? '',
          fts: s.fts ?? '',
          album: s.album ?? '',
          anio: s.anio ?? '',
          productor: s.productor ?? '',
          plataformas: Array.isArray(s.plataformas) ? (s.plataformas as any) : [],
          me_gusta: Boolean(s.me_gusta),
          agregar: (s as any).agregar ?? (s as any).toAdd ?? false,
          comentarios: s.comentarios ?? ''
        }));
        onImport(normalized);
      } else {
        alert('Unsupported file type. Please import a .csv or .json file.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to import file. Please check the format.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportAllCSV = () => {
    const csv = toCSV(songs);
    downloadFile('songs.csv', csv, 'text/csv;charset=utf-8');
  };

  const exportSelectedCSV = () => {
    const selected = songs.filter(s => s.agregar);
    const csv = toCSV(selected);
    downloadFile('songs_selected.csv', csv, 'text/csv;charset=utf-8');
  };

  const exportAllJSON = () => {
    const json = JSON.stringify(songs, null, 2);
    downloadFile('songs.json', json, 'application/json;charset=utf-8');
  };

  return (
    <div className="border-b bg-white px-4 py-3">
      <div className="container mx-auto flex items-center gap-3">
        <Button onClick={onAddSong}>
          <Plus className="mr-2 h-4 w-4" />
          Add Song
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button variant="secondary" onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV/JSON
        </Button>

        <div className="h-6 w-px bg-gray-200" />

        <Button variant="outline" onClick={exportAllCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV (All)
        </Button>
        <Button
          variant="outline"
          onClick={exportSelectedCSV}
          disabled={!songs.some(s => s.agregar)}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Selected CSV
        </Button>
        <Button variant="outline" onClick={exportAllJSON}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>

        <div className="flex-1" />

        <Button
          onClick={onClear}
          variant="destructive"
          className="ml-auto"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>
    </div>
  );
};
