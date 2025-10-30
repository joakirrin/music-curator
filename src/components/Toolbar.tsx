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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;

      if (file.name.endsWith('.csv')) {
        const importedSongs = fromCSV(content);
        onImport(importedSongs);
      } else if (file.name.endsWith('.json')) {
        try {
          const importedSongs = JSON.parse(content) as Song[];
          onImport(importedSongs);
        } catch (error) {
          alert('Invalid JSON file');
        }
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportCSV = () => {
    const csv = toCSV(songs);
    downloadFile('playlist.csv', csv, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(songs, null, 2);
    downloadFile('playlist.json', json, 'application/json');
  };

  return (
    <div className="border-b bg-gray-50 px-4 py-3">
      <div className="container mx-auto flex flex-wrap gap-2">
        <Button onClick={onAddSong} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Song
        </Button>

        <Button onClick={handleImportClick} variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileChange}
          className="hidden"
        />

        <Button onClick={handleExportCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>

        <Button onClick={handleExportJSON} variant="outline">
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
