// src/components/chat/ChatHeader.tsx
import { X, Trash2 } from "lucide-react";

type Props = {
  onClose: () => void;
  onClearHistory: () => void;
  messageCount: number;
};

export default function ChatHeader({ onClose, onClearHistory, messageCount }: Props) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold text-white">
          💬 Chat with GPT-5-mini
        </div>
        {messageCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold">
            {messageCount}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Clear History Button */}
        {messageCount > 0 && (
          <button
            onClick={onClearHistory}
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
