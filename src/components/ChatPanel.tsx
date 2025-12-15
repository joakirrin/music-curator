// src/components/ChatPanel.tsx
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./chat/ChatHeader";
import ChatInput from "./chat/ChatInput";
import { ChatMessage } from "./chat/ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import type { Song } from "@/types/song";
import type { Playlist } from "@/types/playlist";
import { getRecommendationsFromVibe } from "@/services/openai/openaiService";
import { mapChatGPTRecommendationToSong } from "@/utils/songMappers";
import { AlertCircle } from "lucide-react";
import { FreshStartBanner } from "./FreshStartBanner";

type Props = {
  isOpen: boolean;
  messages: ChatMessageType[];
  isLoading: boolean;
  currentRound: number;
  songs: Song[]; // 🆕 PHASE 3
  playlists: Playlist[]; // 🆕 PHASE 3
  onClose: () => void;
  onClearHistory: () => void;
  onClearLibrary: () => void; // 🆕 PHASE 3
  onAddMessage: (message: ChatMessageType) => void;
  onUpdateLastMessage: (updates: Partial<ChatMessageType>) => void;
  onUpdateChatMessage?: (id: string, updates: Partial<ChatMessageType>) => void;
  onSetLoading: (loading: boolean) => void;
  onIncrementRound: () => void;
  onImportSongs: (songs: Song[]) => Promise<void>;
  onCancelVerification?: (messageId: string) => void;
  parseTimeoutExtension: (userMessage: string) => number | null;
  preFilledMessage?: string;
};

// 🆕 PHASE 3: Detect "fresh start" phrases in GPT responses
function detectFreshStartKeywords(text: string): boolean {
  const keywords = [
    'fresh start',
    'start fresh',
    'new playlist',
    'start over',
    'clean slate',
    'begin again',
    'start anew',
    'new session',
    'clear everything',
    'wipe clean',
  ];
  
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
}

export default function ChatPanel({
  isOpen,
  messages,
  isLoading,
  currentRound,
  songs,
  playlists,
  onClose,
  onClearHistory,
  onClearLibrary,
  onAddMessage,
  onUpdateLastMessage,
  onUpdateChatMessage,
  onSetLoading,
  onIncrementRound,
  onImportSongs,
  onCancelVerification,
  parseTimeoutExtension,
  preFilledMessage,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 🆕 PHASE 3: Track if last message suggested fresh start
  const [showFreshStartBanner, setShowFreshStartBanner] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // 🆕 PHASE 3: Check if last assistant message suggests fresh start
  useEffect(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find(m => m.role === 'assistant');
    
    if (lastAssistantMessage && lastAssistantMessage.content) {
      const shouldShow = detectFreshStartKeywords(lastAssistantMessage.content);
      setShowFreshStartBanner(shouldShow);
    } else {
      setShowFreshStartBanner(false);
    }
  }, [messages, songs.length]); // ← Add songs.length to deps

  // Handle sending a message to GPT
  const handleSendMessage = async (userPrompt: string, forceSongMode: boolean = false, strictJson: boolean = false) => {
    // Check if user is trying to extend timeout
    const timeoutExtension = parseTimeoutExtension(userPrompt);
    
    if (timeoutExtension) {
      const lastVerifyingMessage = [...messages]
        .reverse()
        .find(m => m.verificationStatus === 'in_progress');
      
      if (lastVerifyingMessage && lastVerifyingMessage.id) {
        if (onUpdateChatMessage) {
          onUpdateChatMessage(lastVerifyingMessage.id, {
            verificationTimeoutSeconds: timeoutExtension
          });
        } else {
          onUpdateLastMessage({
            verificationTimeoutSeconds: timeoutExtension
          });
        }
        
        onAddMessage({
          id: `system-${Date.now()}`,
          role: 'system',
          content: `✓ Verification timeout extended to ${timeoutExtension} seconds`,
          timestamp: Date.now(),
        });
        
        return;
      } else {
        onAddMessage({
          id: `system-${Date.now()}`,
          role: 'system',
          content: `⚠️ No active verification to extend`,
          timestamp: Date.now(),
        });
        return;
      }
    }

    onSetLoading(true);

    try {
      // 1. Add user message to chat
      const userMessage: ChatMessageType = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userPrompt,
        timestamp: Date.now(),
      };
      onAddMessage(userMessage);

      // 2. Build conversation history
      const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = messages
        .filter(msg => msg.role === "user" || msg.role === "assistant")
        .filter(msg => msg.content !== "soft_error_recovery") // Skip recovery UI messages
        .map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));
      
      conversationHistory.push({
        role: "user",
        content: userPrompt,
      });

      // 3. Determine mode
      const mode = forceSongMode ? "songs" : "auto";

      // 4. Call OpenAI service
      const response = await getRecommendationsFromVibe(
        userPrompt,
        5,
        conversationHistory.slice(0, -1),
        mode,
        strictJson // Pass strict JSON mode flag
      );

      // 5. Handle response based on type
      if (response.type === "soft_error") {
        // SOFT ERROR: Show GPT's text + recovery options
        const assistantMessage: ChatMessageType = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.explanationText || "I had trouble generating songs.",
          timestamp: Date.now(),
        };
        onAddMessage(assistantMessage);

        // Add recovery UI
        if (response.error?.recoveryOptions) {
          const recoveryMessage: ChatMessageType = {
            id: `recovery-${Date.now()}`,
            role: "system",
            content: "soft_error_recovery",
            timestamp: Date.now(),
            metadata: {
              errorMessage: response.error.message,
              recoveryOptions: response.error.recoveryOptions,
            },
          };
          onAddMessage(recoveryMessage);
        }

      } else if (response.type === "conversation") {
        // CONVERSATION: Just show GPT's text (no songs)
        const assistantMessage: ChatMessageType = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.explanationText,
          timestamp: Date.now(),
        };
        onAddMessage(assistantMessage);

      } else if (response.type === "success" && response.songsJson) {
        // SUCCESS: Show text + songs
        const assistantMessage: ChatMessageType = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.explanationText,
          timestamp: Date.now(),
          verificationStatus: "pending",
        };
        onAddMessage(assistantMessage);

        // Map songs
        const songs = response.songsJson.recommendations.map((rec, index) =>
          mapChatGPTRecommendationToSong(
            {
              title: rec.title,
              artist: rec.artist,
              album: rec.album,
              year: rec.year,
              reason: rec.reason || rec.comment,
              duration: rec.duration,
            },
            currentRound,
            index,
            true
          )
        );

        // Update message with songs
        onUpdateLastMessage({ songs });

        // Import and verify
        await onImportSongs(songs);
        onIncrementRound();

      } else {
        // SUCCESS but no songs (shouldn't happen, but handle it)
        const assistantMessage: ChatMessageType = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.explanationText,
          timestamp: Date.now(),
        };
        onAddMessage(assistantMessage);
      }

    } catch (err) {
      // HARD ERROR: Network/API failures only
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `❌ Connection error: ${err instanceof Error ? err.message : "Unknown error"}`,
        timestamp: Date.now(),
        verificationStatus: "failed",
      };
      onAddMessage(errorMessage);
    } finally {
      onSetLoading(false);
    }
  };

  // Handle recovery button clicks
  const handleRecoveryAction = (action: string) => {
    if (action === "retry" || action === "regenerate") {
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
      if (lastUserMessage) {
        handleSendMessage(lastUserMessage.content, true, true); // Force song mode + strict JSON
      }
    }
    // "continue" action does nothing - just dismisses
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Chat Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full bg-gray-900 border-l border-gray-700 shadow-2xl z-50
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          w-full md:w-[400px]
        `}
      >
        {/* Header */}
        <ChatHeader
          onClose={onClose}
          onClearHistory={onClearHistory}
          messageCount={messages.length}
        />

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🎵</div>
              <div className="text-lg font-medium text-gray-300 mb-2">
                Start a conversation
              </div>
              <div className="text-sm text-gray-500 max-w-xs">
                Ask for music recommendations based on your mood, vibe, or favorite artists
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                // Handle soft error recovery UI
                if (message.role === "system" && message.content === "soft_error_recovery") {
                  return (
                    <div key={message.id} className="p-4 bg-orange-900/20 border border-orange-600 rounded-lg">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-200">
                          {message.metadata?.errorMessage || "I had trouble with that response."}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {message.metadata?.recoveryOptions?.map((option: any) => (
                          <button
                            key={option.action}
                            onClick={() => handleRecoveryAction(option.action)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                    onCancelVerification={onCancelVerification}
                  />
                );
              })}
              
              {/* 🆕 PHASE 3: Fresh Start Banner */}
              {showFreshStartBanner && songs.length > 0 && (
                <FreshStartBanner
                  songs={songs}
                  playlists={playlists}
                  onClearLibrary={() => {
                    onClearLibrary();
                    setShowFreshStartBanner(false);
                  }}
                />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={(msg) => handleSendMessage(msg, false, false)}
          isLoading={isLoading}
          preFilledMessage={preFilledMessage}
          showWelcome={messages.length === 0}
        />
      </div>
    </>
  );
}
