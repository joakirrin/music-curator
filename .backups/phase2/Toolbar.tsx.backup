// src/components/Toolbar.tsx
import type { Song } from "../types/song";
import type { Playlist } from "../types/playlist";

const GPT_URL =
  "https://chatgpt.com/g/g-69095d95449c8191a6e34a297676dae2-fonea-companion-gpt";

type Props = {
  songs: Song[];
  playlists: Playlist[];
  onClear?: () => void;
  onOpenChatGPTModal: () => void;
  onExportFeedback: () => void;
  onGetReplacements: () => void;
  onOpenPlaylistsDrawer: () => void;
  onOpenCreatePlaylist: () => void;
};

export default function Toolbar({ 
  songs, 
  playlists,
  onClear, 
  onOpenChatGPTModal, 
  onExportFeedback,
  onGetReplacements,
  onOpenPlaylistsDrawer,
  onOpenCreatePlaylist,
}: Props) {
  // Calculate failed tracks count for button display
  const failedCount = songs.filter(s => s.verificationStatus === 'failed').length;
  
  // Calculate Keep songs count for Create Playlist badge
  const keepCount = songs.filter(s => s.feedback === 'keep').length;

  return (
    <div className="container mx-auto px-4 py-4 flex items-center gap-2 border-b border-gray-700 bg-gray-900 flex-wrap">
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

      {/* Companion GPT Link */}
      <a
        href={GPT_URL}
        target="_blank"
        rel="noreferrer"
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-purple-600 text-white border-purple-600 hover:bg-purple-700 font-medium transition-colors"
        title="Open the Fonea Companion GPT in a new tab"
      >
        🧠 Open Companion GPT
      </a>

      {/* Get Replacements Button */}
      {failedCount > 0 && (
        <button
          onClick={onGetReplacements}
          className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-orange-600 text-white border-orange-600 hover:bg-orange-700 font-medium transition-colors inline-flex items-center gap-1"
          title={`Get replacements for ${failedCount} failed track${failedCount !== 1 ? 's' : ''}`}
        >
          <span>🔄 Get Replacements</span>
          <span className="px-1.5 py-0.5 rounded-full bg-orange-700 text-xs font-bold">
            {failedCount}
          </span>
        </button>
      )}

      {/* ✅ NEW: Create Playlist Button */}
      <button
        onClick={onOpenCreatePlaylist}
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-purple-600 text-white border-purple-600 hover:bg-purple-700 font-medium transition-colors inline-flex items-center gap-2"
      >
        <span>➕</span>
        <span>Create Playlist</span>
        {keepCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-purple-700 text-xs font-bold">
            {keepCount}
          </span>
        )}
      </button>

      {/* ✅ NEW: Playlists Counter Button - opens drawer */}
      {playlists.length > 0 && (
        <button
          onClick={onOpenPlaylistsDrawer}
          className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-gray-700 text-white border-gray-600 hover:bg-gray-600 font-medium transition-colors inline-flex items-center gap-2"
        >
          <span>📚</span>
          <span>{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</span>
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
