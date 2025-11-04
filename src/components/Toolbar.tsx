// src/components/Toolbar.tsx
import type { Song } from "../types/song";

type Props = {
  songs: Song[];
  onClear?: () => void;
  onOpenChatGPTModal: () => void;
  onExportFeedback: () => void;
};

export default function Toolbar({ songs, onClear, onOpenChatGPTModal, onExportFeedback }: Props) {
  return (
    <div className="container mx-auto px-4 py-4 flex items-center gap-2 border-b border-gray-700 bg-gray-900">
      {/* ChatGPT Import Button */}
      <button
        onClick={onOpenChatGPTModal}
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 font-medium transition-colors"
      >
        🤖 Import from ChatGPT
      </button>

      {/* Export Feedback Button */}
      <button
        onClick={onExportFeedback}
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-blue-600 text-white border-blue-600 hover:bg-blue-700 font-medium transition-colors"
      >
        📤 Export Feedback
      </button>

      {/* Delete All Button */}
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
