// src/components/UndoIndicator.tsx
/**
 * Persistent undo indicator with minimize/expand functionality
 * Can be collapsed to a small badge to save screen space
 */

import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

type Props = {
  canUndo: boolean;
  songsCount: number;
  secondsRemaining: number;
  onUndo: () => void;
};

const MINIMIZE_STORAGE_KEY = 'fonea-undo-minimized';

export function UndoIndicator({ canUndo, songsCount, secondsRemaining, onUndo }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<string>('10:00');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  
  // Load minimized state from localStorage
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    const stored = localStorage.getItem(MINIMIZE_STORAGE_KEY);
    return stored === 'true';
  });
  
  useEffect(() => {
    const minutes = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    setTimeRemaining(`${minutes}:${secs.toString().padStart(2, '0')}`);
    
    // Highlight if less than 1 minute remaining
    setIsExpiringSoon(secondsRemaining < 60);
  }, [secondsRemaining]);
  
  // Save minimized preference
  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem(MINIMIZE_STORAGE_KEY, newState.toString());
  };
  
  if (!canUndo) return null;
  
  // Minimized state - compact badge
  if (isMinimized) {
    return (
      <button
        onClick={toggleMinimize}
        className={`
          fixed bottom-20 left-6 z-40 
          bg-gray-900 border rounded-full shadow-xl px-4 py-2.5
          hover:scale-105 active:scale-95 transition-all duration-200
          inline-flex items-center gap-3
          ${isExpiringSoon ? 'border-orange-500 animate-pulse' : 'border-emerald-600'}
        `}
        title="Click to expand backup options"
      >
        <span className="text-xl">📦</span>
        <span 
          className={`
            text-sm font-mono font-semibold
            ${isExpiringSoon ? 'text-orange-400' : 'text-emerald-400'}
          `}
        >
          {timeRemaining}
        </span>
        <ChevronUp className="w-4 h-4 text-gray-400" />
      </button>
    );
  }
  
  // Expanded state - full card
  return (
    <div 
      className={`
        fixed bottom-20 left-6 z-40 
        bg-gray-900 border rounded-xl shadow-2xl p-4 
        animate-in slide-in-from-bottom-4 duration-300
        ${isExpiringSoon ? 'border-orange-500 animate-pulse' : 'border-emerald-600'}
      `}
      style={{ maxWidth: '320px' }}
    >
      {/* Header with minimize button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <span>📦</span>
            <span>Backup Available</span>
          </div>
          <div className="text-xs text-gray-400">
            {songsCount} song{songsCount !== 1 ? 's' : ''} from last clear
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className={`
              text-xs font-mono px-2 py-1 rounded
              ${isExpiringSoon 
                ? 'text-orange-400 bg-orange-950/50' 
                : 'text-emerald-400 bg-emerald-950/50'
              }
            `}
          >
            {timeRemaining}
          </div>
          
          <button
            onClick={toggleMinimize}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Minimize"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Restore button */}
      <button
        onClick={onUndo}
        className="w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-lg"
      >
        <span>↩️</span>
        <span>Restore Songs</span>
      </button>
      
      {/* Footer text */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {isExpiringSoon 
          ? '⚠️ Expiring soon!' 
          : 'Auto-deletes when timer expires'
        }
      </div>
    </div>
  );
}
