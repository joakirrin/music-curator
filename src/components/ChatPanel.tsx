// src/components/ChatPanel.tsx
import { useEffect, useRef } from "react";
import ChatHeader from "./chat/ChatHeader";
import ChatInput from "./chat/ChatInput";
import ChatMessage from "./chat/ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import type { Song } from "@/types/song";
import { getRecommendationsFromVibe } from "@/services/openai/openaiService";
import { mapChatGPTRecommendationToSong } from "@/utils/songMappers";

type Props = {
  isOpen: boolean;
  messages: ChatMessageType[];
  isLoading: boolean;
  currentRound: number;
  onClose: () => void;
  onClearHistory: () => void;
  onAddMessage: (message: ChatMessageType) => void;
  onUpdateLastMessage: (updates: Partial<ChatMessageType>) => void;
  onSetLoading: (loading: boolean) => void;
  onIncrementRound: () => void;
  onImportSongs: (songs: Song[]) => Promise<void>;
  preFilledMessage?: string; // 🆕 Phase 2.2: Pre-filled feedback message
};

export default function ChatPanel({
  isOpen,
  messages,
  isLoading,
  currentRound,
  onClose,
  onClearHistory,
  onAddMessage,
  onUpdateLastMessage,
  onSetLoading,
  onIncrementRound,
  onImportSongs,
  preFilledMessage,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle sending a message to GPT
  const handleSendMessage = async (userPrompt: string) => {
    try {
      onSetLoading(true);

      // 1. Add user message to chat
      const userMessage: ChatMessageType = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userPrompt,
        timestamp: Date.now(),
      };
      onAddMessage(userMessage);

      // 2. Build conversation history (all previous messages)
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Add the new user message
      conversationHistory.push({
        role: "user",
        content: userPrompt,
      });

      // 3. Call OpenAI service with full conversation history
      const response = await getRecommendationsFromVibe(
        userPrompt,
        5, // Default count, GPT will extract actual number from prompt
        conversationHistory.slice(0, -1) // Don't include the message we just added
      );

      // 4. Add assistant message with explanation
      const assistantMessage: ChatMessageType = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.explanationText,
        timestamp: Date.now(),
        verificationStatus: response.songsJson ? "pending" : undefined,
      };
      onAddMessage(assistantMessage);

      // 5. If GPT provided songs, process them
      if (response.songsJson) {
        // Map LLM songs to Song objects with current round
        const songs = response.songsJson.recommendations.map((rec, index) =>
          mapChatGPTRecommendationToSong(
            {
              title: rec.title,
              artist: rec.artist,
              album: rec.album,
              year: rec.year,
              reason: rec.reason,
              duration: rec.duration,
            },
            currentRound,
            index,
            true // autoVerify = true
          )
        );

        // Update assistant message with songs
        onUpdateLastMessage({ songs });

        // Trigger auto-import and verification
        await onImportSongs(songs);

        // Increment round for next recommendation
        onIncrementRound();
      }
      // If no songs (conversational response), just show the message

    } catch (err) {
      // Handle errors
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `❌ Sorry, I encountered an error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        timestamp: Date.now(),
        verificationStatus: "failed",
      };
      onAddMessage(errorMessage);
    } finally {
      onSetLoading(false);
    }
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
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          preFilledMessage={preFilledMessage}
          showWelcome={messages.length === 0}
        />
      </div>
    </>
  );
}
