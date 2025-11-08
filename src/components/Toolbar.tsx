// src/components/Toolbar.tsx
import type { Song } from "../types/song";

const GPT_URL =
  "https://chatgpt.com/g/g-69095d95449c8191a6e34a297676dae2-fonea-companion-gpt";

type Props = {
  songs: Song[];
  onClear?: () => void;
  onOpenChatGPTModal: () => void;
  onExportFeedback: () => void;
  onGetReplacements: () => void;
};

export default function Toolbar({ 
  songs, 
  onClear, 
  onOpenChatGPTModal, 
  onExportFeedback,
  onGetReplacements,
}: Props) {
  // ✅ NEW: Calculate failed tracks count for button display
  const failedCount = songs.filter(s => s.verificationStatus === 'failed').length;

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
      <a
        href={GPT_URL}
        target="_blank"
        rel="noreferrer"
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-purple-600 text-white border-purple-600 hover:bg-purple-700 font-medium transition-colors"
        title="Open the Fonea Companion GPT in a new tab"
        >
        🧠 Open Companion GPT
      </a>


      {/* ✅ NEW: Get Replacements Button (Phase 2.2 - Chunk 1) */}
      {failedCount > 0 && (
        <button
          onClick={onGetReplacements}
          className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-orange-600 text-white border-orange-600 hover:bg-orange-700 font-medium transition-colors"
          title={`Get replacements for ${failedCount} failed track${failedCount !== 1 ? 's' : ''}`}
        >
          🔄 Get Replacements {failedCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-700 text-xs font-bold">
              {failedCount}
            </span>
          )}
        </button>
      )}

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
