// src/components/chat/ChatMessage.tsx
import type { ChatMessage } from "@/types/chat";
import { Music } from "lucide-react";
import VerificationProgress from "./VerificationProgress";

type Props = {
  message: ChatMessage;
};

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3 shadow-lg
          ${isUser 
            ? "bg-emerald-600 text-white" 
            : "bg-gray-800 text-gray-100 border border-gray-700"
          }
        `}
      >
        {/* Message Content */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Assistant-specific: Song count and status */}
        {!isUser && message.songs && message.songs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2 text-xs">
              <Music className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">
                {message.songs.length} song{message.songs.length !== 1 ? 's' : ''} added to your list
              </span>
            </div>

            {/* Verification Progress */}
            {message.verificationProgress && (
              <VerificationProgress
                total={message.verificationProgress.total}
                verified={message.verificationProgress.verified}
                failed={message.verificationProgress.failed}
                isComplete={message.verificationStatus === 'complete'}
              />
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`mt-2 text-xs ${isUser ? "text-emerald-200" : "text-gray-500"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}
