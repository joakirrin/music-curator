// src/components/Toolbar.tsx
import { useRef } from "react";
import { Song } from "../types/song";
import { toCSV, fromCSV, fromJSON, downloadFile } from "../utils/fileHandlers";

type Props = {
  songs: Song[];
  onImport: (incoming: Song[]) => void;
};

export default function Toolbar({ songs, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const jsonRef = useRef<HTMLInputElement | null>(null);

  const handleExportCSV = () => {
    const csv = toCSV(songs);
    downloadFile("songs.csv", csv, "text/csv;charset=utf-8");
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const parsed = fromCSV(text);
        onImport(parsed);
      } catch (err) {
        alert((err as Error).message || "Failed to import CSV.");
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result || "[]"));
        const parsed = fromJSON(json);
        onImport(parsed);
      } catch {
        alert("Failed to import JSON.");
      }
      if (jsonRef.current) jsonRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2 p-2">
      <button
        className="px-3 py-1 rounded bg-slate-800 text-white hover:bg-slate-700"
        onClick={() => fileRef.current?.click()}
      >
        Import CSV (ES/EN)
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImportCSV(f);
        }}
      />

      <button
        className="px-3 py-1 rounded bg-slate-800 text-white hover:bg-slate-700"
        onClick={() => jsonRef.current?.click()}
      >
        Import JSON (ES/EN)
      </button>
      <input
        ref={jsonRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImportJSON(f);
        }}
      />

      <button
        className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
        onClick={handleExportCSV}
      >
        Export CSV (EN)
      </button>
    </div>
  );
}
