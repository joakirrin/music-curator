// src/components/Toolbar.tsx
import type { Song } from "../types/song";
import type { Playlist } from "../types/playlist";

const GPT_URL =
  "https://chatgpt.com/g/g-69095d95449c8191a6e34a297676dae2-fonea-companion-gpt";

type Props = {
  songs: Song[];
  playlists: Playlist[];
  onClear?: () => void;
  onExportFeedback: () => void;
  onGetReplacements: () => void;
  onOpenPlaylistsDrawer: () => void;
  onOpenCreatePlaylist: () => void;
  onOpenChat: () => void; // 🆕 PHASE 2: Open chat button
  onOpenImportYouTube: () => void; // 🆕 CHUNK 7: Import from YouTube
};

export default function Toolbar({ 
  songs, 
  playlists,
  onClear, 
  onExportFeedback,
  onGetReplacements,
  onOpenPlaylistsDrawer,
  onOpenCreatePlaylist,
  onOpenChat, // 🆕 PHASE 2
  onOpenImportYouTube, // 🆕 CHUNK 7
}: Props) {
  // Calculate failed tracks count for button display
  const failedCount = songs.filter(s => s.verificationStatus === 'failed').length;
  
  // Calculate Keep songs count for Create Playlist badge
  const keepCount = songs.filter(s => s.feedback === 'keep').length;

  return (
    <div className="container mx-auto px-4 py-4 flex items-center gap-2 border-b border-gray-700 bg-gray-900 flex-wrap">
      {/* 🆕 PHASE 2: Open Chat Button */}
      <button
        onClick={onOpenChat}
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-purple-600 text-white border-purple-600 hover:bg-purple-700 font-medium transition-colors"
      >
        💬 Open Chat
      </button>

      {/* 🆕 CHUNK 7: Import from YouTube Button */}
      <button
        onClick={onOpenImportYouTube}
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-red-600 text-white border-red-600 hover:bg-red-700 font-medium transition-colors inline-flex items-center gap-2"
        title="Import a playlist from YouTube"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <span>Import from YouTube</span>
      </button>

      {/* ChatGPT Import Button - HIDDEN (Phase 2.1) 
          Keeping code for potential fallback, but hiding in favor of integrated chat */}
      {/* <button
        onClick={onOpenChatGPTModal}
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 font-medium transition-colors"
      >
        🤖 Import from ChatGPT
      </button> */}

      {/* 🆕 PHASE 2.2: Refine with Feedback Button (renamed from Export Feedback) */}
      <button
        onClick={onExportFeedback}
        className="px-3 py-2 rounded-xl border shadow-sm text-sm bg-blue-600 text-white border-blue-600 hover:bg-blue-700 font-medium transition-colors"
      >
        🎯 Refine with Feedback
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
