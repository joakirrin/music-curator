// src/components/chat/ChatInput.tsx
import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

type Props = {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  preFilledMessage?: string; // 🆕 Phase 2.2: Support pre-filled messages
  showWelcome?: boolean; // 🆕 Phase 2.2: Show welcome message
};

export default function ChatInput({ 
  onSend, 
  isLoading, 
  disabled,
  preFilledMessage,
  showWelcome = false
}: Props) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set pre-filled message when provided
  useEffect(() => {
    if (preFilledMessage) {
      setInput(preFilledMessage);
      // Focus and move cursor to end
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(preFilledMessage.length, preFilledMessage.length);
        }
      }, 100);
    }
  }, [preFilledMessage]);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !isLoading) {
      onSend(trimmedInput);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-gray-700 bg-gray-800">
      {/* 🆕 PHASE 2.2: Welcome Message */}
      {showWelcome && (
        <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="text-sm text-gray-200 mb-3">
            <div className="font-semibold mb-2">💬 Welcome to Fonea Music Curator!</div>
            <div className="text-gray-400 mb-3">Tell me the vibe you're looking for:</div>
          </div>
          
          <div className="space-y-2 text-xs text-gray-400 mb-3">
            <div>🎸 "Upbeat indie rock for summer road trip"</div>
            <div>🌙 "Melancholic electronic for late-night focus"</div>
            <div>🏃 "Energetic pop for morning workout"</div>
          </div>
          
          <div className="text-xs text-emerald-400 border-t border-gray-600 pt-2 mt-2">
            💡 Tips: Include mood, context, and energy level. We recommend 5 songs at a time, but ask for as many as you want!
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-3 flex items-center gap-2 text-sm text-emerald-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>GPT is thinking...</span>
        </div>
      )}

      {/* 🆕 PHASE 2.2: Pre-filled message hint */}
      {preFilledMessage && (
        <div className="mb-2 text-xs text-gray-400 flex items-center gap-1">
          💡 Edit this message if you want to add more context
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your vibe..."
          disabled={isLoading || disabled}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading || disabled}
          className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
