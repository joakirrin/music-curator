// src/components/Toolbar.tsx
import { useRef } from "react";
import type { Song } from "../types/song";
import { fromCSV, fromJSON, toCSV, downloadFile } from "../utils/fileHandlers";

type Props = {
  songs: Song[];
  onImport: (incoming: Song[]) => void;
  onClear?: () => void;
  onOpenChatGPTModal: () => void;
  onExportFeedback: () => void; // ✅ NEW: Export feedback function
};

export default function Toolbar({ songs, onImport, onClear, onOpenChatGPTModal, onExportFeedback }: Props) {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    const csv = toCSV(songs);
    downloadFile("songs.csv", csv, "text/csv;charset=utf-8");
  };

  const triggerCSV = () => csvInputRef.current?.click();
  const triggerJSON = () => jsonInputRef.current?.click();

  const readFileAsText = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = reject;
      r.readAsText(file);
    });

  const onCSVChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readFileAsText(file);
    try {
      const incoming = fromCSV(text);
      onImport(incoming);
    } catch (err: any) {
      alert(err?.message ?? "Failed to import CSV.");
    } finally {
      e.currentTarget.value = "";
    }
  };

  const onJSONChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readFileAsText(file);
    try {
      const incoming = fromJSON(text);
      onImport(incoming);
    } catch (err: any) {
      alert(err?.message ?? "Failed to import JSON.");
    } finally {
      e.currentTarget.value = "";
    }
  };

  const btn =
    "px-3 py-2 rounded-xl border shadow-sm text-sm bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-750 transition-colors";

  return (
    <div className="container mx-auto px-4 py-4 flex items-center gap-2 border-b border-gray-700 bg-gray-900">
      {/* ✅ Dark mode: gray-900 background */}
      
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={onCSVChange}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={onJSONChange}
      />

      <button onClick={triggerCSV} className={btn}>
        Import CSV (EN/ES)
      </button>

      <button onClick={triggerJSON} className={btn}>
        Import JSON (EN/ES)
      </button>

      <button
        onClick={onOpenChatGPTModal}
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 font-medium transition-colors"
      >
        🤖 Import from ChatGPT
      </button>

      {/* ✅ NEW: Export Feedback Button */}
      <button
        onClick={onExportFeedback}
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-blue-600 text-white border-blue-600 hover:bg-blue-700 font-medium transition-colors"
      >
        📤 Export Feedback
      </button>

      <button onClick={handleExportCSV} className={btn}>
        Export CSV (EN)
      </button>

      {onClear && (
        <button
          onClick={onClear}
          className="ml-auto px-3 py-2 rounded-xl border shadow-sm text-sm bg-red-600 text-white border-red-600 hover:bg-red-700 transition-colors"
        >
          Delete All
        </button>
      )}
    </div>
  );
}
