// src/components/SessionIndicator.tsx
/**
 * Displays current session duration and provides "New Session" button
 */

import { useSessionState } from '@/hooks/useSessionState';

type Props = {
  songCount: number;
  onNewSession: () => void;
};

export function SessionIndicator({ songCount, onNewSession }: Props) {
  const { formattedDuration } = useSessionState();

  const handleNewSession = () => {
    if (songCount > 0) {
      const confirm = window.confirm(
        '🔄 Start a new session?\n\n' +
        'This will clear your chat and library.\n' +
        'Songs in playlists will be kept.'
      );
      if (confirm) {
        onNewSession();
      }
    } else {
      onNewSession();
    }
  };

  return (
    <div className="container mx-auto px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🎵</span>
          <span className="font-medium text-white">{songCount}</span>
          <span>song{songCount !== 1 ? 's' : ''} in library</span>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <span className="text-gray-600">·</span>
          <span className="text-emerald-400">📅</span>
          <span>Session: <span className="font-medium text-white">{formattedDuration}</span></span>
        </div>
      </div>

      <button
        onClick={handleNewSession}
        className="px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white hover:border-emerald-500 transition-colors inline-flex items-center gap-2"
        title="Clear chat and library, start fresh session"
      >
        <span>🔄</span>
        <span className="hidden md:inline">New Session</span>
      </button>
    </div>
  );
}
